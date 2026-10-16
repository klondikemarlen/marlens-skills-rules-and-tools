# Outcome-First Planning Workflow

Use when a request has a material design choice and needs a bounded implementation path before coding.

## Intent

Outcome-first planning starts with the user-visible success condition or invariant, validates examples and constraints, aligns with project patterns, and derives the smallest predictable implementation choice.

This packaged fallback preserves the local workflow contract when a target project does not provide its own `docs/workflows/outcome-first-planning-workflow.md`.

## Required Inputs

- **User story:** who needs what and why.
- **Success condition:** the observable end state or invariant that proves success.
- **Non-goals:** explicitly excluded behavior, integrations, and abstractions.
- **Constraints:** repository rules, compatibility, security, ownership, and release boundaries.

Do not use this workflow for an obvious local or mechanical change; read the local pattern, make the smallest patch, and run its relevant check.

## Process

1. **Frame the outcome.** State the success condition, unacceptable outcome, and complexity ceiling before naming implementation files.
2. **Fit-check examples.** Record good, bad, and ambiguous examples with expected results; resolve counter-examples before choosing an interface.
3. **Align with local patterns.** Read project guidance, setup/test/release docs, sibling workflows, skills, references, templates, rules, callers, and verifiers before adding assets.
4. **Map tools and rules.** Choose the smallest applicable existing skills, workflows, references, templates, or rules. Do not add runtime orchestration for a guidance problem.
5. **Bound the interface.** Name public inputs, outputs, stop conditions, and rejected speculative flexibility.
6. **Converge.** Stop when the success condition is covered by examples and a runnable verification gate exists with residual risk named. Ask only when an unresolved decision materially changes ownership, security, compatibility, or the public interface; otherwise run an experiment.

### Interaction-Contract Activation

Revisit the whole relevant interaction contract **before the next gesture patch** when a correction changes coupled interaction behavior, or when corrective UX feedback shows that adjacent behaviors were conflated or missed. Do not plan extensively for isolated wording or another obvious mechanical change; use the mechanical-change exemption above.

Fit-check a small intent matrix, not a generic interaction framework. Keep the dimensions distinct; these example outcomes illustrate a possible accepted contract, not a mandatory product policy:

| Source → target relationship      | Pointer/drop location    | Operation                         | Visual feedback                                             | Persistent effect          | Cancellation / no-op              |
| --------------------------------- | ------------------------ | --------------------------------- | ----------------------------------------------------------- | -------------------------- | --------------------------------- |
| Same group → member               | Between existing members | Internal reorder; keep membership | No external-regroup highlight; reorder preview per contract | Reorder on commit          | Cancel or unchanged drop: no save |
| Other group → valid target        | Inside target            | Join or regroup per contract      | External-grouping preview                                   | Membership/order on commit | Invalid target: no save           |
| First item → outside group        | Before start boundary    | Extract first item                | Boundary target feedback                                    | Membership/order on commit | Cancel: no save                   |
| Last item → outside group         | After end boundary       | Extract last item                 | Boundary target feedback                                    | Membership/order on commit | Cancel: no save                   |
| Any → invalid or unchanged target | No accepted change       | None                              | Clear preview                                               | None                       | No save                           |

Include first and last boundaries when ordering is involved, and fit the example to the accepted product contract. A visual-feedback restriction must not silently disable a separately accepted operation. State cancellation and no-op outcomes explicitly, including whether either persists a change.

Name existing owners rather than adding layers by default: presentation renders the affordance and feedback; interaction state/lifecycle tracks pointer, drag, and cancellation; geometry and policy resolve the target and permitted intent; pure data transformations apply reorder/extract/group changes; persistence commits accepted changes. Keep these seams composed and decisions pure where practical; prefer composition over class hierarchies or framework machinery. See [Outcome-First Planning](../../docs/references/outcome-first-planning-reference.md), [Code Organization](../../docs/references/code-organization-reference.md), and [Project Knowledge Base](../../docs/workflows/project-knowledge-base-workflow.md). Record durable UX requirements and acceptance scenarios in the product repository's existing product/QA knowledge owners; keep transient execution history in the issue, PR, or session.

Preserve adjacent accepted behaviors unless the user changes them. Fit-check the matrix against the correction and neighboring cases before implementation, then keep the focused acceptance scenarios with their product knowledge owner.

## Output Contract

```text
Purpose: <user-visible outcome and success condition>
Constraints: <non-goals, compatibility, security, ownership, release boundaries>
Decision matrix:
| Option | Success condition fit | Complexity | Existing pattern | Decision |
|---|---|---|---|---|
Chosen tools/rules: <skills, workflows, references, templates, and rules>
Verification gate: <smallest runnable proof>
Residual risk: <named remaining risk or none>
```

## Verification Checklist

- The success condition is observable.
- Good, bad, and ambiguous examples have expected outcomes.
- Local guidance and sibling patterns were read.
- Non-goals and the complexity ceiling are explicit.
- The chosen interface is bounded and reuses existing assets.
- The verification gate can fail on a plausible mistake.
- Residual risk is named.
