---
name: learn
description: Use when capturing durable lessons from user corrections or recent changes; delegates to the local learn workflow.
---

# Learn

Read the first available workflow:

1. Local project: `docs/workflows/learn-workflow.md`
2. Legacy local project: `agents/workflows/learn-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://learn/workflow.md` in OMP)
Check/read candidates sequentially. If a local candidate is missing or a read returns Path not found, continue to the next candidate; do not batch local paths. If neither local workflow path exists, read `skill://learn/workflow.md` directly.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
