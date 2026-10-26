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

## Human Readability

Human readability is an ordinary engineering standard, not an optional cleanup phase. Optimize for the next maintainer's effort to understand, change, and trust the code while preserving correctness and the project's conventions.

- Choose explanatory function and variable names that reveal domain purpose and effects, not vague mechanisms or unnecessary abbreviations.
- Keep responsibilities cohesive and related steps together. Make dependencies, state ownership, side effects, and failure paths visible.
- Prefer straightforward sequences, guard clauses, and shallow nesting when they clarify control flow. Use explicit intermediate steps instead of dense expressions when they reduce mental reconstruction.
- Use consistent formatting and blank lines to separate meaningful logical steps; follow [Whitespace Matters](../../rules/whitespace-matters.md).
- Extract helpers when a meaningful name and boundary clarify an operation or remove real duplication. Do not lower cyclomatic complexity merely by scattering decisions across trivial helpers or adding layers.
- Explain non-obvious constraints and decisions in comments, not behavior already expressed clearly by the code.

For a meaningful computed function result used in an object property or nested call, prefer a descriptive local before its use so the processing step has an inspectable value and useful debugger breakpoint. For example, capture `const gaps = captureGaps(rows, container)` before constructing `{ gaps }`. Preserve evaluation order and short-circuit behavior: keep conditional computation inside its branch rather than hoisting it unconditionally. Do not add aliases for already-available values, trivial wrappers, or extra statements solely to increase line count.

Bind an indexed element to an explanatory local before accessing its properties: `const sourceRow = rows[sourceIndex]`, then `sourceRow.workflowStepAttributes.groupIdentifier`. For optional access, retain the original short-circuit boundary, such as `sourceRow?.owner.id`; do not silently make a required nested property optional. Evaluate the index once and preserve evaluation order. Apply accepted corrections to equivalent occurrences within the requested review scope, not unrelated files or trivial helper extractions.

In attribute payloads and matching destructuring, put ordinary scalar fields first and group nested association/assignment inputs at the bottom, such as `title`, `priority`, `dueInDays`, then `tagsAttributes` and `playersAttributes`. Follow stronger local conventions and preserve values, spread precedence, getter/evaluation order, and behavior; do not mechanically reorder arbitrary configuration objects.

Complexity measurements identify places to inspect, not quality targets. Preserve a cohesive implementation when splitting would add navigation and indirection. Apply improvements within the requested scope; baseline quality does not authorize unrelated refactoring.

During feature or PR work, incidental cleanup is eligible only in an existing file where the requested work also changes effective code or a meaningful contract. Remove files whose net PR diff is solely incidental import cleanup, formatting, whitespace, or export ordering. Meaningful type, schema, and test changes count; runtime behavior need not change. Preserve explicitly requested cleanup and changes necessary for project tooling or the accepted contract.

When this scope correction is accepted, inspect the complete in-scope PR for equivalent incidental-only files, not just the selected review line. Preserve other owners' work and remove only the unrelated cleanup from the proposed change.

## Libraries for Generic Mechanism

Keep application code focused on product-specific policies and behavior. When a change needs generic parsing, traversal, tokenization, serialization, or equivalent plumbing, compare the standard library, installed dependencies, a well-maintained library, and bespoke code.

Prefer the option that lowers net owned complexity: the codebase should not recreate generic implementation details merely to avoid a dependency. Include compatibility, maintenance, security, and the adapter code the project must still own in that comparison. Keep the project-specific policy and result model explicit at the library boundary.

Before selecting an overlapping dependency, inspect the application's existing libraries across frontend and backend. Prefer the existing library when it supports the target runtime and required safety contract; verify concrete compatibility risks rather than assuming a server-used library cannot run in a browser. A demonstrated runtime or security incompatibility justifies a different library. Keep runtime-specific configuration and security policy separate: shared library choice does not imply permissive shared defaults or require a cross-layer wrapper. Use [Scenario-Oriented Verification](#scenario-oriented-verification) for the actual integration risk.

Before implementing domain-specific retry or recovery loops, inspect the installed client and queue capabilities and their configuration. Prefer supported native retries/backoff for the failure layer they actually cover. Distinguish connection retry, execution retry, and durable handoff failure: reconnecting a client does not retry failed job execution, and execution retries do not recover work that was never durably handed off.

Do not silently reset exhausted attempts by removing and recreating jobs or resetting domain status. Necessary recovery for an uncovered delivery gap belongs at the existing shared infrastructure owner with an explicit policy, not duplicated in domain scheduling code. Preserve accepted attempt limits and delivery requirements; this is not a universal retry-forever or terminal-failure policy.

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

Avoid assigning an existing value to a new name solely to attach a type assertion when the alias adds no domain meaning or transformation. Prefer the original value and accurate narrowing from the existing validation boundary where available. Keep intermediates that clarify meaning, are reused, or represent real transformations; this is not a ban on necessary assertions or intermediate variables.

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

### Library Index Barrels

Use application-library `index` files for bundling and re-exports; put implementations in descriptive named sibling modules. Keep named functions and their matching default exports in those implementation modules under the existing export convention. A barrel may re-export values/types, import named/default/namespace bindings and re-export them, or default-export a static object of imported bindings. Do not hide functions, classes, locally computed values, side-effect imports, or executable initialization in a library barrel.

For a single-purpose function module, declare `export function someName(...)` and a separate `export default someName`; its barrel re-exports the named symbol with `export { someName } from "./some-name"`, not `export { default as someName }`. Preserve intentional framework entrypoints and cohesive multi-function modules; do not create one default per secondary function or reorganize unrelated modules.

