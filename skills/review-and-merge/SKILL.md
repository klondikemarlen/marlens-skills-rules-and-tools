---
name: review-and-merge
description: Review an existing PR with Codex and verify it. Merge when no corrections are required; otherwise fix and hand back the open PR for manual re-review unless post-fix merge is explicitly authorized.
---

# Review and Merge

Use the local `docs/workflows/review-and-merge-workflow.md`, then `agents/workflows/review-and-merge-workflow.md`; otherwise use the [packaged workflow](workflow.md).

- If review and verification require no corrections and all applicable gates pass, merge the authorized, verified head.
- If review or verification requires a correction, fix, verify, and push it, then leave the PR open for the maintainer's manual re-review without asking to merge now. A rebase, clean rerun, or repeat invocation does not lift this hold; only explicit merge-after-fixes authority for that PR can authorize the corrected path.

`with override` covers an administrative restriction only. It does not lift the post-fix hold or waive review or verification. See the [decision examples](../../examples/outcome-skills.md#review-and-merge).
