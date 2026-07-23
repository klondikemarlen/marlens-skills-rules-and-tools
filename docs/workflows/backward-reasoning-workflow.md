# Backward Reasoning Workflow

Use when a design-heavy request needs a bounded implementation path before coding.

## Intent

**WHY this workflow exists:** Design work drifts when implementation choices arrive before the desired end state, evidence, and constraints are explicit.

**WHAT this workflow produces:** A concise outcome-first plan with fit-checked examples, project-pattern alignment, a bounded tool/rule map, and named residual risk.

**Decision Rules:**

- Start from the user-visible Gold or invariant, not from a preferred implementation.
- Treat non-goals and constraints as binding boundaries.
- Validate examples and counter-examples before choosing an interface.
- Read project-local guidance and existing patterns before selecting package assets or tools.
- Prefer the smallest existing workflow, rule, skill, or template that can satisfy the Gold.
- Stop planning when the residual risk is named and the next implementation step is runnable.

## Required Inputs

Capture these before planning:

- **User story:** who needs what and why.
- **Gold:** the observable end state or invariant that proves success.
- **Non-goals:** explicitly excluded behavior, integrations, and abstractions.
- **Constraints:** repository rules, compatibility, security, ownership, and release boundaries.

If any input is missing, record the missing decision as a question or choose the narrowest conservative interpretation before editing.

## Process

### 1. Frame the Outcome First

Write the desired end state in user-visible terms. Name the unacceptable outcome and the complexity ceiling. Do not name implementation files yet.

### 2. Fit-Check Examples

List representative good examples, bad examples, and one missing or ambiguous example. For each, state the expected result and the rule it exercises. Resolve counter-examples before committing to an interface.

### 3. Align with Project Patterns

Read, in order:

1. `AGENTS.md` and nearer project guidance.
2. Project setup, test, contribution, and release documentation.
3. Existing workflows, skills, references, templates, and rules serving the same concern.
4. Existing callsites and verifiers that establish naming, file shape, and compatibility.

Record which existing pattern is reused and why a new asset is necessary.

### 4. Map Tools and Rules

Choose the smallest applicable set from:

- `skills/` for discoverable entrypoints.
- `docs/workflows/` for authoritative procedures.
- `docs/references/` for durable background and guardrails.
- `docs/templates/` for copyable output shapes.
- `rules/` for reusable always-on constraints.
- Existing hands-off, self-improvement, testing, and feature workflows for cross-links.

Do not add runtime orchestration when guidance assets satisfy the Gold.

### 5. Bound the Interface

Prefer a simple, predictable interface. Name the public inputs, outputs, and stop conditions. Reject speculative options, duplicate procedures, and abstractions without a current caller. Confirm the complexity ceiling still holds after integration links and verification are included.

### 6. Iterate Until Risk Converges

Repeat the fit check and pattern alignment after each design change. Stop when either:

- the Gold is covered by examples and a runnable verification gate, and residual risk is named; or
- the remaining uncertainty requires an implementation experiment rather than more planning.

Do not continue planning solely to remove all uncertainty.

## Output Contract

```text
Purpose: <user-visible outcome and Gold>
Constraints: <non-goals, compatibility, security, ownership, release boundaries>
Decision matrix:
| Option | Gold fit | Complexity | Existing pattern | Decision |
|---|---|---|---|---|
Chosen tools/rules: <skills, workflows, references, templates, rules, and why>
Verification gate: <smallest runnable proof>
Residual risk: <named remaining risk or none>
```

## Verification Checklist

- Gold is observable and not an implementation preference.
- At least one good, bad, and ambiguous example was fit-checked.
- Local guidance and sibling patterns were read before adding assets.
- Non-goals and complexity ceiling are explicit.
- The chosen interface reuses existing assets where possible.
- The verification gate can fail on a plausible design mistake.
- Residual risk is named before implementation begins.
