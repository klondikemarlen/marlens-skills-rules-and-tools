# Module Boundary Reference

Use for module ownership, public surfaces, implementation-file layout, and semantic module-boundary verification. Broader authoring and review guidance remains in the [Code Organization Reference](code-organization-reference.md).

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

### Primary Operations and Local Implementation

Prefer one primary operation or independently named builder per implementation file, using a descriptive filename and the existing import/barrel/export conventions. Keep distinct operations separate rather than consolidating them merely because they are related. This is an ownership preference, not a one-function quota: retain a primary operation's local implementation steps, cohesive supporting types, and constants, as well as documented framework requirements and genuinely cohesive multi-function modules.

For an operation-specific response, prefer a flat operation-named serializer beside the owning resource's other serializers when a new folder would only wrap that representation. For example, use `workflow-templates/clone-serializer.ts` exporting `CloneSerializer`, with `WorkflowTemplateAsClone` and the established `AsClone` barrel alias, rather than `clone/create-serializer.ts` and a generic creation name. Keep ordinary `IndexSerializer` and `ShowSerializer` contracts distinct and unchanged. Reuse an existing serializer when the representation and its contract are identical. Retain meaningful multi-module operation namespaces and stronger local/framework conventions. Update every affected in-scope caller and supported barrel/type export without changing response fields, loading, or error behavior; naming does not authorize a response redesign or unrelated flattening.

For example, suppose reference inspection in a search feature establishes these consumers:

| Query Builder File             | Observed Consumer Locations                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `active-workflow-ids-query.ts` | `resolve-workflow-ids-service.ts` and `synchronize-workflow-search-service.ts`        |
| `workflow-player-ids-query.ts` | `resolve-workflow-player-ids-service.ts` and `synchronize-workflow-search-service.ts` |

Keep both reused SQL builders in their own descriptive files and import each where needed; their common synchronization consumer is not a reason to combine them into `workflow-queries.ts`. The locations above illustrate the decision, not a claim about a particular project's files. In an actual review, identify the real importing files or call sites when explaining reuse instead of implying that a request to find consumers means the user wants consolidation.

An implementation helper owned by an already-existing service is a different boundary: keep it private in that service under [Service Orchestration Readability](code-organization-reference.md#service-orchestration-readability). A genuinely independent function or definition retains its own owner even with one caller; do not use caller count alone to choose between these homes or reorganize unrelated code.

### Library Index Barrels

Use application-library `index` files for bundling and re-exports; put implementations in descriptive named sibling modules. Keep named functions and their matching default exports in those implementation modules under the existing export convention. A barrel may re-export values/types, import named/default/namespace bindings and re-export them, or default-export a static object of imported bindings. Do not hide functions, classes, locally computed values, side-effect imports, or executable initialization in a library barrel.

For a single-purpose TypeScript function module, declare the primary named exported function before supporting function declarations, then put the matching `export default someName` statement last. Keep imports, supporting types, and initialization-sensitive declarations where module semantics require them. Its barrel re-exports the named symbol with `export { someName } from "./some-name"`, not `export { default as someName }`. Preserve intentional framework entrypoints and cohesive multi-function modules; do not create one default per secondary function or reorganize unrelated modules.

For example, the primary operation precedes its supporting function and the matching default export ends the module:

```typescript
type WorkflowStep = { position: number; title: string }

export function formatWorkflowStepLabel(step: WorkflowStep): string {
  return `${formatStepPosition(step.position)}: ${step.title}`
}

function formatStepPosition(position: number): string {
  return String(position + 1).padStart(2, "0")
}

export default formatWorkflowStepLabel
```

An actual runtime or package initialization entrypoint can legitimately contain implementation; being named `index` or listed in package exports alone does not establish that exception. Preserve documented project-specific entrypoint responsibilities. The deterministic `marlens-rules:barrel-only-indexes` check covers explicit library scope and supported syntax with reasoned entrypoint exclusions; see [Library Index Verification](rules-and-verifications-reference.md#library-index-verification). Semantic ownership and cohesion remain review responsibilities.

### Default-Safe Lifecycle APIs

When failure isolation or lifecycle cleanup is required for ordinary callers, make it part of the normal operation rather than a parallel safe/unsafe or `WithErrorHandler` entry point. Optional callbacks express genuinely optional policy responses, not enabling baseline safety. Migrate all in-scope callers and remove the superseded unsafe path. Preserve domain recovery policy and error propagation; required safety does not mean swallowing errors, adding retries, or mandating a subscription API.

For a small framework-like subsystem, keep familiar explicit lifecycle operations and put wrapper bookkeeping and cleanup in the mechanism owner. Prefer a minimal `subscribed()`/`unsubscribed()`-style interface over expanding a shared base class or requiring callers to manage cleanup handles merely to obtain ordinary safety. A Rails-like interface illustrates simplicity, not a universal Rails layering rule or permanent compatibility promise. Choose the smallest coherent diff meeting accepted behavior; retain a handle or richer interface when an evidenced consumer contract actually needs it.

### Semantic Module-Boundary Review

Module-boundary alignment is semantic review, not a size or count check. The package supplies its policy through the `marlens-rules:module-boundary-alignment` agentic verification contract in `package.json` and `verifications/module-boundary-alignment.json`. This reference's Module Decomposition guidance and the Code Organization Reference's [Review Structure](code-organization-reference.md#review-structure-not-metrics), [Service Orchestration](code-organization-reference.md#service-orchestration-readability), and [Pattern Fit and Non-Fit](code-organization-reference.md#pattern-fit-and-non-fit) guidance remain authoritative. The contract asks the existing verifier model to assess changed boundaries against that guidance. It does not make every extraction suspect: retain short modules when they own a meaningful invariant, domain action, volatile dependency, independent change axis, or genuinely reusable behavior.

The contract requires changed code, relevant callers, sibling modules, and project guidance. The consumer needs OMP Verifier 0.10.0 or later to prepare, capture, and evaluate the declared contract. If required context or a supported runtime is unavailable, report `BLOCKED` with the missing evidence; do not guess, claim a pass, or treat retrieval limits as a semantic result. Project-specific architecture and naming conventions take precedence over generic guidance.

For a finding, identify the actual changed location and the specific quality-standard requirement it fails, then correct the boundary or use an allowed reasoned bounded suppression. Re-run a fresh evaluation after correction; earlier assessments do not prove the changed code. This is advisor-assisted review, not a hard completion veto: final enforcement depends on OMP's native advisor behavior, as described in the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md).

### Component-Owned Support Modules

For a pure TypeScript helper that operates on component/editor-specific concepts owned by that component, prefer a descriptive sibling `.ts` module in the component directory over a global `utils` module. Such a support module need not define a Vue component. Keep the helper pure and test its behavior separately from rendering using the project's test layout; do not introduce a model class or composable solely to relocate it.

Choose the home by concept ownership, not single-caller count: a generic or domain-owned helper keeps its actual owner even with one component caller. Promote component support code to a shared feature/domain home when genuinely shared ownership emerges, not merely because another caller appears. Preserve project-local directory conventions; real reactive state or lifecycle needs remain independent reasons to use a composable.

This preference extends to a component family: related editors may share plain TypeScript DOM-interaction helpers and types beside that family, in a Vuetify-style organization without requiring Vuetify itself. Component directories are not restricted to component files. Keep pure domain rules with their domain, genuinely project-independent algorithms in libraries, and reactive lifecycle coordination in composables. Existing project conventions still win; do not move unrelated code to manufacture a uniform tree.
