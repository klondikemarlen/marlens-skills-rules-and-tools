# Readable Code Workflow

Use as a style modifier for the current coding task, not as a request to search for or refactor unrelated code. Readability is already a baseline expectation; invoking this skill makes that emphasis explicit.

1. Read the target project's conventions and the [Human Readability](../../docs/references/code-organization-reference.md#human-readability) standard. Keep the current task's scope, behavior, and delivery requirements.
2. Apply explanatory names, cohesive responsibilities, readable spacing, and straightforward control flow within that scope. Use the reference's per-file eligibility rule: exclude incidental-only cleanup files unless cleanup is explicitly requested or necessary for tooling or the accepted contract. Meaningful type, schema, and test changes qualify without a runtime behavior change. Extract a helper only when its meaningful name and boundary reduce the reader's effort; do not trade visible complexity for indirection.
3. Use the task's existing verification and [review](../code-review/workflow.md) procedure. Confirm behavior and make ownership, effects, and failure paths easy to follow. This modifier does not authorize a separate release, new dependencies, unrelated formatting, or repository-wide cleanup.

For a standalone request to find and improve hard-to-read code, use [Simplify](../simplify/workflow.md) instead.
