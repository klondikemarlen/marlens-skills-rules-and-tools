# Code Organization Reference

Use this when a change needs clearer names, files, modules, service boundaries, data handoffs, or dependency direction. This reference is intentionally stack-neutral: project-local architecture and naming conventions still win.

## Core Idea

Code organization is not more folders, more layers, or more pattern names. It is arranging names, files, modules, boundaries, and dependencies so the next maintainer can answer locally and quickly:

1. What domain action or user-visible operation is happening?
2. What invariant, side effect, or external dependency is owned here?
3. What values cross this boundary, and were they parsed or validated once?
4. What changes together, and what should remain isolated?
5. Which dependencies point inward or outward, and are there cycles?
6. Does this abstraction solve a current problem, or only prepare for an imagined future?

Use the smallest structure that makes ownership, change axes, data handoffs, and volatile decisions obvious.

## Libraries for Generic Mechanism

Keep application code focused on product-specific policies and behavior. When a change needs generic parsing, traversal, tokenization, serialization, or equivalent plumbing, compare the standard library, installed dependencies, a well-maintained library, and bespoke code.

Prefer the option that lowers net owned complexity: the codebase should not recreate generic implementation details merely to avoid a dependency. Include compatibility, maintenance, security, and the adapter code the project must still own in that comparison. Keep the project-specific policy and result model explicit at the library boundary.

## Domain Discovery Checkpoint

Before proposing a reorganization, discover the domain boundary from evidence rather than waiting for someone to name it. Inspect:

- folder and module topology, including new or growing subtrees and sibling-folder conventions;
- cohesive nouns, lifecycles, and concepts that recur together;
- repeated change clusters and code churn;
- dispatch conditions and dimensions that vary;
- invariants owned by the candidate domain and the direction of its dependencies.

Repeated churn, growing conditional branches, context-heavy helpers, and changes that repeatedly cross module boundaries are signals to investigate, not proof that a new abstraction or folder is warranted. Check each hypothesis against existing sibling-domain conventions and allow a domain to emerge incrementally as new evidence accumulates.

Record every candidate before choosing an action:

```text
Candidate domain: <working name derived from evidence>
Evidence: <topology, cohesive concepts, churn, conditionals, or boundary crossings>
Owned responsibilities: <invariants, lifecycle, dispatch, and side effects>
Boundary: <folders/modules and the allowed dependency direction>
Smallest safe next action: <observe, rename, co-locate, extract, or split one seam>
```

Keep the candidate as a hypothesis when evidence is weak. Do not reorganize based on folder names or churn counts alone.

## Organization Tests

Before adding a helper, service, class, repository, value object, adapter, folder, module, interface, factory, or registry, require at least one current reason:

- It protects a domain invariant.
- It names a user-visible or domain action.
- It isolates an external dependency or volatile implementation detail.
- It removes real duplication without hiding behavior.
- It keeps values crossing a boundary explicit and validated.
- It groups code that changes together and separates code that changes independently.
- It keeps domain behavior findable through intention-revealing public APIs and filenames.
- It preserves one-way dependencies and avoids circular imports or cross-calling services.
- It makes review safer by making side effects, transactions, permissions, or platform branches visible.

If none apply, inline it, delete it, or follow the existing local pattern.

## Simplification After Scope Changes

When a feature is deferred or removed, remove its supporting abstractions if accepted work no longer needs them. Prefer restoring the original simple code shape over retaining a behavior-equivalent refactor solely from the deferred feature. Keep refactors required by accepted work and preserve unrelated changes.

When a computed or similar reactive wrapper no longer reads reactive dependencies, remove it and now-unused imports if the existing consumer supports a plain value. Pass a fixed literal directly rather than keeping a one-use wrapper or alias. Retain reactivity when inputs still change or the consumer requires a ref; preserve type checking and the consumer's value/identity contract.

## Module Decomposition

A useful module, file, or folder boundary should satisfy at least one of these checks:

- **Changes together:** files in the module usually change for the same product or domain reason. A normal feature change should not require unrelated directories just to follow one concept.
- **Hides volatility:** the module hides a decision likely to change, such as an external API, storage mechanism, parser format, platform branch, or authorization rule, behind the smallest useful public surface.
- **Keeps domain behavior findable:** exported names and filenames reveal ownership, such as `approveTravelAuthorization` or `eligibleRecipientsForDigest`, instead of generic mechanism names such as `manager`, `processor`, `helper`, or `utils`.
- **Preserves one-way dependencies:** outer or infrastructure code may depend on inner domain/application contracts, but domain decisions should not import framework clients, HTTP requests, CLI subprocess wrappers, or database plumbing unless the local architecture explicitly does that.
- **Avoids cycles:** a split that creates circular imports, mutual knowledge, or cross-calling services is worse than keeping the code together.
- **Keeps a small public API:** callers get a few intention-revealing operations; they do not reach through the module to manipulate internals.

