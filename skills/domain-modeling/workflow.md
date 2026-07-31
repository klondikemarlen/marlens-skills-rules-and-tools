# Domain Modeling Workflow

Use when a feature, bug fix, or refactor needs clearer domain concepts, invariants, lifecycles, boundaries, or behavior before implementation.

## Intent

**WHY this workflow exists:** Domain-shaped names and abstractions are useful only when they make user-visible behavior, owned invariants, and change boundaries clearer.

**WHAT this workflow produces:** A small, evidence-backed domain model and an implementation handoff that can be checked without prescribing DDD or a layered architecture.

**Decision Rules:**

- Start from the user-visible action, outcome, or invariant. Do not start from a preferred class, folder, or framework pattern.
- Read project-local guidance and existing sibling conventions before naming a domain boundary.
- Reuse [`code-organization-reference.md`](../../docs/references/code-organization-reference.md) for vocabulary and pattern-fit criteria, and use the backward-reasoning workflow when the design has unresolved tradeoffs.
- Treat repeated nouns, churn, conditionals, or boundary crossings as hypotheses to investigate, not proof that a new module or abstraction is needed.
- Keep code co-located until a real change axis, invariant boundary, duplicated behavior, or volatile dependency justifies a split.
- Do not prescribe full DDD, Clean Architecture, hexagonal, onion, or framework-specific layering.

## Process

1. State the **Gold**: the user-visible action or domain invariant that must remain true. Record non-goals and the complexity ceiling.
2. Inspect the target topology, cohesive concepts, lifecycles, repeated change clusters, varying dispatch dimensions, owned invariants, dependency direction, and sibling-domain conventions.
3. Name the smallest useful domain concepts and actions. Prefer intention-revealing names over generic `manager`, `processor`, `helper`, or `utils` names.
4. Classify each boundary and its owner:
   - **Data-shape validation:** parse and validate untrusted input once at the request, file, or API boundary.
   - **Domain invariant:** protect a rule that remains true regardless of transport, UI, persistence, or external API shape.
   - **Aggregate/transaction boundary:** keep one domain cluster's invariant-owned state consistent together; do not make a transaction span unrelated aggregates just to preserve a pattern.
   - **Application service/use case:** coordinate one user- or operator-visible action, its authorization, transaction, side effects, and result.
   - **Persistence access:** use the existing model/query/repository convention; add a repository only for real duplication, heavy query construction, or a mapping boundary.
   - **External adapter/gateway:** isolate provider, filesystem, clock, subprocess, framework, or SDK details behind narrow domain-shaped inputs.
5. Fit-check every proposed helper, service, class, value object, repository, adapter, folder, or module against at least one current reason: invariant, named action, boundary/volatility, real duplication, explicit validated handoff, useful change grouping, findable public API, one-way dependency, or safer side-effect/transaction ownership.
6. Validate examples before implementation:
   - **Good:** a repeated date-range rule is parsed once into a value with behavior, and the domain action consumes it without knowing the request format.
   - **Bad:** a one-line local handoff is wrapped in a `PreparedResult` object only to avoid multiple assignment; use named locals or direct values.
   - **Ambiguous:** a repository around an ORM may isolate duplicated, heavy queries, but is unnecessary when the existing model/query rail is already clear and unique.
7. Record the chosen boundary, owned responsibilities, exact values crossing it, dependency direction, and the smallest safe implementation step. If no current reason survives, keep the code together or delete the proposed abstraction.
8. Implement the smallest model that satisfies the Gold. Make the owning behavior checkable at the narrowest evidence layer, then run that check before broad cleanup or reorganization.

## Verification Gate

The design is ready when a maintainer can answer, from the model and its public API:

- What user-visible action or invariant does this own?
- What exact values cross each boundary, and where are they parsed or validated?
- Which side effects, transaction, persistence, and external details have one visible owner?
- Why is each new abstraction needed now, and what simpler option was rejected?
- What focused runnable check proves the Gold and catches a plausible modeling mistake?

## Output Contract

```text
Purpose: <user-visible action or invariant>
Concepts: <domain nouns, actions, and lifecycles>
Boundaries: <owners, inputs/outputs, and dependency direction>
Decision matrix: <candidate structure, current reason, simpler alternative, decision>
Implementation gate: <smallest runnable check>
Residual risk: <named uncertainty or none>
```
