# Test Factory Traits and Service Shape Workflow

Use when TypeScript tests need reusable persisted relationships, non-persisted API entities, or composable HTTP response mocks, including frontend component fixtures.

1. Read the project’s factory API, installed library/version, and test TypeScript command. Apply [Native Fixture Setup and Semantic Review](#native-fixture-setup-and-semantic-review) when arranging or reviewing associations and preloads.
2. Arrange persisted scenario records explicitly inside each test, even when multiple tests use identical attributes. Keep each scenario self-contained; do not move persisted scenario creation into shared `beforeEach` hooks. Environment setup and teardown, such as fake timers, may still use hooks.
   Use the project's factories, not unrelated production services, to arrange data. Service calls remain valid when the service is the subject under test or when writing a feature test. Apply accepted corrections throughout the requested test scope, preserving identities, deletion states, ordering coverage, and explicit preloads.
3. Keep one-off scenario inputs in the test; for homogeneous local generation rather than individually numbered declarations, follow [Scenario-Oriented Verification](../references/code-organization-reference.md#scenario-oriented-verification). For recurring persisted relationship setup, add a named opt-in builder trait to the owning Fishery-style factory; the trait must not change ordinary factory creation.
   For distinct meaningful records, prefer literal factory calls with named attributes or a supported collection API that exposes those attributes, not tuple-destructuring setup loops used only for compression. Preserve fixture values and lifecycle; homogeneous iteration and input/output case tables remain appropriate under the same reference.
   Inline single-use literal tables at `describe.each` or `test.each`, with explicit names and callback references, following the same reference's typed registration example. Preserve order, titles, and runtime timing; shared or independently meaningful fixture tables may remain named.
   Use realistic randomized ordinary defaults through existing generators under [Varied Factory Defaults](../references/code-organization-reference.md#varied-factory-defaults); preserve dependent-field invariants and explicit scenario overrides.
4. When component tests repeat complete API response entities, reuse or add a factory in the project's established frontend factory location and library, typed to the frontend API contract. Keep scenario-specific overrides inline at each build call; keep one-off inputs literal when no reusable entity shape is needed. Do not import backend model dependencies or mandate a factory library.
   For shared API-response infrastructure support versus scenario-local response data and mount setup, follow [Scenario-Oriented Verification](../references/code-organization-reference.md#scenario-oriented-verification) before repeating API/configuration/authentication mocks.
   When default plugin installation repeats, use [Typed Default-Plugin Mount Support](../references/code-organization-reference.md#typed-default-plugin-mount-support); share typed infrastructure, not scenario props, routers, stubs, or assertions. Preserve fresh stateful defaults, appended caller plugin identities, and other options; direct `mount` remains valid.
   For several mocked HTTP endpoints, use composable single-route or map registration with the same direct-payload contract; preserve existing shared handlers and the configured mock lifecycle. Use separate matcher/response definitions for distinct same-URL queries, keeping deferred responses, failures, and assertions local. See [Composable HTTP GET Routes](../../examples/factory-traits-and-service-shape.md#composable-http-get-routes) for query-aware native registrations and the URL-only helper's limits before inventing a dispatcher or adding a mocking dependency.
5. Keep relationship creation inside the trait; do not use per-test transient flags or `.afterCreate(...)` mutations to simulate a trait.
6. Use fixture-backed tests under their descriptive exported names; do not alias them to generic `test` or `it`. Inspect the active runner configuration before adding mock cleanup, rely on configured cleanup, and add local cleanup only for resources or state it does not cover. Preserve intentional mid-test restoration.
7. For dependency-bundle versus direct-subject imports, including the model-owned constant/enum exception, follow [Project-Root Imports and Paths](../references/code-organization-reference.md#project-root-imports-and-paths).
   For integration-model fixtures and their helpers, follow [Integration Factory Ownership](#integration-factory-ownership).
8. Run the focused test and test TypeScript check.

## Native Fixture Setup and Semantic Review

Inspect complete changed tests and their invoked setup helpers, not only changed lines. Resolve the actual installed factory package/version and its supported API from the target project's dependency resolution and matching documentation, types, or implementation; do not infer capabilities from a library name or a newer online release. Read applicable local fixture guidance and relevant model associations before proposing a graph/include replacement.

Prefer supported native child-graph and include/loading APIs when they express the scenario without losing behavior. A redundant `reloadForIndexSerializer`-style wrapper that hides scenario-specific preloads or ordering is a finding when the installed API already supports that setup. Keep explicit scenario attributes in Arrange. Evaluate child factory calls into descriptive scenario-local variables before the parent payload, then reference those variables in the association array in the deliberate insertion order. Follow [Function Calls Before Construction](../references/code-organization-reference.md#function-calls-before-construction); native API usage does not excuse nested factory calls inside parent objects or arrays.

Compare the original and proposed scenario contracts: exact values and overrides, existing record identities and foreign keys, explicit nulls and deletion states, build versus create persistence, lifecycle timing, insertion order versus loaded/query order, every required preload and nested association, and unchanged actions and assertions. A reload may return fresh model instances: preserve the identity guarantee actually required by the test rather than claiming object-reference equality without API evidence. Do not sort insertion data merely to make loading simpler or drop deterministic secondary ordering.

Legitimate opt-in owning-factory traits and reusable infrastructure remain valid. A reload required after a mutation is not a redundant initial preload; retain it at the point where fresh state is needed. When the installed library lacks an equivalent graph/include capability, retain explicit creation/loading or justified support rather than requiring a different library or inventing an opaque scenario builder. There is no universal factory, helper, or reload ban.

The supplied agentic contract [`test-fixture-api-alignment.json`](../../verifications/test-fixture-api-alignment.json) owns this focused semantic assessment; Verifier owns selection, final-review execution, and reassessment. Each finding must cite the affected test/helper location, governing guidance, installed API evidence, and the behavior-preserving correction. Missing complete tests, invoked helper code, applicable guidance, installed API/version, or necessary association/lifecycle context yields `BLOCKED` with the exact missing prerequisite, not a speculative `PASS` or `FAIL`. Structural test alignment, assertion counts, typechecking, and behavioral test success remain useful but do not prove fixture semantics. See [contrasting fixture examples](../../examples/factory-traits-and-service-shape.md#native-graph-setup-and-preloads).

## Integration Factory Ownership

Group integration-model factories and integration-specific fixture helpers under that integration's directory in the existing test infrastructure. For example, a project using `api/tests/factories/` can keep:

```text
api/tests/factories/
  index.ts
  travel-authorization-factory.ts
  travel-port-integration/
    index.ts
    air-reservation-segment-factory.ts
```

Here `travelAuthorizationFactory` creates an application-owned model and remains outside the integration namespace; `airReservationSegmentFactory` creates a TravelPort integration model. Integration-specific fixture helpers belong beside the integration factories, not in production integration modules or an unrelated application factory.

Use the project's existing named bundle and barrel convention. In a project using default factory exports and namespace barrels, the integration barrel and test-factory root can expose:

```typescript
// api/tests/factories/travel-port-integration/index.ts
export { default as airReservationSegmentFactory } from "./air-reservation-segment-factory"

// api/tests/factories/index.ts
export * as TravelPortIntegration from "./travel-port-integration"
export { default as travelAuthorizationFactory } from "./travel-authorization-factory"
```

A test directly under `api/tests/` then consumes the appropriate owner:

```typescript
import { TravelPortIntegration, travelAuthorizationFactory } from "./factories"

const segment = await TravelPortIntegration.airReservationSegmentFactory.create()
const travelAuthorization = await travelAuthorizationFactory.create()
```

Keep existing factory/model types and lifecycle semantics. Adapt paths and export syntax to the established bundle convention rather than adding a second convention or factory library. Move affected helper owners, exports, and imports together, removing obsolete flat exports instead of adding compatibility aliases; do not relocate unrelated fixtures.
