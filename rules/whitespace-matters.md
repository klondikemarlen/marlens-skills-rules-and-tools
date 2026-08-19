---
name: whitespace-matters
description: 'Before presenting a change as ready, enforce clean-code whitespace defaults and mechanical whitespace checks unless the user explicitly overrides them.'
condition: 'git (commit|push)|pull request|PR|ready for review|review'
scope: 'tool:bash'
---

Before presenting a changed file as ready:

1. Run the project formatter/checker when one exists, then run `git diff --check` against the relevant change range. Use `--cached` for staged changes and the PR base range for committed review changes.
2. Keep import groups contiguous and separate each group with exactly one blank line. Use the project’s documented group order when it has one; otherwise group standard-library, third-party, then project-local imports.
3. Use exactly one blank line between top-level declarations and unrelated logical sibling blocks. Do not use consecutive blank lines. Keep tightly coupled statements and one logical import group together.
4. Keep whitespace-only edits scoped to the changed area.
   These are default cross-project rules. Project-local guidance overrides this default; otherwise depart only when the user explicitly directs it.
