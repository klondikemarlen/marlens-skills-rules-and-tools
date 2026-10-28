# Module Boundary Reference

Use for module ownership, public surfaces, and semantic module-boundary verification. Broader authoring and review guidance remains in the [Code Organization Reference](code-organization-reference.md).

## Module Decomposition

A useful module, file, or folder boundary should satisfy at least one of these checks:

- **Changes together:** files in the module usually change for the same product or domain reason. A normal feature change should not require unrelated directories just to follow one concept.
- **Hides volatility:** the module hides a decision likely to change, such as an external API, storage mechanism, parser format, platform branch, or authorization rule, behind the smallest useful public surface.
- **Keeps domain behavior findable:** exported names and filenames reveal ownership, such as `approveTravelAuthorization` or `eligibleRecipientsForDigest`, instead of generic mechanism names such as `manager`, `processor`, `helper`, or `utils`.
- **Preserves one-way dependencies:** outer or infrastructure code may depend on inner domain/application contracts, but domain decisions should not import framework clients, HTTP requests, CLI subprocess wrappers, or database plumbing unless the local architecture explicitly does that.
- **Avoids cycles:** a split that creates circular imports, mutual knowledge, or cross-calling services is worse than keeping the code together.
- **Keeps a small public API:** callers get a few intention-revealing operations; they do not reach through the module to manipulate internals.

Co-locate code until there is a real change axis, invariant boundary, duplicated behavior, or volatile dependency to isolate.

Where the project uses `lib` for reusable mechanisms, reserve it for code meaningfully usable outside the application, not merely code shared by two screens. A generic type parameter or multiple callers does not establish project independence: application models, status policy, and persisted-order mappings remain with their domain owner. A pure contiguity algorithm can belong in `lib` even with one caller. Keep an already-clean generic mechanism separate from domain mappings, but do not build adapters, a framework, or speculative genericization solely to qualify for `lib`. Stronger project-local directory conventions win.

For implementation-file layout, library barrels, lifecycle APIs, and component-owned support modules, follow [Implementation File Boundaries](code-organization-reference.md#implementation-file-boundaries). Those existing policies remain part of the review alongside the module-ownership criteria here.

### Semantic Module-Boundary Review

Module-boundary alignment is semantic review, not a size or count check. The package supplies its policy through the `marlens-rules:module-boundary-alignment` agentic verification contract in `package.json` and `verifications/module-boundary-alignment.json`. This reference's Module Decomposition guidance and the Code Organization Reference's [Review Structure](code-organization-reference.md#review-structure-not-metrics), [Service Orchestration](code-organization-reference.md#service-orchestration-readability), and [Pattern Fit and Non-Fit](code-organization-reference.md#pattern-fit-and-non-fit) guidance remain authoritative. The contract asks the existing verifier model to assess changed boundaries against that guidance. It does not make every extraction suspect: retain short modules when they own a meaningful invariant, domain action, volatile dependency, independent change axis, or genuinely reusable behavior.

The contract requires changed code, relevant callers, sibling modules, and project guidance. The consumer needs OMP Verifier 0.10.0 or later to prepare, capture, and evaluate the declared contract. If required context or a supported runtime is unavailable, report `BLOCKED` with the missing evidence; do not guess, claim a pass, or treat retrieval limits as a semantic result. Project-specific architecture and naming conventions take precedence over generic guidance.

For a finding, identify the actual changed location and the specific quality-standard requirement it fails, then correct the boundary or use an allowed reasoned bounded suppression. Re-run a fresh evaluation after correction; earlier assessments do not prove the changed code. This is advisor-assisted review, not a hard completion veto: final enforcement depends on OMP's native advisor behavior, as described in the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md).
