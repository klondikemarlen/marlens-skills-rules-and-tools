---
name: browser-qa
description: Use when running browser QA and reporting user-visible validation evidence.
---

# Browser QA

Use the local `docs/workflows/browser-qa-workflow.md`, then `agents/workflows/browser-qa-workflow.md`; otherwise use the [packaged workflow](workflow.md).

Before declaring automation unavailable or substituting the requested engine, follow [Browser Control Discovery](../../docs/references/browser-qa-techniques-reference.md#browser-control-discovery) alongside project-local setup. Check installed Firefox/Geckodriver and maintained bindings/helpers when Firefox is requested; keep recipes in that reference, not this entrypoint.

For PR testing instructions, use the local `docs/workflows/testing-instructions-workflow.md`, then `agents/workflows/testing-instructions-workflow.md`; otherwise use the [packaged testing workflow](../testing-instructions/workflow.md).

For PR screenshot capture or upload, also use the local `docs/workflows/upload-pr-screenshots-workflow.md`, then `agents/workflows/upload-pr-screenshots-workflow.md`; otherwise use the [packaged screenshot workflow](../../docs/workflows/upload-pr-screenshots-workflow.md). Resolve this route even when the local browser-QA workflow has no screenshot link; preserve deliberate local policy and report conflicting instructions.
