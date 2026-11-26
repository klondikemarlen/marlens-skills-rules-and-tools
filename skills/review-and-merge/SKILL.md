---
name: review-and-merge
description: Explicit operator review and merge. Add "with override" to allow a needed administrative override. Merge the same PR head only after clean review and passing checks; if fixes are needed, verify, push, and wait for manual re-review.
---

# Review and Merge

Use the local `docs/workflows/review-and-merge-workflow.md`, then `agents/workflows/review-and-merge-workflow.md`; otherwise use the [packaged workflow](workflow.md).

Use this only for an explicit operator request. For an authorized Feature or Evolve delivery, select [Autonomous Merge](../autonomous-merge/SKILL.md) instead.

- **Standard:** `/skill:review-and-merge <PR URL>` does not authorize an administrative override.
- **With Override:** `/skill:review-and-merge <PR URL> with override` explicitly allows a needed administrative override for that PR only. Both modes follow the same workflow.

- If no corrections were required, merge only when review and all applicable checks pass for the same head. Pending, failed, stale, or unavailable verification is not a pass.
- If review or verification requires a correction, fix, verify, and push it, then leave the PR open for the maintainer's manual re-review without asking to merge now. A rebase, clean rerun, or repeat invocation does not lift this hold; only explicit merge-after-fixes authority for that PR can authorize the corrected path.

The override mode does not lift the post-fix hold or waive review or verification. See the [decision examples](../../examples/outcome-skills.md#review-and-merge).
