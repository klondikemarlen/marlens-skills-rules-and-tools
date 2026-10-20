---
name: whitespace-matters
description: "Before presenting a change as ready, enforce clean-code whitespace defaults and mechanical whitespace checks unless the user explicitly overrides them."
condition: "\\bgit\\s+(commit|push)\\b|\\bgh\\s+pr\\s+(create|ready|merge)\\b|\\bready for review\\b"
scope: "tool:bash"
---

Before presenting a changed file as ready:

1. Run the project formatter/checker when one exists, then run `git diff --check` against the relevant change range. Use `--cached` for staged changes and the PR base range for committed review changes.
2. Preserve the positions and order of unchanged imports when changing unrelated behavior; do not reorder them merely to tidy or alphabetize the file. Keep required new imports and intentional import changes. For new or intentionally changed imports, keep groups contiguous and separate each group with exactly one blank line, using documented project order or standard-library, third-party, then project-local order. Explicitly requested import cleanup and required project tooling remain valid exceptions; remove equivalent incidental moves across the reviewed diff.
3. Use exactly one blank line between top-level declarations and unrelated logical sibling blocks. Do not use consecutive blank lines. Keep tightly coupled statements and one logical import group together.
4. Keep whitespace-only edits scoped to the changed area.
5. Keep asynchronous setup in the narrowest behavior-specific nested describe; do not put scenario-only setup in a broad test body or shared hook.
   Project-local guidance may refine grouping order but does not weaken these defaults; only explicit user direction permits a departure.
