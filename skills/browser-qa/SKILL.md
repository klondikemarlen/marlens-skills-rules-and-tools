---
name: browser-qa
description: Use when running browser QA and reporting user-visible validation evidence.
---

# Browser QA

Read the first available browser QA workflow:

1. Local project: `docs/workflows/browser-qa-workflow.md`
2. Legacy local project: `agents/workflows/browser-qa-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://browser-qa/workflow.md` in OMP)
Check candidate existence first (for example with glob). Read only the first existing local workflow file; if neither local workflow exists, read `skill://browser-qa/workflow.md` directly. Do not read missing local paths or batch local candidates.

For PR testing instructions, read the first available testing workflow:

1. Local project: `docs/workflows/testing-instructions-workflow.md`
2. Legacy local project: `agents/workflows/testing-instructions-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [testing-instructions-workflow.md](testing-instructions-workflow.md) in this skill directory (`skill://browser-qa/testing-instructions-workflow.md` in OMP)
Check candidate existence first (for example with glob). Read only the first existing local workflow file; if neither local workflow exists, read `skill://browser-qa/testing-instructions-workflow.md` directly. Do not read missing local paths or batch local candidates.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; workflow files are authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