Co-locate code until there is a real change axis, invariant boundary, duplicated behavior, or volatile dependency to isolate.

### Component-Owned Support Modules

For a pure TypeScript helper that operates on component/editor-specific concepts owned by that component, prefer a descriptive sibling `.ts` module in the component directory over a global `utils` module. Such a support module need not define a Vue component. Keep the helper pure and test its behavior separately from rendering using the project's test layout; do not introduce a model class or composable solely to relocate it.

Choose the home by concept ownership, not single-caller count: a generic or domain-owned helper keeps its actual owner even with one component caller. Promote component support code to a shared feature/domain home when genuinely shared ownership emerges, not merely because another caller appears. Preserve project-local directory conventions; real reactive state or lifecycle needs remain independent reasons to use a composable.

## Oversized Responsibility Clusters

Treat a large source file as a review signal, not an automatic split mandate. Inspect whether it combines independently changing responsibilities such as boundary parsing, state/persistence, external adapters, policy decisions, orchestration, and CLI or transport wiring.

For service files, generally prefer staying under roughly 500 lines as a soft organizational guideline. Weigh cohesion and readability when choosing whether to inline or extract helpers; do not pad, compress, or mechanically fragment code to meet a size target. Crossing that rough bound prompts responsibility review, not an automatic split or rejection of an otherwise cohesive service.

When the signal is present, record:

- the concrete responsibility clusters and invariants each owns;
- the side effects and dependencies that cross between clusters;
- the smallest cohesive extraction seam, or the evidence for keeping the file together;
- the behavior check that must remain unchanged across any move.

Do not split mechanically by line count, create generic `helpers` or `utils` buckets, or add layers that leave the same ownership and dependency tangles intact. The `marlens-rules:no-oversized-source-files` verification is a backstop for review; responsibility and boundary evidence determines the design decision.

## Review Structure, Not Metrics

Readability is a delivery condition, not a post-hoc style preference. Before reporting `PASS`, identify each independent responsibility and its side effects. Flag a block that accumulates independent scenarios or hides its contract behind repeated mechanics.

Use structure as evidence, not a numeric proxy. Do not impose line-count, function-count, or complexity quotas. Preserve a cohesive block when its ownership remains clear; extract only the smallest named seam that makes one responsibility or side effect easier to find.

## Scenario-Oriented Verification

Verification code should expose each independently observable contract through a named scenario. Keep literal fixture data beside the scenario it explains. Share only repeated mechanics, such as writing a file or invoking a command, when their names clarify the setup; do not create a generic fixture builder.

Use a fresh fixture when a scenario needs a different starting state. A failing scenario must not be mutated into a clean scenario, because that couples independent behavior and obscures the clean contract.

Create persisted scenario records explicitly in each test's Arrange section, even when their attributes are identical across the suite; do not move that creation into shared `beforeEach` hooks. Preserve environment hooks such as fake-timer setup/teardown and reusable opt-in factory traits called from each scenario. Intentional duplication keeps the persisted starting state visible.

Name raw fixture/input attribute collections with an `Attributes` suffix, such as `stepsAttributes`, and reserve entity collection names for the resulting persisted records. Carry the distinction through table-driven fixture fields and consumers so a reader can tell which values are creation inputs and which are model instances.

Call fixture-backed test functions by their descriptive exported names rather than aliasing them to generic `test` or `it`; the name exposes the setup/teardown context. Do not hide a fixture such as `testWithConfigOverride` behind `const test = testWithConfigOverride`.

Assert fetched or returned collections directly against expanded literal expected arrays/objects and supported matchers such as `expect.objectContaining`. Do not put `map`, `filter`, `reduce`, or another projection inside `expect` merely to reshape the actual result; use the project's native model representation and compliant sibling patterns. Preserve legitimate async API assertions, native promise-rejection assertions, and matcher API calls.

Place queries whose sole purpose is observing persisted results in Assert, immediately above the expectation. Prefer a simple awaited ORM query over a parenthesized await followed by in-memory filtering only when isolated fixtures make that filtering unnecessary. Preserve query constraints and options that the scenario actually needs, and keep the operation under test in Act.

