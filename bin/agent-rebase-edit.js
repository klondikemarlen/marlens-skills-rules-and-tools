#!/usr/bin/env node

import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const usage = `Usage:
  node bin/agent-rebase-edit.js --message-only <commit> "New commit message"
  node bin/agent-rebase-edit.js --edit <commit> [new commit message]

Agent helper for scripted, non-interactive history edits.

Use --message-only for message-only fixes to commits before HEAD.
Use --edit when code and optionally the message must be amended before later commits replay.
For HEAD, use normal git commit --amend instead.
`;

function run(args, options = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(options.env ?? {}) },
  });

  if (options.allowFailure) return result;

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const detail = stderr || stdout || `git ${args.join(" ")} failed`;
    throw new Error(detail);
  }

  return typeof result.stdout === "string" ? result.stdout.trim() : "";
}

function fail(message) {
  console.error(message);
  console.error(usage);
  process.exit(1);
}

function parseArgs(rawArgs, invokedAs) {
  const args = [...rawArgs];

  if (args.includes("-h") || args.includes("--help")) {
    console.log(usage);
    process.exit(0);
  }

  let mode;
  if (invokedAs.includes("edit-commit")) mode = "edit";

  if (args[0] === "message" || args[0] === "--message" || args[0] === "--message-only" || args[0] === "-m") {
    mode = "message";
    args.shift();
  } else if (args[0] === "edit" || args[0] === "--edit" || args[0] === "-e") {
    mode = "edit";
    args.shift();
  }

  const editFlagIndex = args.findIndex((arg) => arg === "-e" || arg === "--edit");
  if (editFlagIndex !== -1) {
    mode = "edit";
    args.splice(editFlagIndex, 1);
  }

  if (!mode) mode = "edit";

  const target = args.shift();
  if (!target) fail(`Missing commit for ${mode} mode.`);

  const message = args.join(" ").trim();
  if (mode === "message" && !message) fail("Message mode requires a new commit message.");

  return { mode, target, message };
}

function ensureSafeToRewrite(target) {
  const status = run(["status", "--short"]);
  if (status) {
    throw new Error("Worktree is not clean. Commit, stash, or discard unrelated changes before rewriting history.");
  }

  const head = run(["rev-parse", "HEAD"]);
  if (target === head) {
    throw new Error("Target is HEAD. Use normal git commit --amend for the last commit.");
  }

  const rebaseDir = run(["rev-parse", "--git-path", "rebase-merge"]);
  const applyDir = run(["rev-parse", "--git-path", "rebase-apply"]);
  if (existsSync(rebaseDir) || existsSync(applyDir)) {
    throw new Error("A rebase is already in progress. Finish it with git rebase --continue or abort it first.");
  }
}

function writeSequenceEditor(tempDir, action) {
  const editorPath = join(tempDir, "sequence-editor.js");
  writeFileSync(
    editorPath,
    `#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
const todoPath = process.argv[2];
const target = process.env.MARLENS_EDIT_COMMIT;
const shortTarget = process.env.MARLENS_EDIT_COMMIT_SHORT;
const action = process.env.MARLENS_EDIT_ACTION;
let changed = false;
const lines = readFileSync(todoPath, "utf8").split("\\n").map((line) => {
  const match = line.match(/^(pick|reword|edit|squash|fixup)\\s+([0-9a-f]+)/);
  if (!match) return line;
  const hash = match[2];
  if (!changed && (target.startsWith(hash) || hash.startsWith(shortTarget))) {
    changed = true;
    return line.replace(/^\\w+/, action);
  }
  return line;
});
if (!changed) throw new Error(\`Could not find commit \${shortTarget} in rebase todo.\`);
writeFileSync(todoPath, lines.join("\\n"));
`,
    { mode: 0o700 },
  );
  return editorPath;
}

function writeMessageEditor(tempDir, message) {
  const editorPath = join(tempDir, "message-editor.js");
  writeFileSync(
    editorPath,
    `#!/usr/bin/env node
import { writeFileSync } from "node:fs";
const messagePath = process.argv[2];
writeFileSync(messagePath, process.env.MARLENS_COMMIT_MESSAGE + "\\n");
`,
    { mode: 0o700 },
  );
  return editorPath;
}

function rebaseArgsFor(target) {
  const parentLine = run(["rev-list", "--parents", "-n", "1", target]);
  const [, parent] = parentLine.split(/\s+/);
  return parent ? ["rebase", "-i", parent] : ["rebase", "-i", "--root"];
}

function printConflictHelp() {
  console.error("\nIf rebase stopped for conflicts:");
  console.error("  1. Resolve only conflicts caused by this rewrite.");
  console.error("  2. Run the smallest relevant check.");
  console.error("  3. git add <resolved-files>");
  console.error("  4. git rebase --continue");
  console.error("Abort with: git rebase --abort");
}

try {
  const { mode, target: targetArg, message } = parseArgs(process.argv.slice(2), basename(process.argv[1]));
  const target = run(["rev-parse", "--verify", `${targetArg}^{commit}`]);
  ensureSafeToRewrite(target);

  const shortTarget = run(["rev-parse", "--short", target]);
  const tempDir = mkdtempSync(join(tmpdir(), "agent-rebase-edit-"));
  const sequenceEditor = writeSequenceEditor(tempDir, mode === "message" ? "reword" : "edit");
  const env = {
    GIT_SEQUENCE_EDITOR: sequenceEditor,
    MARLENS_EDIT_COMMIT: target,
    MARLENS_EDIT_COMMIT_SHORT: shortTarget,
    MARLENS_EDIT_ACTION: mode === "message" ? "reword" : "edit",
  };

  if (mode === "message") {
    env.GIT_EDITOR = writeMessageEditor(tempDir, message);
    env.MARLENS_COMMIT_MESSAGE = message;
  }

  const rebase = run(rebaseArgsFor(target), {
    stdio: "inherit",
    allowFailure: true,
    env,
  });

  if (rebase.status !== 0) {
    printConflictHelp();
    process.exit(rebase.status ?? 1);
  }

  if (mode === "message") {
    console.log(`\nUpdated message for ${shortTarget}.`);
    process.exit(0);
  }

  if (message) {
    run(["commit", "--amend", "-m", message], { stdio: "inherit" });
  }

  console.log(`\nStopped at ${shortTarget}.`);
  console.log("Edit files if needed, then run:");
  console.log("  git add <files>");
  console.log("  git commit --amend --no-edit   # or: git commit --amend -m \"new message\"");
  console.log("  git rebase --continue");
  printConflictHelp();
} catch (error) {
  console.error(`agent-rebase-edit: ${error.message}`);
  process.exit(1);
}
