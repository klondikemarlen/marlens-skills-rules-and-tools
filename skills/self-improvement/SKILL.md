---
name: self-improvement
description: Use when improving reusable agent guidance, prompt flow, or evidence-backed technical debt; delegates to the local self-improvement workflow.
---

# Self-Improvement

Read the first available workflow:

1. Local project: `docs/workflows/self-improvement-workflow.md`
2. Legacy local project: `agents/workflows/self-improvement-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://self-improvement/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/self-improvement-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://self-improvement/workflow.md` directly. Do not probe missing literal paths or read them speculatively. <!-- agent-guidance-audit: ignore backtick-path -->

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
