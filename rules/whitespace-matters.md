---
name: whitespace-matters
description: "Before presenting a change as ready, check mechanical whitespace errors and preserve the target project's local structural whitespace conventions."
condition: "git (commit|push)|pull request|PR|ready for review|review"
scope: "tool:bash"
---

Before presenting a changed file as ready, run `git diff --check` against the relevant change range. Use `--cached` for staged changes and the PR base range for committed review changes.

Treat blank lines and import grouping as structure, not cosmetic churn: read the closest project guidance and inspect nearby touched-file siblings before changing them. Preserve local grouping and separation conventions; do not impose a universal formatter, indentation rule, or language-specific layout.

Keep whitespace-only edits scoped to the changed area unless the user explicitly asks for wider formatting.
