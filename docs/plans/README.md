# Plans

Exploratory, multi-phase, or migration plans live here.

## Intent

**WHY this directory exists:** Plans preserve the durable contract for complex work without turning a chat transcript or stale checklist into the source of truth.

**WHAT this directory produces:** Spec-first planning documents that separate requirements, design decisions, and execution sequencing.

**Decision Rules:**

- Create a plan only when the work needs requirements discovery, design tradeoffs, cross-file sequencing, or a handoff artifact.
- Skip plans for small mechanical changes.
- Requirements come first, spec second, execution plan last.
- Project-local plans override this shared guidance.

## Plan Shape

A plan has three layers with different stability.

### Requirements

Stable unless the product ask changes.

Capture:

- request summary
- goals
- non-goals
- constraints
- acceptance criteria
- missing requirements or open questions

Ask for missing product requirements before solutioning. Do not invent user roles, business rules, rollout constraints, or success criteria that belong to the requester.

### Proposed Spec

Stable unless the design changes.

Capture:

- current-state summary
- relevant existing patterns to follow
- proposed behavior
- API, data, UI, event, or command interfaces
- edge cases and failure modes
- risks, tradeoffs, and explicit decisions
- verification approach

Prefer one chosen design. If a real decision is still pending, put it under `Open Questions` and record the final choice under `Decisions` when it is made.

### Execution Plan

Expected to change as implementation moves.

Capture current branch reality:

- committed work
- staged work
- unstaged or untracked work
- remaining implementation slices
- cleanup, docs, and verification slices
- files to review and why they matter

When resuming a plan after code has changed, rewrite the execution plan around the current repository state. Keep requirements and spec intact unless the ask or design changed.

## Required Structure

```markdown
# Spec-First Plan: <Descriptive Title>

## Request

<What triggered this work.>

## Requirements

### Goals

- <Outcome that must be true.>

### Non-Goals

- <What this work will not do.>

### Constraints

- <Technical, product, migration, or operational constraint.>

### Acceptance Criteria

- <Observable proof the work is done.>

## Current State

- <How the system works today.>
- <Relevant files, existing behavior, existing pattern.>

## Proposed Spec

### Design Summary

<Chosen design.>

### Behavior

- <Normal path.>
- <Edge case or failure path.>
- <Migration or compatibility rule.>

### Interfaces and Data

- <Routes, models, events, component props, payloads, commands, or config.>

### Risks and Tradeoffs

- <Risk or tradeoff.>

## Open Questions

- <Question still needing an answer.>

## Decisions

- <Decision already made and why.>

## Verification

- <Specific tests or scenarios to run.>

## Execution Plan

### Current Branch State

- **Committed:** <Already done.>
- **Staged:** <Currently staged.>
- **Unstaged / Untracked:** <Still local.>

### Remaining Slices

1. <First implementation slice.>
2. <Second implementation slice.>
3. <Cleanup, docs, or verification slice.>

## Files to Review

1. `path/to/file` - <Why it matters.>

## Related Issues

- <Ticket, PR, issue, or external reference.>
```

## Writing Rules

1. Requirements before solutions.
2. Spec before checklist.
3. Separate durable truth from branch state.
4. State non-goals explicitly.
5. Acceptance criteria must be observable.
6. Use current code and existing patterns; do not invent a second convention.
7. Keep `Files Changed` out of planning docs; it belongs in PR notes or delivery summaries.
8. Ask for missing requirements early instead of faking product clarity.
9. If a plan file is untracked, treat it as planning context unless the user asks to version it.

## File Naming

Use a descriptive title that starts with the plan type when useful:

```text
Plan, <Title>, YYYY-MM-DD.md
Backend Refactoring, <Title>, YYYY-MM-DD.md
Frontend Feature, <Title>, YYYY-MM-DD.md
Infrastructure, <Title>, YYYY-MM-DD.md
```

Use ISO dates. Avoid brackets and special characters in filenames.
