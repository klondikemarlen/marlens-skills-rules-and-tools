# Readable Code Workflow

Use as a style modifier for the current coding task, not as a request to search for or refactor unrelated code. Readability is already a baseline expectation; invoking this skill makes that emphasis explicit.

1. Read the target project's conventions and the [Human Readability](../references/code-organization-reference.md#human-readability) standard. Keep the current task's scope, behavior, and delivery requirements.
2. Apply explanatory names, cohesive responsibilities, readable spacing, and straightforward control flow within that scope. Extract a helper only when its meaningful name and boundary reduce the reader's effort; do not trade visible complexity for indirection.
   For requested normalization across related implementations, use [Whole-Family Normalization](../references/code-organization-reference.md#whole-family-normalization): inspect every in-scope member before selecting the clearest existing patterns, then align structure and equivalent behavior while preserving justified role differences.
3. Follow the current request's [Work Level](hands-off-agentic-coding-workflow.md#work-levels) for verification and [review](code-review-workflow.md). Keep ownership, effects, and failure paths clear while editing; readability is not a quality downgrade in quick tweak mode, which stops after the mechanical edit without agent-initiated post-edit verification or re-review. This modifier does not authorize a separate release, new dependencies, unrelated formatting, or repository-wide cleanup.

For a standalone request to find and improve hard-to-read code, use [Simplify](simplify-workflow.md) instead.
