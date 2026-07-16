---
name: learn
description: Use when capturing durable lessons from user corrections or recent changes, reviewing incoming `learner:` issues, or implementing new learner-generated tickets; delegates to the local learn workflow.
---

# Learn

Read the first available workflow:

1. Local project: `docs/workflows/learn-workflow.md`
2. Legacy local project: `agents/workflows/learn-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://learn/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/learn-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://learn/workflow.md` directly. Do not probe missing literal paths or read them speculatively.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
