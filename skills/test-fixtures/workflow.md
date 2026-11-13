# Factory Trait Workflow

Use when TypeScript tests need reusable persisted relationships, non-persisted API entities, or composable HTTP response mocks, including frontend component fixtures.

1. Inspect the existing factory API and the project’s test TypeScript check.
2. Arrange persisted scenario records explicitly inside each test, even when multiple tests use identical attributes. Keep each scenario self-contained; do not move persisted scenario creation into shared `beforeEach` hooks. Environment setup and teardown, such as fake timers, may still use hooks.
   Use the project's factories, not unrelated production services, to arrange data. Service calls remain valid when the service is the subject under test or when writing a feature test. Apply accepted corrections throughout the requested test scope, preserving identities, deletion states, ordering coverage, and explicit preloads.
   For distinct meaningful records, prefer literal factory calls with named attributes or a supported collection API that exposes those attributes, not tuple-destructuring setup loops used only for compression. Preserve fixture values and lifecycle; homogeneous iteration and input/output case tables remain appropriate under [Scenario-Oriented Verification](../../docs/references/code-organization-reference.md#scenario-oriented-verification).
   Inline single-use literal tables at `describe.each` or `test.each`, with explicit names and callback references, following the same reference's typed registration example. Preserve order, titles, and runtime timing; shared or independently meaningful fixture tables may remain named.
   Use realistic randomized ordinary defaults through existing generators under [Varied Factory Defaults](../../docs/references/code-organization-reference.md#varied-factory-defaults); preserve dependent-field invariants and explicit scenario overrides.
3. Keep one-off scenario inputs in the test; for homogeneous local generation rather than individually numbered declarations, follow [Scenario-Oriented Verification](../../docs/references/code-organization-reference.md#scenario-oriented-verification). For recurring persisted relationship setup, add an opt-in named builder trait to the owning Fishery-style factory; the trait must not change ordinary factory creation. When component tests repeat complete API response entities, reuse or add a factory in the project's established frontend factory location and library, typed to the frontend API contract; keep scenario-specific overrides inline at each build call. Keep one-off inputs literal when no reusable entity shape is needed. Do not import backend model dependencies or mandate a factory library.
   For shared API-response infrastructure support versus scenario-local response data and mount setup, follow [Scenario-Oriented Verification](../../docs/references/code-organization-reference.md#scenario-oriented-verification) before repeating API/configuration/authentication mocks.
   When default plugin installation repeats, use [Typed Default-Plugin Mount Support](../../docs/references/code-organization-reference.md#typed-default-plugin-mount-support); share typed infrastructure, not scenario props, routers, stubs, or assertions. Preserve fresh stateful defaults, appended caller plugin identities, and other options; direct `mount` remains valid.
   For several mocked HTTP endpoints, use composable single-route or map registration with the same direct-payload contract; preserve existing shared handlers and the configured mock lifecycle. Use separate matcher/response definitions for distinct same-URL queries, keeping deferred responses, failures, and assertions local. See [Composable HTTP GET Routes](../../examples/factory-traits-and-service-shape.md#composable-http-get-routes) for query-aware native registrations and the URL-only helper's limits before inventing a dispatcher or adding a mocking dependency.
4. Keep relationship creation inside the trait; do not use per-test transient flags or `.afterCreate(...)` mutations to simulate a trait.
5. Use fixture-backed tests under their descriptive exported names; do not alias them to generic `test` or `it`. Inspect the active runner configuration before adding mock cleanup, rely on configured cleanup, and add local cleanup only for resources or state it does not cover. Preserve intentional mid-test restoration.
6. For dependency-bundle versus direct-subject imports, including the model-owned constant/enum exception, follow [Project-Root Imports and Paths](../../docs/references/code-organization-reference.md#project-root-imports-and-paths).
   For integration-model fixtures and their helpers, follow [Integration Factory Ownership](#integration-factory-ownership).
7. Run the focused test and the test TypeScript check.

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