An actual runtime or package initialization entrypoint can legitimately contain implementation; being named `index` or listed in package exports alone does not establish that exception. Preserve documented project-specific entrypoint responsibilities. The deterministic `marlens-rules:barrel-only-indexes` check covers explicit library scope and supported syntax with reasoned entrypoint exclusions; see [Library Index Verification](rules-and-verifications-reference.md#library-index-verification). Semantic ownership and cohesion remain review responsibilities.

### Default-Safe Lifecycle APIs

When failure isolation or lifecycle cleanup is required for ordinary callers, make it part of the normal operation rather than a parallel safe/unsafe or `WithErrorHandler` entry point. Optional callbacks express genuinely optional policy responses, not enabling baseline safety. Migrate all in-scope callers and remove the superseded unsafe path. Preserve domain recovery policy and error propagation; required safety does not mean swallowing errors, adding retries, or mandating a subscription API.

For a small framework-like subsystem, keep familiar explicit lifecycle operations and put wrapper bookkeeping and cleanup in the mechanism owner. Prefer a minimal `subscribed()`/`unsubscribed()`-style interface over expanding a shared base class or requiring callers to manage cleanup handles merely to obtain ordinary safety. A Rails-like interface illustrates simplicity, not a universal Rails layering rule or permanent compatibility promise. Choose the smallest coherent diff meeting accepted behavior; retain a handle or richer interface when an evidenced consumer contract actually needs it.

### Semantic Module-Boundary Review

Module-boundary alignment is semantic review, not a size or count check. The package supplies its policy through the `marlens-rules:module-boundary-alignment` agentic verification contract in `package.json` and `verifications/module-boundary-alignment.json`; this reference's Module Decomposition, Review Structure, Service Orchestration, and [Pattern Fit and Non-Fit](#pattern-fit-and-non-fit) guidance remains authoritative. The contract asks the existing verifier model to assess changed boundaries against that guidance. It does not make every extraction suspect: retain short modules when they own a meaningful invariant, domain action, volatile dependency, independent change axis, or genuinely reusable behavior.

The contract requires changed code, relevant callers, sibling modules, and project guidance. The consumer needs OMP Verifier 0.10.0 or later to prepare, capture, and evaluate the declared contract. If required context or a supported runtime is unavailable, report `BLOCKED` with the missing evidence; do not guess, claim a pass, or treat retrieval limits as a semantic result. Project-specific architecture and naming conventions take precedence over generic guidance.

For a finding, identify the actual changed location and the specific quality-standard requirement it fails, then correct the boundary or use an allowed reasoned bounded suppression. Re-run a fresh evaluation after correction; earlier assessments do not prove the changed code. This is advisor-assisted review, not a hard completion veto: final enforcement depends on OMP's native advisor behavior, as described in the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md).

### Component-Owned Support Modules

For a pure TypeScript helper that operates on component/editor-specific concepts owned by that component, prefer a descriptive sibling `.ts` module in the component directory over a global `utils` module. Such a support module need not define a Vue component. Keep the helper pure and test its behavior separately from rendering using the project's test layout; do not introduce a model class or composable solely to relocate it.

Choose the home by concept ownership, not single-caller count: a generic or domain-owned helper keeps its actual owner even with one component caller. Promote component support code to a shared feature/domain home when genuinely shared ownership emerges, not merely because another caller appears. Preserve project-local directory conventions; real reactive state or lifecycle needs remain independent reasons to use a composable.

This preference extends to a component family: related editors may share plain TypeScript DOM-interaction helpers and types beside that family, in a Vuetify-style organization without requiring Vuetify itself. Component directories are not restricted to component files. Keep pure domain rules with their domain, genuinely project-independent algorithms in libraries, and reactive lifecycle coordination in composables. Existing project conventions still win; do not move unrelated code to manufacture a uniform tree.

## Self-Contained Migrations

Keep each database migration self-contained. Do not import or invoke another migration's `up` or `down` implementation; keep the schema definitions, SQL, and rollback definitions that this migration needs local to it so execution does not depend on another migration file. Apply this when authoring or reviewing migrations, not as permission to rewrite historical migrations or add tooling.

For new or actively reviewed unreleased migrations, separate meaningfully distinct schema/table introduction, dependent SQL objects, independently owned data conversions, and obsolete-schema removal when they have distinct responsibility or rollback boundaries. Keep table-local constraints with their table and cohesive schema/backfill work together when they share one responsibility. Order forward dependencies and backfills before dependent conversion or removal, and undo them in reverse dependency order. Choose cohesive boundaries, not a universal file count or line threshold.

Prefer the project's existing schema builder for ordinary changes when it supplies the required database semantics. Inspect the installed dialect implementation or exercise the production-shaped case before duplicating constraint discovery/removal in custom SQL. Retain narrowly scoped raw SQL for dependencies or identifier semantics the builder demonstrably cannot preserve.

Put exported `up`/`down` entry points before local implementation helper functions; keep those helpers at the bottom of the migration. Preserve behavior, initialization dependencies, and migration-local definitions rather than extracting helpers into another migration or rewriting unrelated released history.

Where soft-delete exclusion is the routine convention, omit `Active` and `DeletedAtNull`/`deleted_at_null` from index names, decorator identifiers, and matching filenames. Preserve the deleted-at-null predicate and uniqueness semantics, and align model and migration index names. Continue naming other meaningful filter conditions under the project's convention; do not rename unrelated historical indexes.

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

Permanent tests prove current user behavior or maintained invariants, not merely that a retired implementation/control is gone. Keep current-state investigation probes disposable. For a replacement interaction, drive the current action and assert its visible or persisted result instead of retaining an absence-only test of the old control. Preserve meaningful negative contracts—authorization denial, cancellation, prohibited writes, meaningful empty states—and regressions tied to an accepted current invariant; negative assertions themselves are not the problem.

Test the application's contract, not the dependency's standard API. Before adding or retaining a dependency-related suite, name the application-owned invariant or concrete compatibility risk and inspect existing consumer coverage. Ordinary builds, persistence, association reuse, and sequence progression belong to the dependency's upstream tests, even when exercised with application models, fixtures, or a real database. Application-owned access helpers, post-save role hooks, category-scoping rules, adapters, and observed integration regressions remain locally testable; external imports alone are not grounds to reject or delete a test. When correcting a test plan, distinguish ownership and uncovered risk before removing meaningful coverage. Do not invent unusual interactions merely to justify another test.

For dependency adoption, extraction, or upgrades with unchanged application logic, prefer existing application-consumer tests plus a disposable compatibility smoke when those cover the concrete local risk; an unchanged helper already covered by its consumers does not automatically need a second suite. Reuse versioned upstream package/type/runtime compatibility evidence without copying its suite downstream or mistaking it for proof of the application's actual database, access rules, or custom integration. Keep evidence for the prior version separate from verification of the newly selected version; unchanged upstream implementation does not turn old results into installed-version proof. Retain a focused local regression for an observed unusual interaction that existing coverage does not protect. This is an ownership and risk decision, not a ban on integration testing.

For component tests, drive application-owned behavior through user actions and assert the resulting visible content or records, rather than merely reasserting framework model props, pagination arithmetic, or built-in widget behavior. Keep integration assertions for a concrete application-owned contract; component props and accessibility assertions remain appropriate when they express one. If sensitivity is uncertain, use the bounded diagnostic in [Bounded Mutation Spot-Checks](#bounded-mutation-spot-checks); mutation testing is not required for every scenario.

Keep component mount options and scenario-specific API response setup visible in each test's Arrange section. Use owned or inferred API types; do not add local mount or response-envelope helpers that hide scenario inputs or copy response contracts into test-only aliases. Retain shared environment/infrastructure setup and established entity factories; build each test's scenario-specific overrides inline. A factory build in Arrange does not justify extracting the mount or response setup.

Before recreating synthetic assertion-summary objects to satisfy a local assertion quota, inspect the nearest test/review guidance for a conflicting rule. Report and correct the project-local conflict in its owner; preserve direct native matchers and independently meaningful outcomes rather than hiding them in a fabricated bundle.

For a straightforward lookup used only to select the final assertion target, keep the lookup and selection together in one readable declaration rather than naming a single-use intermediate collection. Retain an intermediate when it is reused, directly asserted, or clarifies genuinely complex selection. This is not a preference for dense chains: keep selection outside `expect` and expected values literal.

When the user explicitly designates another project as the testing reference, inspect its current test guidance, representative tests, runner setup, and shared helpers before implementing or correcting tests. Follow the applicable established harness and assertion patterns rather than inventing a parallel rendering or parsing harness. Apply them within the consuming project's actual runtime and higher-precedence constraints; report an unavailable reference or concrete incompatibility instead of claiming alignment by guesswork. Keep project names and framework-specific details in the consuming project, not as universal mandates.

Use a fresh fixture when a scenario needs a different starting state. A failing scenario must not be mutated into a clean scenario, because that couples independent behavior and obscures the clean contract.

Create persisted scenario records explicitly in each test's Arrange section, even when their attributes are identical across the suite; do not move that creation into shared `beforeEach` hooks. Preserve environment hooks such as fake-timer setup/teardown and reusable opt-in factory traits called from each scenario. Intentional duplication keeps the persisted starting state visible.

Arrange data through the project's factories rather than unrelated production services. Service calls remain appropriate when that service is the subject under test or the scenario is a feature test. Reuse opt-in relationship traits for repeated setup; keep scenario-specific values, identities, deletion states, ordering, and explicit preloads visible and preserved. This does not prohibit mocked collaborators or introduce a new factory library.

Name raw fixture/input attribute collections with an `Attributes` suffix, such as `stepsAttributes`, and reserve entity collection names for the resulting persisted records. Carry the distinction through table-driven fixture fields and consumers so a reader can tell which values are creation inputs and which are model instances.

Call fixture-backed test functions by their descriptive exported names rather than aliasing them to generic `test` or `it`; the name exposes the setup/teardown context. Do not hide a fixture such as `testWithConfigOverride` behind `const test = testWithConfigOverride`.

Assert fetched or returned collections directly against expanded literal expected arrays/objects and supported matchers such as `expect.objectContaining`. Do not put `map`, `filter`, `reduce`, or another projection inside `expect` merely to reshape the actual result; use the project's native model representation and compliant sibling patterns. Preserve legitimate async API assertions, native promise-rejection assertions, and matcher API calls.

Place queries whose sole purpose is observing persisted results in Assert, immediately above the expectation. Prefer a simple awaited ORM query over a parenthesized await followed by in-memory filtering only when isolated fixtures make that filtering unnecessary. Preserve query constraints and options that the scenario actually needs, and keep the operation under test in Act.

In ORM-backed projects, use the table's normal model API, such as `findAll`, for routine persisted-state observations instead of handwritten `SELECT` SQL. If a domain table lacks its expected model, add a schema-matching model using the actual table definition and existing project conventions rather than making raw SQL the default. Retain specialized SQL when batching, locking, version-safe acknowledgement, or another concrete database semantic requires it. Preserve needed predicates, projections, options, and Assert placement; do not impose an ORM on projects without that convention.

Prefer ordinary `findAll` model results for persistence assertions. Do not add `attributes` projections or `raw: true` only to manufacture a narrow expected shape; match meaningful persisted attributes directly through supported model matchers and literal expectations, including unchanged state relevant to the scenario. Preserve predicates, raw/projection options, and ordering when the behavior actually needs them.

When duplicate or unexpected writes are a risk, observe the complete relevant persisted collection and assert its exact membership/cardinality; `findOne` or a filtered subset can hide the regression. Keep single-record observations when only that record's state is the contract. Reuse an already-known model instance for in-memory assertions, and reload that same instance for persisted state rather than refetching by primary key solely for assertion. Retain separate instances for intentional stale-state or independent-consumer scenarios.

For isolated fixtures where exactly one updated record should exist, direct singleton matching proves cardinality without relying on retrieval order:

```ts
// Assert
const records = await Record.findAll()

expect(records).toEqual([
  expect.objectContaining({
    id: record.id,
    title: "Updated",
    ownerId: owner.id,
    status: "draft",
  }),
])
```

Here ownership and draft status are relevant unchanged state. For multiple unordered records, use the project's supported exact unordered collection/model matcher; do not normalize SQL order or use a subset matcher that misses extra rows.

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

## Initialization Safety

Prefer initialization that TypeScript can verify over definite-assignment assertions such as `let callback!: () => void`. For asynchronous coordination, use directly initialized values or appropriate standard synchronization primitives supported by the project runtime. Do not replace the assertion with casts, dummy callbacks, or optional calls that conceal missing initialization or silently discard a signal. Preserve pending-state behavior, signal delivery, ownership, lifecycle, and failure behavior. This is not a requirement to use `EventEmitter` everywhere or a blanket ban on unrelated TypeScript syntax.

## Return Annotation Consistency

Within a cohesive TypeScript module, class, or comparable method family, consistently follow the established local choice of explicit `void` annotations or inferred returns. Correct equivalent in-scope methods rather than arbitrary unrelated files; this is not a global always-omit or always-require rule. Preserve callback/function-type contracts, type predicates, and other semantically necessary annotations.

## SDK Configuration Types

When an SDK configuration object's intended contract is the SDK type, prefer a named constant with an explicit type annotation over an inline `satisfies` expression. If the configuration is nested in an application wrapper, type that configuration constant itself and retain the wrapper's own fields; do not annotate the whole wrapper with the nested SDK type or add `Partial` without an actually partial contract. Preserve `satisfies` when narrower inferred literals or keys are required by a real consumer; this is not a blanket ban on it.

## Domain-Oriented Modules and Tests

Split a growing module by the domain action or external integration it owns—not into generic `helpers`, `utils`, `services`, or `tests` buckets. Each module should have one narrow responsibility: parse or validate a boundary, make a policy decision, coordinate one action, or adapt one external system. Keep parsers and policies pure where practical; let orchestration depend on those decisions; keep filesystem, HTTP, database, framework, and extension state at the outer adapter boundary. Classes earn their cost only when they own meaningful state or a lifecycle; otherwise use a function.

Co-locate focused unit tests with the pure policy, parser, or small domain operation they protect. Use a boundary integration test for the adapter contract. Keep request payloads, inputs, and expected output local to each test; intentional duplication is clearer than a helper that hides those facts. Follow [Scenario-Oriented Verification](#scenario-oriented-verification) for persisted-record setup; shared environment mechanics or fixed literal data must not hide scenario inputs. Before a structural move, run the existing behavior check; after the move, rerun the same check and add only the smallest missing behavior test. A folder split that cannot name its owned action or preserve that check should stay a module.

Follow the project's established source-to-test layout and keep a dedicated behavioral suite aligned with the source unit whose behavior it owns; do not split one service's tests into ad hoc topic-suffixed files. If a distinct domain responsibility warrants its own suite, extract that responsibility into an appropriately named subservice or use case with a matching test file, while orchestration and persistence checks remain with their owning service. Do not extract for every test category, impose a test-file size quota, or add an abstraction solely to reduce file length. Follow [Scenario-Oriented Verification](#scenario-oriented-verification) for visible outcomes and scenario-local inputs.

## Project-Root Imports and Paths

Prefer the configured project-root convention for ordinary internal imports, including immediately co-located sibling runtime and type dependencies. Require every supported compiler, test runner, bundler, and editor/language server to resolve it consistently. Use the project's supported root spelling, such as `@/…` for a configured source-root alias or the native Node package-import convention described below; do not impose `@/…` on an incompatible runtime. Co-location alone is not a reason to prefer a relative import.

For production dependencies across domain boundaries, prefer an existing named domain bundle and access its members through that namespace rather than importing an implementation leaf, even when both paths are supported. For example, an external caller can use `import { Search } from "@/services"` and `Search.Workflows.WorkflowSearchIndex` when that is the existing public bundle shape. This names the owning domain at the use site; it is not a request for a new namespace alias or a broader barrel.

For collaborators inside the owning domain/module bundle, prefer direct named imports from the deepest matching supported domain entry point or leaf, using the configured project-root convention for the specifier. This retains domain-owned query imports without making a relative sibling path the default. A supported domain barrel remains valid; never bypass a public package/export boundary for a private file.

Reuse the project's actual export shape and module resolution. This preference concerns import declarations, not barrel re-exports; relative specifiers such as `export { itemsShareGroup } from "./items-share-group"` remain valid. Do not create bundles, widen exports, introduce cycles, or reorganize unrelated imports solely to satisfy the preference. Explicit project-local conventions remain authoritative.

In tests, prefer owning bundle/barrel imports for dependencies and direct full-module imports for the subject under test. Preserve supported resolution, public package/export boundaries, and explicit project-local conventions, including coupled-fixture import exceptions; a deeper private implementation path is not automatically a valid subject import. The production cross-domain preference does not override those explicit test conventions.

Give the primary subject-under-test import its own group, separated from dependency imports by one blank line. Preserve the project's section order, supported paths, and explicit exceptions; apply an accepted grouping correction across the requested test scope without unrelated cleanup.

Model barrels are an exception to the dependency-bundle preference: export models only. Import a model-owned constant or enum directly from that model's module instead of expanding the model barrel. This does not change service-barrel grouping or permit bypassing public package/export boundaries. Explicit project-local conventions remain authoritative.

Preserve the positions and order of unchanged imports when editing unrelated behavior. Do not move them merely to tidy or alphabetize a touched file; retain required new imports and intentional import changes. Review the full PR diff for equivalent incidental moves and remove them. Explicitly requested import cleanup and changes required by project tooling remain valid.

Group intentionally changed imports by conceptual distance and responsibility, following the project's existing sections rather than imposing a universal alphabetical order. Mark genuine type-only declarations, such as attribute types and interfaces, explicitly with `type` and keep them together within the established groups. Generally keep model classes as ordinary imports even when this file currently uses them only in type positions; do not convert models to `import type` or inline `type` solely for that local usage. Required compiler/runtime contracts still win, including actual runtime model uses in association decorators. Apply an accepted import correction across the in-scope review diff without moving unrelated imports.

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

Reserve relationship-style `Id`/`id` field names for record references and foreign keys. For UUID membership labels with no independently referenced record, prefer `Identifier` or `Uuid`, such as `groupIdentifier` rather than `groupId`. Preserve actual primary-key `id` fields and genuine foreign keys. Apply an accepted rename consistently across the in-scope contracts and callers rather than changing unrelated established APIs.

For model declarations, follow sibling models' meaningful groups, section-comment headings, and order. Keep persisted fields together, associations together, and lifecycle hooks distinct from unrelated static helpers where those categories exist. Preserve initialization dependencies and behavior, and do not move unrelated imports, invent empty sections, or impose one framework-specific layout everywhere.

## Function Action Names

Name functions, including event/error callbacks, for the concrete operation, effect, or result they perform rather than their caller or triggering event. Prefer `openVerificationDialog` over a vague `handleChallenge` when opening the dialog is the operation. Preserve established framework-required names and keep renames scoped to affected functions and callers; do not rename unrelated code.

Prefer operation-specific verbs over generic `get...` for project-owned helpers: `readResponseHeader` for reading a header and `extractCurrentGapRectangle` for extracting or deriving a rectangle from supplied state. Keep the extracted result descriptive. Preserve ordinary accessors, third-party APIs, framework names, and stronger local precedent; do not mechanically rename unrelated methods.

Match a module's primary named/default export to its filename under the project's casing convention, such as `apiResponseErrorPlugin` in `api-response-error-plugin.ts`. Choose the clearer export or file rename within scope, then align exports, callers, mirrored tests, and test descriptions without changing behavior. Secondary exports and framework-required entrypoints retain their own contracts.

Prefer `assert...` for condition-checking functions that throw on failure, naming the asserted condition so the failure contract is apparent at the call site. Do not mechanically rename boolean predicates or framework-required methods.

Name conversion helpers for the concrete operation and both source and destination, such as `convertPlacementToReorderRequest`, rather than a destination-only `toReorderRequest`. Apply accepted names to the affected helper and every caller while preserving framework-required names and behavior.

Use [UI Navigation Handler Names](#ui-navigation-handler-names) for route changes and [Service Orchestration Readability](#service-orchestration-readability) for intention-revealing domain steps.

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
- **Utility:** generic, domain-independent computation over explicit inputs and outputs. Utilities must not own database queries or model/domain knowledge; put domain-aware persistence and locking orchestration in the owning service/use case, following the project's established persistence and transaction rails.

Protected work should expose its ownership through an intention-revealing `With...` service boundary when that service coordinates the protected action. Do not extract a utility that merely acquires a lock while leaving the domain operation, persistence, and invariant ownership elsewhere. Keep the existing transaction and locking semantics; this is not a mandate for a new layer or ORM.

## Error Ownership and Local Recovery

API/HTTP transport classifies failures and throws typed errors; it must not import presentation state or open recovery UI. UI consumers or existing application/framework error boundaries own recovery presentation. When intermediate callers swallow a failure needed there, correct their propagation rather than introducing UI side effects in transport. Preserve ordinary local handling and cleanup without mandating a new global handler or layer.

For navigation and authentication recovery, prefer an explicit `await` in a valid async handler over `void`-discarding a promise when it makes the operation clearer. A framework caller not awaiting callbacks, or no later statement needing sequencing, does not alone make `await` inappropriate. Preserve callbacks that must return synchronously and intentional concurrency. Readability and rejection ownership are separate: neither `await` nor returning a promise guarantees an external caller handles rejection; retain the established error boundary.

Use a shared core base for application-created error types so deliberate application failures remain distinguishable from unexpected third-party, transport, or unknown failures. Preserve concrete subtypes for distinct failure/recovery contracts; base membership alone does not mean locally recoverable. Name errors for their actual failure contract, not a vague response or an unproven vendor source. Do not wrap every foreign failure just to force it into that hierarchy.

For a custom error hierarchy with response-recognition rules, prefer pure static predicates on the concrete error classes so each category owns its recognition. Name each boolean predicate for the condition it recognizes, such as `ChallengeError.isChallengeResponse(response)` and `UnexpectedHtmlResponseError.isUnexpectedHtmlResponse(response)`, rather than a vague `isThisError` or a uniform `matchesResponse` name without an actual polymorphic contract. Prefer explicit call-site meaning even when the names are longer. The HTTP boundary invokes those predicates in explicit precedence order, then constructs and throws the selected error type. Classification should not require constructing an error or retaining a raw transport response. Do not prescribe classifiers for unrelated errors or introduce a classification framework.

When protocol inspection is genuinely shared by subclasses, put the helper on the narrowest response-owning base as a protected method, static when needed by static predicates, rather than leaving a standalone helper beside one subclass. Do not push response-specific behavior into unrelated operation or authentication error types. Preserve [explicit helper inputs](#private-helper-inputs) when the caller already has the values; moving behavior into a class is not a reason to retain raw transport responses or invent instance state.

When an owning layer has a family of custom error types, group its shared local base and concrete modules in that owner's `errors/` directory, such as `api/errors/`, rather than scattering them among endpoint clients or placing them in an unrelated global bucket. Keep a cross-owner core base with its actual owner. Preserve behavior and migrate all affected imports and applicable documentation; do not require a folder for every isolated error or introduce a new barrel.

In a local catch, consume only positively recognized categories the operation actually handles, then rethrow everything else through existing framework propagation. Do not enumerate exceptional errors to escape an otherwise catch-all toast. Keep `finally` cleanup on handled and rethrown paths. A locally handled failure log should name the operation, include its readable error representation, and retain the original error as structured context, for example ``console.error(`Failed to sync directory: ${error}`, { error })``; use the project's existing logger and safe-disclosure conventions, not a new logging framework. Apply accepted corrections to equivalent touched catches, not unrelated code.

## Text Validation Ownership

In ORM-backed application code, keep ordinary trimming, blank-value handling, accepted character grammar, and canonical-name validation in the existing service/model validation layer; prefer model-level validators for persisted text invariants rather than reproducing that policy in elaborate SQL checks. Follow the accepted normalization-versus-rejection contract; do not invent a universal alphabet or silently normalize rejected input.

Retain relational constraints such as foreign keys, uniqueness, and nullability. Necessary narrowly scoped legacy cleanup belongs in its self-contained migration, not a mutable application-model import. This preference does not ban database constraints or remove an independently required database invariant.

## Thin Persistence Lifecycle Handoffs

For domain-specific background work scheduled from persistence changes, reuse existing ORM lifecycle subscriptions or established event wiring rather than building parallel infrastructure. Keep the lifecycle callback thin: hand off to the owning service/job, which owns affected-record discovery and processing. Do not add domain-specific discovery, orchestration, or transaction overrides to a shared base model.

Do not introduce single-action transaction wrappers solely for lifecycle-triggered background work. When a transaction already exists, reuse the ORM's supported managed-transaction propagation; leave otherwise unwrapped operations unwrapped unless an accepted business invariant requires atomicity. Preserve real multi-write/business transactions. Verify propagation support and configuration in the installed ORM; retain explicit transaction passing where required rather than assuming every ORM behaves like Sequelize 7.

If the initiating mutation and job or durable handoff commit independently, either can succeed while the other fails. Document those consequences and reconcile them with accepted delivery requirements rather than promising atomic delivery.

Preserve the existing delivery and transaction contract. Reusing lifecycle wiring does not justify replacing required durable delivery with transient post-commit PubSub, changing transaction ownership, or mandating a particular ORM.

### Child-Owned Parent Timestamp Propagation

When sibling models establish parent touching as a child persistence responsibility, keep that timestamp propagation in the child model lifecycle rather than one consuming orchestration service. Reuse the existing touch primitive and transaction conventions, covering every accepted child write path. This synchronous persistence side effect is distinct from validation-only rules and background-job handoffs.

Inspect installed ORM and database behavior before choosing instance versus bulk hooks; do not mandate instance hooks or `individualHooks` when a supported bulk hook is needed. Verify that only affected parents are touched, relevant instance/bulk writes propagate timestamps, and rollback preserves parent/child consistency under the accepted transaction contract. Do not impose hooks on projects without that established model convention or add shared-base persistence infrastructure.

### Durable Job Payload Changes

Persisted job arguments are a deployment interface even after all current source callers are migrated. Review changes to argument type, position, arity, and representation when old queued jobs can execute new handler code. Require evidence that an actual prior payload remains readable by the current handler, or an explicit verified migration, queue drain, or versioned-handler cutover before deployment. Prefer a focused prior-payload-to-current-handler regression through the existing serializer/processor; a test using only the new producer is insufficient.

Keep clean cutovers when their prerequisites are verified. Support only evidenced prior payloads while they can still exist; do not require permanent unions, aliases, compatibility shims, a queue framework, or hypothetical payload versions.

## Service Orchestration Readability

A service or use-case top-level method should read like orchestration: guard, derive domain-relevant values, perform side effects, and return the result. Extraction helps only when a named helper makes one step more visible.

Place the action entry point, such as `perform`, before its private implementation helpers. Order helpers by first use, with a helper's cohesive subhelpers immediately beneath their caller, so the reader can follow the action down the file rather than jump through alphabetical or append-only declarations. Preserve constructor/framework requirements, initialization-sensitive declaration order, and stronger local conventions. Apply accepted corrections across the in-scope review diff without changing method behavior or reorganizing unrelated files.

When a create service follows a partial creation-attributes contract, accept the general `Partial<CreationAttributes<Model>>` payload and explicitly guard required field presence inside `perform()` before persistence. Destructure required fields, then pass the narrowed values alongside supported optional creation attributes; do not discard policy-filtered optional fields or use a type assertion to bypass missing required values. Reuse the project's validation error and presence semantics, preserving legitimate falsy values. Keep blank-text handling, normalization, format validation, and persisted constraints with their existing [validation owners](#text-validation-ownership).

Apply the same partial-input contract to an existing dependent ensure service where it reuses creation attributes. Guard required lookup identity before querying and delegate missing-record creation to the create service, which retains its required-field checks. This does not mandate an ensure service, broaden accepted attributes, or require unrelated service refactors.

When an association projection composes serialization with sorting or another transformation, put that multi-step work in a descriptively named local private serializer method. Inside it, serialize into a named local first, then sort or transform on a separate line rather than nesting the calls. Preserve response values, required association ordering, preload guards, and explicit helper inputs. Do not extract every one-step field or introduce a shared abstraction merely to move the expression.

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

At the client/API partial-update boundary, preserve omission of optional association assignment/replacement keys when the caller has not requested that operation. Do not synthesize replacement attributes from embedded response associations during an ordinary PATCH save. Keep explicit replacement and empty-list clearing with the caller that owns the edit, under the API's actual absent/present/empty contract. Inspect backend filtering and established save conventions before replacing a supported whole-record spread with a hand-maintained projection; PATCH does not universally require sparse scalar payloads. Prove that an unrelated save omits replacement attributes while explicit replacement and clearing still reach transport.

Prepare replacement attributes or content before deleting existing records, then keep destructive delete/recreate calls together. Prefer an explicit prepare-then-mutate sequence so preparation can fail before existing state is destroyed. Preserve the existing transaction boundary, required consistency, rollback behavior, and side-effect order; do not add a helper or abstraction just to perform this reorder.

Do not introduce `findOrCreate` as convenience provisioning. When the lifecycle invariant says a record must be new, use direct `create` and let an unexpected existing record fail through the normal constraints and transaction rather than silently reusing or repairing it. Keep explicitly accepted unchanged-state behavior separate; this preference does not authorize changing that path into creation or repair.

When the lifecycle intentionally permits reuse, prefer an owning-domain `EnsureService` over ORM `findOrCreate`: explicitly look up the record, return it when present, and delegate missing-record creation to that domain's `CreateService`. Keep lookup identity and creation policy with their existing owners. Preserve uniqueness, concurrency, and failure semantics; an explicit lookup alone is not a concurrency guarantee. Do not replace required-new creation or accepted unchanged-state behavior with ensure/repair.

In Sequelize 7 projects configured for automatic transaction propagation and nested reuse, put multi-write orchestration inside `db.transaction(async () => ...)` in `perform()` instead of passing transaction objects through service constructors and helpers. Called services and queries use the active context; preserve each service's standalone atomicity and rollback of its writes when an enclosing transaction fails. Inspect the installed version, project settings, and neighboring services before assuming propagation or reuse; retain explicit transaction passing where those guarantees are unavailable. See the existing [CRUD service slice](../templates/backend/express-sequelize-crud/resource-rail-template.md#service-slice); this does not require wrappers around ordinary reads or single-action lifecycle handoffs.

For an ordinary collection read, prefer the mapped model's normal query API, such as `findAll`, over a service that merely wraps the query. Keep required batching orchestration separate; retain a service when it owns a meaningful action or orchestration rather than forwarding alone. `List` is a reasonable generic name for a collection-returning service, but an established domain convention takes precedence: for example, follow a nested resource bundle's `IndexService` shape when that is how neighboring collection endpoints are organized. Inspect adjacent endpoints and keep the operation name aligned with their domain API.

When a response needs existing model associations, prefer the ORM's supported eager-loading/include contract and let owning serializers project them, rather than separately querying children, building ID maps, and manually assigning association arrays. Verify the actual dialect query and preserve authorization, optional associations, soft-delete/cancellation filtering, complete parent pagination/counts, and computed ordering. Keep specialized batching when a demonstrated constraint requires it; this is not one query at any cost. Update consumers only if the accepted response contract changes.

When refactoring a query through an ORM, preserve its existing projection, predicates (including cancellation and deleted-record filtering), ordering, and batching semantics. Verify the returned records and exclusions, not just that the replacement query runs. This preference does not authorize changing a downstream table mapping or unrelated query behavior.

In service classes whose constructor stores values for an action, keep reads of those constructor-backed instance attributes in `perform`; pass required IDs, models, and actor context explicitly to private functional helpers. Direct expressions such as `this.currentUser` passed from `perform` are fine; do not add local aliases just to pass them along. Keep stateful helpers that own or coordinate object state separate from functional helpers, and do not invent parameters for state inherently bound to the object.

When a controller has already loaded and authorized the model needed by an action service, prefer passing that model instead of discarding it for an ID and querying it again. If the existing lock helper supports supplied-model reloads, pass the model through it so refresh occurs after lock acquisition and before business-state checks. Preserve transactions, authorization, and required association-loading contracts. This is conditional reuse of project rails, not a mandate to change every ID-taking API or add a locking abstraction.

Treat required caller-loaded associations as developer preconditions: check them at the start of `perform`, before queries, transactions, or mutations, so broken controller/include setup fails immediately. Keep these guards distinct from business-state validation. If the helper would only inspect an already-loaded association and throw when absent, inline that guard at its call site rather than naming it as an async loader.

Preserve the caller's loaded association graph when returning an updated instance. Avoid an unnecessary reload followed by manually restoring one association. If reload is necessary, use the normal loading contract with the complete required include graph; restoring one parent association does not preserve nested or sibling preloads.

Prefer CRUD-style operation names for new or refactored services when they accurately describe the action; use `Update...Service` over `Set...Service` for changes to existing state. Do not force unrelated domain actions into misleading CRUD names. For search-index lifecycle services, explicitly include `Index` in the class and file name (for example, `UpdateIndexService` and `update-index-service.ts`), even when a containing directory already names the index. Do not apply index naming to unrelated document or workflow operations.

Group service barrel exports with standard CRUD/read entries first, special actions next, and bundled namespaces last. Read-only definition or value exports belong in the ordinary CRUD/read group, alphabetized with its entries; do not create a separate category merely because they are definitions. Alphabetize exported symbols within each group, not globally across the groups; keep named exports, namespace imports, and default-export object keys aligned with those groups. Separate groups with one blank line and established section labels. Add another meaningful category when needed rather than forcing unrelated operations into a group or rewriting unrelated established barrels. Preserve exported names.

## Query Names and Cohesive Projections

For SQL aliases and query variables, prefer descriptive entity-and-role names over generic or terse labels. Name the records represented (for example, SQL aliases `pending_workflow_search_document_changes` and `processed_workflow_search_document_changes`) and apply accepted naming changes consistently across the affected query scope without changing predicates or behavior.

Name a model association after its natural plural domain collection, such as `tags` for `Tag[]`, rather than adding a generic `Records` suffix only because a primitive projection occupies that name. Give the derived values a descriptive name such as `tagNames`. Keep transport naming in the serializer contract, follow stronger project conventions, and limit renames to affected associations and callers.

Name model scopes and similar query abstractions for their filtering or projection effect, not their caller, trigger, or downstream operation, and match established sibling naming conventions. A scope that projects a search document might be `withSearchDocument`, not `forSearchIndex`; the concrete name belongs to the project. Keep a shared scope when it has real reuse; inline a one-off query when that removes needless indirection without duplicating a shared contract.

Keep closely related projections under one cohesive query scope—for example, include related organization and personal ranking projections in a suggestion-ranking scope—rather than requiring callers to compose a separate scope for each dimension. Keep genuinely different concerns, such as administrator usage analytics, separate.

For multi-property query/options object arguments, put each property on its own line even when the object fits the print width. Expand nested query/predicate objects too, even when each nested level has only one property, such as `where` → `deletedAt` → `[Op.is]`. Preserve option values and behavior, apply the correction consistently within the affected review scope, and leave unrelated objects alone. Project-local formatting conventions still win.

## Explanatory Comments

For explanatory comments, prefer JSDoc-style blocks that explain the mechanism and rationale, especially for non-obvious lifecycle state or invariants. State the actual captured boundary, when it is captured, what it gates, and why that gate or cache exists; describe lazy first-use behavior accurately rather than calling it startup. This does not require converting short inline comments or Arrange/Act/Assert markers.

During edits and simplification, retain accurate comments that explain framework/library callback execution conditions, mechanisms, or rationale not obvious from nearby statements. Move them with the relevant handler when needed; remove or revise them when obsolete or misleading. Redundant comments may still be removed, and this does not require converting inline comments to JSDoc.

Preserve existing TODOs and improvement suggestions until their requested outcome is actually implemented. Compare the suggestion's full scope with the change before removing it as completed; an adjacent fix or partial improvement is not fulfillment. Restore prematurely removed suggestions. Explicit user-directed removal remains authoritative; this does not require a TODO inventory or unrelated implementation.

When adding an explanatory comment convention, apply it consistently across comparable in-scope code or omit redundant commentary instead of leaving a one-off explanation. Preserve comments with distinct non-obvious rationale and functional tooling directives; consistency does not mean identical comments everywhere or broader cleanup.

## Shared Content and Presentation Contracts

When content requirements appear to conflict with a shared field limit or sanitizer, inspect the field's semantics, storage capacity, original constraint rationale, and sanitization contract plus all consumers before proposing an exception. Prefer a consistent contract across event types over an event-specific bypass. Distinguish stored content from compact presentation, and separate their policies when the existing model supports it. Do not assume a new field or universal UI-only truncation is required without inspecting the model and rendering surfaces.

When an initiating application service creates an event containing user-authored rich text, prepare the accepted sanitized content there before handing off the event. Notification coordinators, channels, and mailers consume that explicit prepared payload rather than owning normal-path sanitization policy or reconstructing content from raw source records. Reuse the existing sanitizer and representation contract; this does not require storing HTML universally or removing independently necessary final-boundary safety checks.

## Guarded Computations

When one predicate gates multiple related computed fields or a multi-line computation, prefer explicit branching with a descriptively named helper and early return when that makes the normal path easier to follow and removes repeated conditions or nesting.

Keep the predicate's exact boundary, result shape, evaluation order, side effects, and excluded-case behavior unchanged. Avoid ternaries when a clear branch or guard expresses the control flow; do not extract a wrapper solely to eliminate a ternary or `?` token.

Prefer explicit logical forks over a shared call with a ternary argument when the branches represent different operations or choices. Repeat the branch-local call in `if`/`else` when that makes the distinction clear, while reusing shared dependencies and common setup outside the fork. Do not force a single call solely to avoid duplication, extract a wrapper solely to remove syntax, or mechanically eliminate every concise scalar ternary.

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

Register invariant component-wrapper teardown such as `enableAutoUnmount(afterEach)` once in runner-loaded shared setup, not separately in each test file. Inspect `setupFiles` and the installed test utility's lifecycle first; migrate equivalent registrations/imports together to avoid singleton duplicate-registration errors. Keep explicit unmount when disposal is the behavior under test, uncovered-resource cleanup, and scenario-specific setup. This is not permission to centralize asynchronous waits or persisted scenario fixtures.

Present setup registrations before teardown registrations in source, including indirect teardown helpers. For a shared setup that already owns fake timers:

```ts
beforeEach(() => {
  vi.useFakeTimers()
})

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.useRealTimers()
})
```

This setup-then-cleanup order aids reading; moving declarations does not change the runner's separate setup/test/teardown phases. Respect meaningful ordering among hooks in the same phase and the installed utility's behavior.

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

### Pattern Fit and Non-Fit

A pattern is a bounded solution to a recurring responsibility, not a container for all related feature code. Before materially extending it, identify its purpose, owned invariants and lifecycle, allowed dependencies, and excluded concerns. Reuse the parts that fit; place the remainder with its actual feature or domain owner.

Establish fit from the closest maintained local implementation and its callers, not from a pattern name alone. Map each changed responsibility to its existing owner, inputs/outputs, invariant, lifecycle, and allowed dependency direction. Code that already fits a standard local rail belongs there; convenience, fewer files, similar syntax, or a plausible justification does not authorize a new home or expanded responsibility. If local implementations conflict, inspect the governing guidance and actual contracts before treating either as precedent.

Minor extensions are valid when they preserve that responsibility and dependency direction. Adding feature modes, unrelated lifecycle state, or presentation callbacks to a resource-fetching contract is a responsibility change, not merely a small implementation detail. Judge the boundary by meaning, not the number of changed lines.

Allow cohesive local growth and intentional duplication while a stable common responsibility has not emerged. Use the existing [Organization Tests](#organization-tests), [Domain Discovery Checkpoint](#domain-discovery-checkpoint), and [Component-Owned Support Modules](#component-owned-support-modules) to choose the smallest appropriate owner. A named operation may own a meaningful invariant with one caller; it does not need to become a generalized pattern. Introduce a second narrow shared pattern when current cases demonstrate common meaning, invariants, or lifecycle—not just similar syntax or a fixed reuse count.

Outside a pattern still means inside architectural ownership. Keep feature-specific interaction with its component or specialized reactive lifecycle, pure feature transformations with their concept owner, and business transactions with the service/use case rather than the controller. Do not create a catch-all module for everything that does not fit.

Composition connects owners through their public contracts; it does not move their decisions into the coordinator. Keep persistence policy out of presentation, transport details out of domain decisions, and consumer-specific lifecycle state out of shared resource mechanisms unless the project's architecture explicitly owns them there. Review both sides of each changed handoff for duplicated rules, parallel state ownership, reach-through access, and reversed dependencies. A non-fitting operation may need a narrow local owner, not a new reusable pattern.

For example:

- **Purpose-preserving extension:** an existing `save(attributesOverrides = {})` merges extra update attributes over editable record state after its null guard. Use that capability rather than rejecting a legitimate variation for uniformity.
- **Non-fit:** one editor needs drag previews and cancellation state. Compose its resource composable with component-owned coordination or a specialized interaction composable when a distinct reactive lifecycle warrants one; keep pure placement calculations with their feature owner. Do not add editor modes and callbacks to ordinary resource fetching.
- **Different action, same ownership:** an endpoint needs a workflow update and dependent record creation in one transaction. Give that action an intention-named service operation; a CRUD-template mismatch does not justify putting the transaction in the controller.

Fix genuine shared-contract defects at their owner rather than preserving them through local exceptions. If an accepted requirement changes a domain invariant, revise the model explicitly instead of forcing the new behavior into an inaccurate model. For material boundary decisions, record what fits, what does not, and who owns the remainder in the existing plan or review; do not create another artifact.

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
