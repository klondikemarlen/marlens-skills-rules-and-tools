#!/usr/bin/env node

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const usage = `Usage:
  git edit-commit -e <commit> [new commit message]

Starts an interactive rebase, marks <commit> as edit, optionally amends its
message, then stops so you can edit files and run git rebase --continue.

Examples:
  git edit-commit -e abc123
  git edit-commit -e abc123 "Fix typo in import path."
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

  return result.stdout.trim();
}

function fail(message) {
  console.error(message);
  console.error(usage);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}

const editIndex = args.findIndex((arg) => arg === "-e" || arg === "--edit");
if (editIndex === -1) fail("Missing -e <commit>.");

const targetArg = args[editIndex + 1];
if (!targetArg) fail("Missing commit hash after -e.");

const message = args.slice(editIndex + 2).join(" ").trim();

try {
  const status = run(["status", "--short"]);
  if (status) {
    throw new Error("Worktree is not clean. Commit, stash, or discard unrelated changes before rewriting history.");
  }

  const rebaseDir = run(["rev-parse", "--git-path", "rebase-merge"]);
  const applyDir = run(["rev-parse", "--git-path", "rebase-apply"]);
  const rebaseCheck = spawnSync("test", ["-d", rebaseDir], { stdio: "ignore" });
  const applyCheck = spawnSync("test", ["-d", applyDir], { stdio: "ignore" });
  if (rebaseCheck.status === 0 || applyCheck.status === 0) {
    throw new Error("A rebase is already in progress. Finish it with git rebase --continue or abort it first.");
  }

  const target = run(["rev-parse", "--verify", `${targetArg}^{commit}`]);
  const parentLine = run(["rev-list", "--parents", "-n", "1", target]);
  const [, parent] = parentLine.split(/\s+/);
  const shortTarget = run(["rev-parse", "--short", target]);
  const tempDir = mkdtempSync(join(tmpdir(), "git-edit-commit-"));
  const editorPath = join(tempDir, "sequence-editor.js");

  writeFileSync(
    editorPath,
    `#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
const todoPath = process.argv[2];
const target = process.env.MARLENS_EDIT_COMMIT;
const shortTarget = process.env.MARLENS_EDIT_COMMIT_SHORT;
let changed = false;
const lines = readFileSync(todoPath, "utf8").split("\\n").map((line) => {
  const match = line.match(/^(pick|reword|edit|squash|fixup)\\s+([0-9a-f]+)/);
  if (!match) return line;
  const hash = match[2];
  if (!changed && (target.startsWith(hash) || hash.startsWith(shortTarget))) {
    changed = true;
    return line.replace(/^\\w+/, "edit");
  }
  return line;
});
if (!changed) throw new Error(\`Could not find commit \${shortTarget} in rebase todo.\`);
writeFileSync(todoPath, lines.join("\\n"));
`,
    { mode: 0o700 },
  );

  const rebaseArgs = parent
    ? ["rebase", "-i", parent]
    : ["rebase", "-i", "--root"];

  const rebase = run(rebaseArgs, {
    stdio: "inherit",
    allowFailure: true,
    env: {
      GIT_SEQUENCE_EDITOR: editorPath,
      MARLENS_EDIT_COMMIT: target,
      MARLENS_EDIT_COMMIT_SHORT: shortTarget,
    },
  });

  if (rebase.status !== 0) process.exit(rebase.status ?? 1);

  if (message) {
    run(["commit", "--amend", "-m", message], { stdio: "inherit" });
  }

  console.log(`\nStopped at ${shortTarget}.`);
  console.log("Edit files if needed, then run:");
  console.log("  git add <files>");
  console.log("  git commit --amend --no-edit   # or: git commit --amend -m \"new message\"");
  console.log("  git rebase --continue");
} catch (error) {
  console.error(`git-edit-commit: ${error.message}`);
  process.exit(1);
}
