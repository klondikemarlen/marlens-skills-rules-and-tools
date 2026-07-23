# Backward Reasoning Workflow

Use when a design-heavy request needs a bounded implementation path before coding.

## Intent

Backward reasoning starts with the user-visible Gold or invariant, validates examples and constraints, aligns with project patterns, and derives the smallest predictable implementation choice.

This packaged fallback preserves the local workflow contract when a target project does not provide its own `docs/workflows/backward-reasoning-workflow.md`.

## Required Inputs

- **User story:** who needs what and why.
- **Gold:** the observable end state or invariant that proves success.
- **Non-goals:** explicitly excluded behavior, integrations, and abstractions.
- **Constraints:** repository rules, compatibility, security, ownership, and release boundaries.

## Process

1. **Frame the outcome.** State the Gold, unacceptable outcome, and complexity ceiling before naming implementation files.
2. **Fit-check examples.** Record good, bad, and ambiguous examples with expected results; resolve counter-examples before choosing an interface.
3. **Align with local patterns.** Read project guidance, setup/test/release docs, sibling workflows, skills, references, templates, rules, callers, and verifiers before adding assets.
4. **Map tools and rules.** Choose the smallest applicable existing skills, workflows, references, templates, or rules. Do not add runtime orchestration for a guidance problem.
5. **Bound the interface.** Name public inputs, outputs, stop conditions, and rejected speculative flexibility.
6. **Converge.** Stop when the Gold is covered by examples and a runnable verification gate exists with residual risk named. Ask only when an unresolved decision materially changes ownership, security, compatibility, or the public interface; otherwise run an experiment.

## Output Contract

```text
Purpose: <user-visible outcome and Gold>
Constraints: <non-goals, compatibility, security, ownership, release boundaries>
Decision matrix:
| Option | Gold fit | Complexity | Existing pattern | Decision |
|---|---|---|---|---|
Chosen tools/rules: <skills, workflows, references, templates, and rules>
Verification gate: <smallest runnable proof>
Residual risk: <named remaining risk or none>
```

## Verification Checklist

- Gold is observable.
- Good, bad, and ambiguous examples have expected outcomes.
- Local guidance and sibling patterns were read.
- Non-goals and the complexity ceiling are explicit.
- The chosen interface is bounded and reuses existing assets.
- The verification gate can fail on a plausible mistake.
- Residual risk is named.
