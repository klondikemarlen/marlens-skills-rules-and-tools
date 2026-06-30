#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

const mirrors = {
  "browser-qa": ["browser-qa-workflow.md", "testing-instructions-workflow.md"],
  "code-review": ["code-review-workflow.md"],
  commit: ["commit-workflow.md"],
  "git-rebase": ["git-rebase-workflow.md"],
  learn: ["learn-workflow.md"],
  "pull-request-management": ["pull-request-management-workflow.md"],
  "release-notes": ["release-notes-workflow.md"],
  "testing-instructions": ["testing-instructions-workflow.md"],
};

let dirty = false;

for (const [skill, workflows] of Object.entries(mirrors)) {
  for (const workflow of workflows) {
    const source = join(root, "agents", "workflows", workflow);
    const target = join(root, "skills", skill, "agents", "workflows", workflow);
    const body = await readFile(source, "utf8");
    const expected = `<!-- Derived from agents/workflows/${workflow}. Edit that file, then run npm run sync:skill-workflows. -->\n\n${body}`;

    if (check) {
      let current = "";
      try {
        current = await readFile(target, "utf8");
      } catch {
        dirty = true;
        console.error(`${target} is missing`);
        continue;
      }

      if (current !== expected) {
        dirty = true;
        console.error(`${target} is out of sync`);
      }
      continue;
    }

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, expected);
  }
}

if (dirty) {
  process.exitCode = 1;
}
