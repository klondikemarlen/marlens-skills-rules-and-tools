# Module Boundary Reference

Use for module ownership, public surfaces, and semantic module-boundary verification. Broader authoring and review guidance remains in the [Code Organization Reference](code-organization-reference.md).

## Module Decomposition

**Goal:** Make each implementation's primary responsibility, state owner, and useful public contract apparent to the next maintainer. Review responsibility accumulation in touched implementations even when no export, file, or import boundary was added.

**Bounded caveat:** Cohesion is not a literal one-function or one-export quota. Preserve local helpers, supporting types/constants, same-invariant lifecycle operations, and evidenced language/framework or project-local conventions. A small cohesive module does not need a feature folder or barrel.

A useful module, file, or folder boundary should satisfy at least one of these checks:

- **Changes together:** files in the module usually change for the same product or domain reason. A normal feature change should not require unrelated directories just to follow one concept.
- **Hides volatility:** the module hides a decision likely to change, such as an external API, storage mechanism, parser format, platform branch, or authorization rule, behind the smallest useful public surface.
- **Keeps domain behavior findable:** exported names and filenames reveal ownership, such as `approveTravelAuthorization` or `eligibleRecipientsForDigest`, instead of generic mechanism names such as `manager`, `processor`, `helper`, or `utils`.
- **Preserves one-way dependencies:** outer or infrastructure code may depend on inner domain/application contracts, but domain decisions should not import framework clients, HTTP requests, CLI subprocess wrappers, or database plumbing unless the local architecture explicitly does that.
- **Avoids cycles:** a split that creates circular imports, mutual knowledge, or cross-calling services is worse than keeping the code together.
- **Keeps a small public API:** callers get a few intention-revealing operations; they do not reach through the module to manipulate internals.

Co-locate code until there is a real change axis, invariant boundary, duplicated behavior, or volatile dependency to isolate.

Where the project uses `lib` for reusable mechanisms, reserve it for code meaningfully usable outside the application, not merely code shared by two screens. A generic type parameter or multiple callers does not establish project independence: application models, status policy, and persisted-order mappings remain with their domain owner. A pure contiguity algorithm can belong in `lib` even with one caller. Keep an already-clean generic mechanism separate from domain mappings, but do not build adapters, a framework, or speculative genericization solely to qualify for `lib`. Stronger project-local directory conventions win.

When reviewing a private service-composition step, apply the narrow [Service Orchestration Readability](code-organization-reference.md#service-orchestration-readability) exception: a named domain step can clarify an established flow while delegating to the existing owner. Inspect the surrounding call sequence and whether the step preserves meaningful return values, awaiting, and rejection behavior; a one-line body alone does not establish gratuitous forwarding. Conversely, a name or maintainer preference alone does not justify wrapping an already-clear call without benefit. Keep the concrete composition local; do not create a generic participant contract or one-implementation registry to legitimize it. The exception does not weaken the warnings against forwarding layers that add no clarity or ownership.

For implementation-file layout, library barrels, lifecycle APIs, and component-owned support modules, follow [Implementation File Boundaries](code-organization-reference.md#implementation-file-boundaries). Those existing policies remain part of the review alongside the module-ownership criteria here.

### Ownership Before Extraction

Apply the canonical implementation-file policy above by identifying one primary operation or class and its supporting implementation, not by counting declarations. Before extending or splitting a touched module:

1. **Inventory responsibilities and invariants.** Name the domain operation, persistence, concurrency, validation, presentation, and integration decisions actually present. Identify which must change together and which have independent reasons to change; shared vocabulary alone does not establish one owner.
2. **Trace state and lifetime.** Locate mutable module state, caches, locks, request/session identities, initialization, cleanup, and failure recovery. Identify their owner, lifetime, mutation paths, and callers. Keep an atomic transition and its lock/cleanup together; extraction must not create duplicate caches, shorter-lived locks, or an unprotected read-modify-write.
3. **Separate policy from effects at meaningful seams.** A request-store owner may own private paths, integrity checks, locking, and atomic persistence, while pure assessment validation or presentation has its own change axis. Keep genuinely operation-local helpers local; do not export them merely to test them. Preserve evaluation order, errors, cancellation, and lifecycle semantics.
4. **Choose dependency direction and the consumer contract.** Show which operation depends on which owner before moving code. An operation may call a state owner and pure validation; neither should import that operation back. Avoid cross-import cycles and a catch-all facade that still makes every concern know every other concern.
5. **Expose only useful feature operations.** When several implementation owners form a feature folder, follow the project's entrypoint conventions and expose a small intention-revealing public surface. Keep storage primitives, validators, and presentation bookkeeping internal unless actual consumers establish an independent public contract. An intentional lifecycle API may expose prepare/read/complete operations without exporting every helper.

Reject a touched implementation that accumulates independent owners behind private helpers or hidden state just as you would an incoherent new boundary. Passing function/file-size checks, adding a barrel, or dividing the same coupling into `part-one`/`helpers` files does not resolve that failure. Explain the concrete independent change axes, coupled effects, or state-lifetime risk; size alone is not evidence. See [Cohesive Module Review](../../examples/cohesive-module-review.md) for contrasting layouts and a pinned consumer assessment.

### Semantic Module-Boundary Review

Module-boundary alignment is semantic review, not a size or count check. The package supplies its policy through the `marlens-rules:module-boundary-alignment` agentic verification contract in `package.json` and `verifications/module-boundary-alignment.json`. This reference's Module Decomposition guidance and the Code Organization Reference's [Review Structure](code-organization-reference.md#review-structure-not-metrics), [Service Orchestration](code-organization-reference.md#service-orchestration-readability), and [Pattern Fit and Non-Fit](code-organization-reference.md#pattern-fit-and-non-fit) guidance remain authoritative. The contract asks the existing verifier model to assess ownership within touched implementations as well as changed or introduced boundaries. An unchanged export list is not an exemption. It does not make every extraction suspect: retain short modules when they own a meaningful invariant, domain action, volatile dependency, independent change axis, or genuinely reusable behavior.

The contract requires changed code, relevant callers, sibling modules, and project guidance. The consumer needs OMP Verifier 0.10.0 or later to prepare, capture, and evaluate the declared contract. If required context or a supported runtime is unavailable, report `BLOCKED` with the missing evidence; do not guess, claim a pass, or treat retrieval limits as a semantic result. Project-specific architecture and naming conventions take precedence over generic guidance.

Inspect the complete relevant implementation and material state/import/caller relationships, not just the changed hunk, declarations, or first captured page. Obtain bounded ranges or continuation when necessary without dropping the original changed scope. If that evidence cannot be obtained, report the affected assessment `BLOCKED`, not `PASS` because no new boundary appeared or `FAIL` because a file is large. Attribute findings to the actual touched responsibility and explain the mechanism; do not turn supporting context into an unrelated repository audit.

For a finding, identify the actual changed location and the specific quality-standard requirement it fails, then correct the boundary or use an allowed reasoned bounded suppression. Re-run a fresh evaluation after correction; earlier assessments do not prove the changed code. This is advisor-assisted review, not a hard completion veto: final enforcement depends on OMP's native advisor behavior, as described in the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md).