Do not add database or JavaScript sorting solely to normalize assertion collections. When an observed collection has an established operation-order contract, keep literal expected entries in that order so side-effect sequence remains visible. Retain explicit ordering when ordering itself is the behavior under test. If retrieval order is not guaranteed, assert the real unordered contract with supported project matchers or observe an actually ordered operation when sequence matters; do not infer side-effect order from unordered SQL retrieval.

## Input-Heavy Utility Tests

For input-heavy utilities, property-based or metamorphic tests can complement literal examples when they check a meaningful invariant across varied inputs. Keep the invariant independent of the implementation; use a seeded run that can be replayed, retain shrinking/minimized failures as literal regression examples, and bound the generated run budget so it remains a focused check. Preserve representative literal examples and known regressions. This is useful for utilities with broad input spaces, not a demand for exhaustive business matrices or an automatic dependency installation.

For example, if a normalizer's contract requires idempotence, `normalize(normalize(value))` must equal `normalize(value)`. That relation alone is insufficient: an implementation that always returns an empty string also passes. Retain literal examples with independently specified expected results. Prefer a straightforward input/output table when the important edge cases are small and enumerable; do not install a property-testing dependency automatically.

[fast-check's getting-started guide](https://fast-check.dev/docs/introduction/getting-started/) describes property-based generation, seeds, and shrinking. [Metamorphic testing](https://www.hillelwayne.com/post/metamorphic-testing/) is useful when a transformed input should have a related output even when a direct oracle is awkward. Choose only relations that are domain-meaningful.

## Bounded Mutation Spot-Checks

When a critical test's sensitivity is uncertain, a bounded mutation spot-check can expose a weak assertion: make one plausible fault in a controlled, disposable test copy, such as changing `>=` to `>` or removing an opt-out or permission check, then verify the intended focused test fails for that behavior rather than a setup error. Restore the clean implementation and confirm the same check passes, then discard the copy; never leave mutation edits in production source. This is a diagnostic pilot, not a global mutation-score gate. Do not chase mutants whose observable behavior is genuinely equivalent under the accepted contract; survival alone does not establish equivalence and may expose missing coverage.

See [Stryker's mutation-testing documentation](https://stryker-mutator.io/docs/) for the technique and [Equivalent Mutants](https://stryker-mutator.io/docs/mutation-testing-elements/equivalent-mutants/) for why some mutations cannot be distinguished by tests.

## Tagged Unions for Exclusive States

When states are mutually exclusive, represent the alternatives as a discriminated union rather than independent flags that can describe impossible combinations. For example:

```ts
type LoadState<T> =
  { status: "loading" } | { status: "success"; data: T } | { status: "failure"; error: Error }

function renderLoadState(state: LoadState<string[]>): string {
  switch (state.status) {
    case "loading":
      return "Loading"
    case "success":
      return state.data.join(", ")
    case "failure":
      return state.error.message
  }
}
```

The `status` tag narrows each branch to the fields valid for that state, so no value can simultaneously be loading and failed or claim success without data. Use an exhaustive check when it improves safety as the union grows. This is a small type-modeling technique, not a framework or class requirement, and it does not replace runtime validation of untrusted input. See the [TypeScript narrowing handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).

## SDK Configuration Types

When an SDK configuration object's intended contract is the SDK type, prefer a named constant with an explicit type annotation over an inline `satisfies` expression. If the configuration is nested in an application wrapper, type that configuration constant itself and retain the wrapper's own fields; do not annotate the whole wrapper with the nested SDK type or add `Partial` without an actually partial contract. Preserve `satisfies` when narrower inferred literals or keys are required by a real consumer; this is not a blanket ban on it.

## Domain-Oriented Modules and Tests

Split a growing module by the domain action or external integration it owns—not into generic `helpers`, `utils`, `services`, or `tests` buckets. Each module should have one narrow responsibility: parse or validate a boundary, make a policy decision, coordinate one action, or adapt one external system. Keep parsers and policies pure where practical; let orchestration depend on those decisions; keep filesystem, HTTP, database, framework, and extension state at the outer adapter boundary. Classes earn their cost only when they own meaningful state or a lifecycle; otherwise use a function.

Co-locate focused unit tests with the pure policy, parser, or small domain operation they protect. Use a boundary integration test for the adapter contract. Keep request payloads, inputs, and expected output local to each test; intentional duplication is clearer than a helper that hides those facts. Follow [Scenario-Oriented Verification](#scenario-oriented-verification) for persisted-record setup; shared environment mechanics or fixed literal data must not hide scenario inputs. Before a structural move, run the existing behavior check; after the move, rerun the same check and add only the smallest missing behavior test. A folder split that cannot name its owned action or preserve that check should stay a module.

## Project-Root Imports and Paths

Use one project-root import convention for dependencies across features or modules when it makes the dependency direction clearer than `../../..` traversal. Prefer `@/…` when every supported compiler, test runner, bundler, and editor/language server resolve it identically. Keep a short relative import for an immediately co-located sibling when it better expresses that the files form one local unit.

For production callers, prefer named imports from the deepest matching supported domain/module entry point rather than a broad root barrel plus a namespace alias, especially when the caller belongs to that domain. A domain barrel is a valid entry point; this does not require bypassing its public API for an individual implementation file. Preserve package export boundaries and existing module resolution, and leave unrelated imports alone.

In tests, prefer owning bundle/barrel imports for dependencies and direct full-module imports for the subject under test. Preserve supported resolution, public package/export boundaries, and explicit project-local conventions; a deeper private implementation path is not automatically a valid subject import.

Preserve the positions and order of unchanged imports when editing unrelated behavior. Do not move them merely to tidy or alphabetize a touched file; retain required new imports and intentional import changes. Review the full PR diff for equivalent incidental moves and remove them. Explicitly requested import cleanup and changes required by project tooling remain valid.

When raw Node runs ESM source directly, prefer Node's native `#/…` package-import namespace instead of `@/…`, which Node treats as an external package. Map it through `package.json` `"imports"` as `"#/*": "./*"`, and require Node v24.14.0 or later, which supports `#/` subpath imports. If a supported Node version cannot use `#/…`, map the package root as `#root/…` through `"#root/*": "./*"`, and map a sibling `tests` root as `#tests/…` through `"#tests/*": "./tests/*"`.

When a directory such as `tests` is a sibling of the source root, give it an explicit root-alias mapping instead of implying that it lives under source. With `@` mapped to `src`, map `@/tests` to `tests`; with Node's package-root import map, use `#/tests/…`.

Use the package name—not a project-root alias—for public package/library imports. Do not use a root import for external, generated, or vendor code. Where the language/toolchain lacks supported project-root resolution, consider adding it when recurring cross-module traversal warrants the setup and every supported environment can resolve the same root; otherwise retain the established local convention.

For runtime file paths, define one application/source root and derive paths from it instead of traversing from each caller. In Ruby/Rails, use framework-managed autoloaded constants instead of relative `require` traversal, and use `Rails.root.join` for application-root file paths. Do not treat a runtime path constant as module-resolution configuration: each environment still needs its own supported import resolver.

Before converting imports, confirm the existing module-resolution configuration and exercise the affected build and test path. Treat a deep relative path as a review signal, not an automatic rewrite: preserve a relative path when moving the dependency would be clearer than widening module visibility. Do not bulk-rewrite imports solely for style.
When the project adopts this convention, record it in project-local guidance. Configure an already-installed import-style lint rule only when it can enforce the same resolved root; do not add a dependency merely to police import spelling.

## State Names and Dependency-Local Ordering

Name state for the domain fact or lifecycle it represents, not the consuming control or callsite. Prefer `isLoadingNotificationPreferences` over `isLoadingGlobalSwitches` when the state reflects the notification-preferences request.

Keep each query or composable result adjacent to its direct derived state. Put broader coordination state and action handlers after their inputs, and lower-priority shared helpers further down.

This is a review heuristic, not an alphabetical rule. Preserve an existing stronger project convention when one exists.

For related visibility props, preserve the established show/hide polarity. Beside an existing `hideOrganization`, prefer `hideUsageCount` over mixing in `showUsageCount`. When renaming an in-scope prop, update every caller, invert defaults and predicates together, and verify identical visible behavior for both values and the omitted-prop case. Do not rename unrelated established APIs solely for this preference.

## UI Navigation Handler Names

Name a UI router-navigation handler after its destination and effect. Prefer `goToTemplateWorkflowsPage` or `goToCategoryWorkflowNewPage`; avoid trigger-oriented (`select...`, `open...`) or imprecise names that hide the route change. An established project convention wins.

## Derived Resource Identifiers

When deriving a resource identifier from configuration, make non-obvious normalization or naming policy visible rather than embedding a transform chain inside an otherwise declarative definition. Prefer the smallest local expression of the rule, such as a descriptively named intermediate value before the definition. Preserve resulting identifiers and existing input behavior unless a naming-policy change is explicitly requested; verify representative before/after names. Do not mandate a helper or new configuration setting, or rewrite already-clear direct values.

## Boundary Vocabulary

Use these terms as review vocabulary, not as mandatory layers:

- **Controller/request boundary:** parses request context, status codes, UI route events, or command-line input and delegates domain work.
- **Application service/use case:** names one user-visible or operator-visible action and coordinates authorization, transactions, persistence, external calls, and return values for that action.
- **Domain invariant:** a rule that must stay true for the domain, regardless of UI, transport, database, or external API shape.
- **Value object/schema/parser:** a small identity-free value or boundary parser used when values carry invariants, repeated validation, equality semantics, or cross-boundary meaning.
- **Repository/model/query helper:** persistence access through the project’s existing ORM, query builder, model, or repository convention. Add a repository only when it removes real duplicate query construction or isolates a real mapping boundary.
- **Adapter/gateway:** a small boundary around an external system, platform branch, CLI, HTTP client, SDK, filesystem, or clock.
- **Aggregate/transaction boundary:** the domain cluster whose invariant must be protected together. Do not hide transaction ownership in a generic helper name.
- **Module public API:** the exported names a caller can use. They should reveal what the module owns.

## Service Orchestration Readability

A service or use-case top-level method should read like orchestration: guard, derive domain-relevant values, perform side effects, and return the result. Extraction helps only when a named helper makes one step more visible.

Prefer this shape:

```text
perform():
  return if notification disabled
  recipients = recipientsEligibleForDelivery()
  notification = createInAppNotification(recipients)
  enqueueEmailDelivery(recipients)
  return notification
```

This is useful because each helper names a domain step and the service action remains visible.

Avoid this shape:

```text
perform():
  data = loadEverything()
  processList(data)
  finish(data)
```

This is worse because the helper names hide queries, decisions, side effects, and ownership.

Extraction is warranted when the helper name captures a cohesive domain decision or side-effect step, such as `recipientsEligibleForEmailDelivery`, `deliverInAppNotifications`, or `shouldNotifyRecipient`.

Extraction is not warranted for a trivial one-line transform, direct delegation, a short branch that is clearer inline, or a helper that hides unrelated database queries, aggregate boundaries, transactions, or permissions.

When extracting a bulk replacement operation, let the sub-service own that operation's validation and persistence while the higher-level action continues to orchestrate related side effects, such as notification-preference transitions. Preserve the existing transaction boundary, rollback and safety invariants, and required side-effect order across that call. Prefer straightforward existing orchestration over combining responsibilities or adding machinery without a concrete gain; this does not require extracting trivial forwarding steps.

Do not introduce `findOrCreate` as convenience provisioning. When the lifecycle invariant says a record must be new, use direct `create` and let an unexpected existing record fail through the normal constraints and transaction rather than silently reusing or repairing it. Keep explicitly accepted unchanged-state behavior separate; this preference does not authorize changing that path into creation or repair.

For an ordinary collection read, prefer the mapped model's normal query API, such as `findAll`, over a service that merely wraps the query. Keep required batching orchestration separate; retain a service when it owns a meaningful action or orchestration rather than forwarding alone. Name a collection-returning service with `List`, not `Load`—for example, `ListDocumentsService` rather than `LoadDocumentsService`.

When refactoring a query through an ORM, preserve its existing projection, predicates (including cancellation and deleted-record filtering), ordering, and batching semantics. Verify the returned records and exclusions, not just that the replacement query runs. This preference does not authorize changing a downstream table mapping or unrelated query behavior.

In service classes whose constructor stores values for an action, keep reads of those constructor-backed instance attributes in `perform`; pass required IDs, models, and actor context explicitly to private functional helpers. Direct expressions such as `this.currentUser` passed from `perform` are fine; do not add local aliases just to pass them along. Keep stateful helpers that own or coordinate object state separate from functional helpers, and do not invent parameters for state inherently bound to the object.

Treat required caller-loaded associations as developer preconditions: check them at the start of `perform`, before queries, transactions, or mutations, so broken controller/include setup fails immediately. Keep these guards distinct from business-state validation. If the helper would only inspect an already-loaded association and throw when absent, inline that guard at its call site rather than naming it as an async loader.

Preserve the caller's loaded association graph when returning an updated instance. Avoid an unnecessary reload followed by manually restoring one association. If reload is necessary, use the normal loading contract with the complete required include graph; restoring one parent association does not preserve nested or sibling preloads.

Prefer CRUD-style operation names for new or refactored services when they accurately describe the action; use `Update...Service` over `Set...Service` for changes to existing state. Do not force unrelated domain actions into misleading CRUD names. For search-index lifecycle services, explicitly include `Index` in the class and file name (for example, `UpdateIndexService` and `update-index-service.ts`), even when a containing directory already names the index. Do not apply index naming to unrelated document or workflow operations.

Group service barrel exports with standard CRUD/read entries first, special actions next, and bundled namespaces last. Read-only definition or value exports belong in the ordinary CRUD/read group, alphabetized with its entries; do not create a separate category merely because they are definitions. Alphabetize exported symbols within each group, not globally across the groups; keep named exports, namespace imports, and default-export object keys aligned with those groups. Separate groups with one blank line and established section labels. Add another meaningful category when needed rather than forcing unrelated operations into a group or rewriting unrelated established barrels. Preserve exported names.

## Query Names and Cohesive Projections

For SQL aliases and query variables, prefer descriptive entity-and-role names over generic or terse labels. Name the records represented (for example, SQL aliases `pending_workflow_search_document_changes` and `processed_workflow_search_document_changes`) and apply accepted naming changes consistently across the affected query scope without changing predicates or behavior.

Name model scopes and similar query abstractions for their filtering or projection effect, not their caller, trigger, or downstream operation, and match established sibling naming conventions. A scope that projects a search document might be `withSearchDocument`, not `forSearchIndex`; the concrete name belongs to the project. Keep a shared scope when it has real reuse; inline a one-off query when that removes needless indirection without duplicating a shared contract.

Keep closely related projections under one cohesive query scope—for example, include related organization and personal ranking projections in a suggestion-ranking scope—rather than requiring callers to compose a separate scope for each dimension. Keep genuinely different concerns, such as administrator usage analytics, separate.

For multi-property query/options object arguments, put each property on its own line even when the object fits the print width. Preserve option values and behavior, apply the correction consistently within the affected review scope, and leave unrelated objects alone. Project-local formatting conventions still win.

## Explanatory Comments

For explanatory comments, prefer JSDoc-style blocks that explain the mechanism and rationale, especially for non-obvious lifecycle state or invariants. State the actual captured boundary, when it is captured, what it gates, and why that gate or cache exists; describe lazy first-use behavior accurately rather than calling it startup. This does not require converting short inline comments or Arrange/Act/Assert markers.

## Shared Content and Presentation Contracts

When content requirements appear to conflict with a shared field limit or sanitizer, inspect the field's semantics, storage capacity, original constraint rationale, and sanitization contract plus all consumers before proposing an exception. Prefer a consistent contract across event types over an event-specific bypass. Distinguish stored content from compact presentation, and separate their policies when the existing model supports it. Do not assume a new field or universal UI-only truncation is required without inspecting the model and rendering surfaces.

## Guarded Computations

When one predicate gates multiple related computed fields or a multi-line computation, prefer explicit branching with a descriptively named helper and early return when that makes the normal path easier to follow and removes repeated conditions or nesting.

Keep the predicate's exact boundary, result shape, evaluation order, side effects, and excluded-case behavior unchanged. Avoid ternaries when a clear branch or guard expresses the control flow; do not extract a wrapper solely to eliminate a ternary or `?` token.

For example, a fuzzy-search term may only be expanded up to a length bound. The same limit gates both generated fields:

```ts
const MAX_FUZZY_TERM_LENGTH = 8

interface FuzzyQueryTerm {
  trigrams: string[]
  transpositions: string[]
}

function trigramsFor(term: string): string[] {
  const padded = `  ${term} `
  return Array.from({ length: Math.max(0, padded.length - 2) }, (_, index) =>
    padded.slice(index, index + 3)
  )
}

function adjacentTranspositionsFor(term: string): string[] {
  return Array.from(
    { length: Math.max(0, term.length - 1) },
    (_, index) => `${term.slice(0, index)}${term[index + 1]}${term[index]}${term.slice(index + 2)}`
  )
}

// Before: the same length predicate and excluded result are repeated.
function buildFuzzyQueryTermBefore(term: string): FuzzyQueryTerm {
  return {
    trigrams: term.length <= MAX_FUZZY_TERM_LENGTH ? trigramsFor(term) : [],
    transpositions: term.length <= MAX_FUZZY_TERM_LENGTH ? adjacentTranspositionsFor(term) : [],
  }
}

// After: one named decision owns both related computations.
function buildFuzzyQueryTerm(term: string): FuzzyQueryTerm {
  if (term.length > MAX_FUZZY_TERM_LENGTH) {
    return { trigrams: [], transpositions: [] }
  }

  return {
    trigrams: trigramsFor(term),
    transpositions: adjacentTranspositionsFor(term),
  }
}
```

The strict `>` guard preserves the inclusive `<= 8` boundary. The helper returns the same object shape, computes trigrams before transpositions on included inputs as the object literal did, and skips both computations when excluded.

A concise scalar ternary may remain when it is genuinely clearer than branching, but explicit branching is the preferred default when control flow reads more clearly. Flag repeated-field or multi-line gated shapes only when a branch or helper reduces duplicate gating or nesting; do not introduce a wrapper merely to remove ternary syntax.

## Guard Clauses and Exceptional Responses

In generated or touched JavaScript and TypeScript, short clear guard clauses may be single-line. Follow a standalone guard with one blank line; consecutive short guards may remain adjacent, with the blank line only after the last guard. Use a multiline braced block for guards that are not short or when branching reads more clearly; do not compress every guard. Keep `else` attached to its closing brace, and do not add a blank line before an enclosing block's end.

```ts
if (oldValue === newValue) return
if (isNil(value)) return

applyChange(value)
```

Prefer named Lodash `isUndefined(value)` when Lodash is already available and the check is specifically for `undefined`. Do not add a dependency for this preference or substitute `isNil`, truthiness, or another check with different semantics. Preserve safe `typeof` checks for possibly undeclared bindings, and follow explicit contrary user or project-local instructions.

Prefer `isEmpty(value)` or `!isEmpty(value)` over a length comparison used solely to test emptiness when the semantics are equivalent. Follow the project's existing import conventions; do not add a dependency just for this preference. Keep `.length` for counts or indexing, and preserve distinctions such as an absent/undefined value versus an empty collection.

```ts
// Before
if (composable === undefined) throw new Error("Expected workflow composable scope.")
await flushPromises()

// After (when Lodash is already available)
if (isUndefined(composable)) {
  throw new Error("Expected workflow composable scope.")
}

await flushPromises()
```

When an error condition requires an exceptional response, return it in an explicit guard and leave the ordinary error response on the normal path. Do not choose between exceptional and ordinary status/message values with a ternary and funnel both through one response branch. Preserve existing behavior unless a correction is requested; apply an accepted correction to all matching in-scope cases, not untouched consumers.

```ts
// Before
return response.status(error instanceof ServiceUnavailableError ? 503 : 500).json({
  message: error instanceof ServiceUnavailableError ? "Service is unavailable." : "Request failed.",
})

// After
if (error instanceof ServiceUnavailableError) {
  return response.status(503).json({ message: "Service is unavailable." })
}

return response.status(500).json({ message: "Request failed." })
```

Prefer an explicit guard for exceptional control flow. Elsewhere, choose branching or a guard when it makes the decision clearer; a concise ternary may remain when it is genuinely the clearest form. This is a readability preference, not a mechanical rewrite rule.

## Cleanup Necessity

Before retaining or relocating test cleanup, name the resource, isolation requirement, or observable invariant that requires it. An intentionally pending in-memory mock promise with no I/O or timer does not need to be settled merely to make the test body look complete, especially when existing scope teardown disposes it. Remove unnecessary settlement and its unused fixtures; do not move it to `finally` or a test hook. Keep assertions of pending state pending—do not resolve early, manufacture a snapshot, or weaken coverage.

```tsx
// The framework already tears down this view; the deferred mock has no timer or I/O.
const request = deferred()
const { getByRole } = render(<PendingView load={() => request.promise} />)
expect(getByRole("status")).toHaveTextContent("Loading")
// Do not add request.resolve(...) or a settlement hook after the pending-state assertion.
```

By contrast, dispose resources that remain live beyond the assertion, such as timers, I/O, or subscriptions. Reuse automatic teardown where it already provides the required disposal. Keep explicit disposal when disposal itself is under test or when it protects a demonstrated isolation invariant.

Inspect the active test-runner configuration before adding local mock-restoration hooks. Rely on configured cleanup for the mocks, globals, or environment state it already covers rather than duplicating it in `afterEach`. Retain local cleanup for uncovered resources or state and preserve intentional mid-test restoration; apply an accepted correction consistently within the reviewed scope.

When tests repeatedly track and delete the same class of external test resources, prefer a named shared cleaner integrated with the existing before-test isolation lifecycle instead of repeated per-test cleanup bookkeeping. Restrict destructive cleanup to test-owned resources and preserve isolation from other suites or workers. Apply the existing narrowest-scope and asynchronous fan-out rules rather than adding an unconditional global hook; keep necessary cleanup for unique or otherwise uncovered resources.

```ts
// Necessary: the interval remains live after this assertion.
const timer = setInterval(refresh, 1_000)

try {
  expect(refresh).not.toHaveBeenCalled()
} finally {
  clearInterval(timer)
}
```

An explicit unmount regression is also appropriate when the test observes that unmounting releases a subscription; the cleanup is then the behavior under test, not cosmetic teardown.

```tsx
const unsubscribe = vi.fn()
const { unmount } = render(<SubscribedView subscribe={() => unsubscribe} />)
unmount()
expect(unsubscribe).toHaveBeenCalledOnce()
```

When automatic framework teardown already unmounts each rendered component, do not add another explicit unmount solely for completeness.

## Private Helper Inputs

For a private functional helper, accept each value it uses as an explicit parameter when practical. A helper that accepts one model but reaches through `this` for another hidden dependency obscures its inputs and makes behavior harder to reason about or test.

Pass values explicitly when the caller already has them or the helper's result can be described from its arguments. Keep reads through `this` when the helper is inherently bound to object state, such as coordinating the instance lifecycle, mutating owned state, or using a cache whose identity belongs to the object. Do not add artificial parameters that merely restate that bound identity. For service-class conventions, see [Service Orchestration Readability](#service-orchestration-readability).

## Pattern Selection

Use patterns only when they earn their keep:

- **Value object:** use when values have invariants, behavior, identity-free equality, repeated cross-boundary use, or enough fields that positional order is error-prone. Do not wrap one primitive just to look like DDD.
- **Direct locals / tuple-style handoff:** use when a small, ordered, immediately consumed handoff has clear call-site names.
- **Repository:** use when query construction is duplicated, heavy, or intentionally isolated by the local architecture. Do not add a repository around a clear existing ORM/model convention just because a pattern list says so.
- **Adapter/gateway:** use when external details would otherwise leak into domain/application code or when a volatile platform/API branch needs one owner.
- **Interface/factory/registry:** use when there are multiple real implementations or one volatile external boundary. Delete one-implementation abstractions that only prepare for imagined future variation.
- **Folder/module split:** use when it groups code that changes together or hides volatility. Do not split files by technical phase if every feature change crosses all of those folders.

## Review Smells and Fixes

- Context/request object passed everywhere -> pass the minimum named values each lower operation needs.
- Primitive values repeatedly parsed or validated -> introduce a schema, parser, or value object at the boundary.
- Service method hides the action sequence behind collection plumbing -> extract named domain helpers only for cohesive decisions.
- Controller performs multi-step domain mutation -> extract a service/use case when reuse, risk, transaction ownership, or sibling conventions justify it.
- Persistence query logic is duplicated across services -> use the existing model/query/repository convention; add a repository only when duplication or mapping boundaries are real.
- Adapter/client details leak into domain or application logic -> hide them behind a small function/client that accepts domain-shaped values.
- Generic `manager`, `processor`, `helper`, or `utils` names -> rename or split by domain action.
- One-implementation interface, factory, or registry -> delete unless it isolates a real external dependency or current second target.
- Folder split mirrors technical phases but every change crosses all folders -> co-locate by feature/domain or follow the local convention.
- New folders/services/repositories leave request/context bags, cycles, or cross-module side effects intact -> simplify the dependency graph before adding more pattern names.

## Non-Goals

Do not prescribe full Clean Architecture, DDD, hexagonal, onion, Rails, or Express layering for every repo. Do not add framework or dependency recommendations. Do not copy downstream project conventions into shared guidance. Do not cargo-cult service, repository, or value-object names while leaving tangled dependencies intact.

## Sources

- Fowler, Service Layer: https://martinfowler.com/eaaCatalog/serviceLayer.html
- Fowler, Value Object: https://martinfowler.com/eaaCatalog/valueObject.html
- Fowler, Repository: https://martinfowler.com/eaaCatalog/repository.html
- Fowler, DDD Aggregate: https://martinfowler.com/bliki/DDD_Aggregate.html
- Parnas, modular decomposition: https://dl.acm.org/doi/10.1145/361598.361623
