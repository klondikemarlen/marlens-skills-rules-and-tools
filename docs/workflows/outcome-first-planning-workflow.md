# Outcome-First Planning Workflow

Use when a request has a material design choice and needs a bounded implementation path before coding.

## Intent

**WHY this workflow exists:** Design work drifts when implementation choices arrive before the desired end state, evidence, and constraints are explicit.

**WHAT this workflow produces:** A concise outcome-first plan with fit-checked examples, project-pattern alignment, a bounded tool/rule map, and named residual risk.

**Decision Rules:**

- Start from the user-visible success condition or invariant, not from a preferred implementation.
- Treat non-goals and constraints as binding boundaries.
- Validate examples and counter-examples before choosing an interface.
- Read project-local guidance and existing patterns before selecting package assets or tools.
- Prefer the smallest existing workflow, rule, skill, or template that can satisfy the success condition.
- Do not use this workflow for an obvious local or mechanical change; read the local pattern, make the smallest patch, and run its relevant check.
- Stop planning when the residual risk is named and the next implementation step is runnable.

## Required Inputs

Capture these before planning:

- **User story:** who needs what and why.
- **Success condition:** the observable end state or invariant that proves success.
- **Non-goals:** explicitly excluded behavior, integrations, and abstractions.
- **Constraints:** repository rules, compatibility, security, ownership, and release boundaries.

If any input is missing, record the missing decision as a question or choose the narrowest conservative interpretation before editing.

## Choose Execution Mode by Pattern Fit

After a brief read of local guidance, a comparable implementation, and the affected caller-to-result path, choose the mode from evidence rather than task size or a preference for planning:

| Evidence | Execution Mode | Next Step and Stop Condition |
| --- | --- | --- |
| The outcome is clear and existing domain concepts, ownership, lifecycle, and dependency rules cover it. | Plan first, then implement precisely. | Resolve affected contracts, placement, callers, and focused proof before coding; stop planning when the patch is executable and remaining risk is named. Obvious local changes retain the mechanical-change exemption. |
| A requirement contradicts an invariant, crosses an unsupported boundary, or leaves the concept/owner genuinely uncertain. | Minimal framing, then short runnable modeling iterations. | State the accepted outcome, existing constraints, one uncertain hypothesis, and the smallest experiment that distinguishes candidate models. Observe the result, revise the model or boundary, and repeat only for unresolved uncertainty. |

For mixed work, plan the known-fit portion normally and isolate exploration to the uncertain seam; do not redesign stable rails because one part does not fit. Switch from plan-first to exploration when source or a runnable result contradicts the assumed fit, rather than extending the plan to defend it. Switch back to precise implementation when evidence establishes the owner, invariant, handoff, and runnable acceptance check.

Exploration is not permission for random patches, weakened accepted behavior, or speculative shared abstractions. Keep each iteration small and reversible; record the hypothesis, result, and resulting decision in the existing plan or session. Retain a cohesive local solution until shared meaning warrants a pattern. Stop iterating when the accepted outcome and boundary are proven; do not keep experimenting to manufacture a new domain concept. Both modes retain the same review, verification, and release gates.

## Process

### 1. Frame the Outcome First

Write the desired end state in user-visible terms. Name the unacceptable outcome and the complexity ceiling. Do not name implementation files yet.

### 2. Fit-Check Examples

List representative good examples, bad examples, and one missing or ambiguous example. For each, state the expected result and the rule it exercises. Resolve counter-examples before committing to an interface; when evidence requires an experiment, use the exploratory mode above rather than speculating through a complete design.

#### Interaction-Contract Activation

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

Name existing owners rather than adding layers by default: presentation renders the affordance and feedback; interaction state/lifecycle tracks pointer, drag, and cancellation; geometry and policy resolve the target and permitted intent; pure data transformations apply reorder/extract/group changes; persistence commits accepted changes. Keep these seams composed and decisions pure where practical; prefer composition over class hierarchies or framework machinery. See [Outcome-First Planning](../references/outcome-first-planning-reference.md), [Code Organization](../references/code-organization-reference.md), and [Project Knowledge Base](project-knowledge-base-workflow.md). Record durable UX requirements and acceptance scenarios in the product repository's existing product/QA knowledge owners; keep transient execution history in the issue, PR, or session.

