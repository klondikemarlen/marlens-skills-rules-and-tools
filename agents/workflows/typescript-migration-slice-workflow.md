# TypeScript Migration Slice Workflow

Use when planning and executing one batch of JavaScript-to-TypeScript migration work.

## Intent

**WHY this workflow exists:** TypeScript migrations are safer when each slice has explicit source files, contract sources, validation, and cleanup. Converting everything at once hides stale imports and weakens review.

**WHAT this workflow produces:** A scoped migration slice that converts, merges, or deletes selected JavaScript files and verifies their TypeScript contracts.

**Decision Rules:**

- Prefer small slices that can be reviewed and verified independently.
- Convert existing files in place when history matters; delete or merge files that no longer justify their own module.
- Read backend/API/model/serializer contracts before inventing frontend types.
- Preserve runtime behavior first; improve types without changing semantics unless the issue explicitly asks for behavior changes.
- Remove stale `.js` imports and barrels as part of the same slice.

## Slice Template

```markdown
# TypeScript Migration Slice: <short batch name>

## Scope

- In-scope files:
  - `path/to/file.js` -> `path/to/file.ts`
- Files to delete or merge instead of convert:
  - `path/to/file.js` - <why>

## Contract Sources

- Backend/API model:
- Serializer/response shape:
- Existing TypeScript reference files:

## Migration Notes

- Shared types to export:
- Imports or barrels to update:
- Runtime edge cases to preserve:
- Expected cleanup:

## Validation Plan

- Type-check:
- Lint:
- Targeted tests:

## Done Criteria

- [ ] All in-scope files converted, merged, or deleted.
- [ ] No stale `.js` imports remain for this slice.
- [ ] Type exports line up with consumers.
- [ ] Validation completed or explicitly blocked.

## Follow-Up Candidates

- `next/path.js`
```

## Output Contract

Report the slice name, files converted/deleted, contract sources checked, validation run, and follow-up candidates.
