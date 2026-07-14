---
name: git-rebase
description: Use when fixing up, amending, rewording, squashing, or reordering older commits with non-interactive git rebase safety.
---

# Git Rebase

Read the first available workflow:

1. Local project: `docs/workflows/git-rebase-workflow.md`
2. Legacy local project: `agents/workflows/git-rebase-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://git-rebase/workflow.md` in OMP)
Check/read candidates sequentially. If a local candidate is missing or a read returns Path not found, continue to the next candidate; do not batch local paths. If neither local workflow path exists, read `skill://git-rebase/workflow.md` directly.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