Preserve adjacent accepted behaviors unless the user changes them. Fit-check the matrix against the correction and neighboring cases before implementation, then keep the focused acceptance scenarios with their product knowledge owner.

When replacing or intercepting a library's interaction lifecycle, inventory the affected input methods the feature already supports and preserve each begin, move, release, and cancel path unless the product explicitly narrows support. Native DOM drag/drop events do not cover every touch, pointer-capture, or fallback sensor path. Normalize input at the sensor boundary and reuse the existing domain target and commit rules rather than duplicating them per device.

For example, a sortable list that supports mouse and touch can pass native mouse-drop tests while a custom handler listening only for `drop` never commits touch release. Fit-check a real supported touch/fallback release through the shared target rules, cancellation, and release outside a valid target; prove the resulting persisted/user-visible order and no-save invalid/cancel behavior. Synthetic mouse events labeled as touch do not establish sensor parity.

Keep this conditional on the changed lifecycle and affected supported inputs. Do not require an exhaustive device matrix, a new interaction framework, or unrelated keyboard/accessibility scope expansion.

### 3. Align with Project Patterns

Read, in order:

1. `AGENTS.md` and nearer project guidance.
2. Project setup, test, contribution, and release documentation.
3. Existing workflows, skills, references, templates, and rules serving the same concern.
4. Existing callsites and verifiers that establish naming, file shape, and compatibility.

Record which existing pattern is reused and why a new asset is necessary.

For material extensions, use [Pattern Fit and Non-Fit](../references/code-organization-reference.md#pattern-fit-and-non-fit) to name fitting responsibilities and the owner of non-fitting behavior in the existing plan; do not broaden a shared pattern for one outlier.

### 4. Map Tools and Rules

Choose the smallest applicable set from:

- `skills/` for discoverable entrypoints.
- `docs/workflows/` for authoritative procedures.
- `docs/references/` for durable background and guardrails.
- `docs/templates/` for copyable output shapes.
- `rules/` for reusable always-on constraints.
- Existing hands-off, self-improvement, testing, and feature workflows for cross-links.

Do not add runtime orchestration when guidance assets satisfy the success condition.

### 5. Bound the Interface

Prefer a simple, predictable interface. Name the public inputs, outputs, and stop conditions. Reject speculative options, duplicate procedures, and abstractions without a current caller. Confirm the complexity ceiling still holds after integration links and verification are included.

For broad work, bound the delivery sequence with [Plan Reviewable PR Slices](hands-off-agentic-coding-workflow.md#plan-reviewable-pr-slices) before implementation, using the existing plan rather than a separate artifact.

### 6. Iterate Until Risk Converges

Repeat the fit check and pattern alignment after each design change. Stop when either:

- the success condition is covered by examples and a runnable verification gate, and residual risk is named; or
- the remaining uncertainty requires an implementation experiment rather than more planning.

Do not continue planning solely to remove all uncertainty.

## Output Contract

```text
Purpose: <user-visible outcome and success condition>
Constraints: <non-goals, compatibility, security, ownership, release boundaries>
Decision matrix:
| Option | Success condition fit | Complexity | Existing pattern | Decision |
|---|---|---|---|---|
Chosen tools/rules: <skills, workflows, references, templates, rules, and why>
Verification gate: <smallest runnable proof>
Residual risk: <named remaining risk or none>
```

## Related Assets

- Reference: [`../references/outcome-first-planning-reference.md`](../references/outcome-first-planning-reference.md)
- Template: [`../templates/outcome-first-plan-template.md`](../templates/outcome-first-plan-template.md)
- Skill: [`../../skills/outcome-first-planning/SKILL.md`](../../skills/outcome-first-planning/SKILL.md)

## Verification Checklist

- The success condition is observable and not an implementation preference.
- At least one good, bad, and ambiguous example was fit-checked.
- Local guidance and sibling patterns were read before adding assets.
- Non-goals and complexity ceiling are explicit.
- The chosen interface reuses existing assets where possible.
- The verification gate can fail on a plausible design mistake.
- Residual risk is named before implementation begins.
