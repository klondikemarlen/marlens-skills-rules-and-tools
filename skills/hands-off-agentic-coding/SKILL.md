---
name: hands-off-agentic-coding
description: Use when a user wants autonomous feature or bug-fix execution with exploration, delegation, runnable verification, and PASS/FAIL/BLOCKED evidence.
---

# Hands-Off Agentic Coding Workflow

Read the first available workflow:

1. Local project: `docs/workflows/hands-off-agentic-coding-workflow.md`
2. Legacy local project: `agents/workflows/hands-off-agentic-coding-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://hands-off-agentic-coding/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/hands-off-agentic-coding-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://hands-off-agentic-coding/workflow.md` directly. Do not probe missing literal paths or read them speculatively.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
