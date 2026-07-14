---
name: code-review
description: Use when reviewing a branch, pull request, or local diff for correctness, regressions, missing tests, and unnecessary complexity.
---

# Code Review

Read the first available workflow:

1. Local project: `docs/workflows/code-review-workflow.md`
2. Legacy local project: `agents/workflows/code-review-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://code-review/workflow.md` in OMP)
Check/read candidates sequentially. If a local candidate is missing or a read returns Path not found, continue to the next candidate; do not batch local paths. If neither local workflow path exists, read `skill://code-review/workflow.md` directly.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
