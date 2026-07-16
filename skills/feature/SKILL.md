---
name: feature
description: Use for user-facing feature work that should flow through an issue, branch, pull request, verification, release, and install check.
---

# Feature Workflow

Read the first available workflow:

1. Local project: `docs/workflows/feature-workflow.md`
2. Legacy local project: `agents/workflows/feature-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://feature/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/feature-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://feature/workflow.md` directly. Do not probe missing literal paths or read them speculatively.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
