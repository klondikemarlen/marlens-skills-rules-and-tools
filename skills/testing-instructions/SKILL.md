---
name: testing-instructions
description: Use when writing or updating pull request testing instructions.
---

# Testing Instructions

Read the first available workflow:

1. Local project: `docs/workflows/testing-instructions-workflow.md`
2. Legacy local project: `agents/workflows/testing-instructions-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://testing-instructions/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/testing-instructions-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://testing-instructions/workflow.md` directly. Do not probe missing literal paths or read them speculatively.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
