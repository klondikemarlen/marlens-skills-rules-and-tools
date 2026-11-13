# Test Fixture and Response Support

## Persisted Factory Relationship

### Task

“Several tests need a workflow a user can access.”

### Without

```ts
const createAccessibleWorkflow = async (user: User) =>
  workflowFactory
    .afterCreate(async (workflow) => {
      await workflowPlayerFactory.create({ workflow, user })
    })
    .create()
```

The helper hides persistence and changes the factory lifecycle for one call site.

### With `test-fixtures`

```ts
await workflowFactory.accessibleBy(user).create()
```

```ts
accessibleBy(user: User) {
  return this.params({}).afterCreate(async (workflow) => {
    await workflowPlayerFactory.create({ workflow, user })
  })
}
```

### Why

The owning factory names and owns the opt-in relationship. Ordinary creation remains unchanged; tests expose the scenario they need.

### Check

Run the project’s factory TypeScript check and the focused endpoint test that requires this relationship.

Source: [`test-fixtures`](../skills/test-fixtures/SKILL.md).

## Native Graph Setup and Preloads

### Task

“Arrange a serializer scenario with deliberately out-of-order child insertion, explicit nulls, and loaded relationships, without hiding its contract.”

### Without

The [reported serializer helper](https://github.com/icefoganalytics/travel-authorization/blob/98a131b04619a0dcde83af25e55626cc35286326/api/tests/serializers/travel-authorizations/index-serializer.test.ts#L460-L482) reloads `expenses`, `purpose`, `stops.location`, `travelDeskTravelRequest`, `travelSegments.departureLocation`, `travelSegments.arrivalLocation`, and `user`; it orders separately loaded segments by `segmentNumber` then `id`. Its callers create records and then call `reloadForIndexSerializer(travelAuthorization)`. With the reported Factory Shark 2.7.0 capabilities, this hides setup that native graph/include APIs can express. Cite the helper and affected scenario calls, not a blanket objection to reloads.

This attempted native correction still receives a finding:

```ts
const travelAuthorization = await travelAuthorizationFactory.create({
  travelSegments: [
    travelSegmentFactory.build({ segmentNumber: 3, isActual: false }),
    travelSegmentFactory.build({ segmentNumber: 1, isActual: false }),
    travelSegmentFactory.build({ segmentNumber: 2, isActual: false }),
  ],
})
```

Factory calls remain nested in the parent payload. Native API usage alone does not establish readable scenario setup.

### With `test-fixtures`

This Arrange excerpt uses the reported project's existing factories/models and [Factory Shark 2.7.0 child records and includes](https://github.com/klondikemarlen/factory-shark/blob/v2.7.0/README.md#supply-child-records), not a new shared helper or a required library. Resolve the actual installed version and model associations before adapting it:

```ts
// Arrange
const currentUser = await userFactory.create()
const whitehorse = await locationFactory.create({ city: "Whitehorse" })
const vancouver = await locationFactory.create({ city: "Vancouver" })
const toronto = await locationFactory.create({ city: "Toronto" })

const estimatedSegment3 = travelSegmentFactory.build({
  segmentNumber: 3,
  isActual: false,
  departureLocationId: toronto.id,
  arrivalLocationId: whitehorse.id,
})
const estimatedSegment1 = travelSegmentFactory.build({
  segmentNumber: 1,
  isActual: false,
  departureLocationId: whitehorse.id,
  arrivalLocationId: vancouver.id,
})
const estimatedSegment2 = travelSegmentFactory.build({
  segmentNumber: 2,
  isActual: false,
  departureLocationId: vancouver.id,
  arrivalLocationId: toronto.id,
})

const travelAuthorization = await travelAuthorizationFactory
  .include([
    "expenses",
    "purpose",
    { association: "stops", include: ["location"] },
    "travelDeskTravelRequest",
    {
      association: "travelSegments",
      separate: true,
      order: [
        ["segmentNumber", "ASC"],
        ["id", "ASC"],
      ],
      include: ["departureLocation", "arrivalLocation"],
    },
    "user",
  ])
  .create({
    tripTypeEstimate: TravelAuthorization.TripTypes.ROUND_TRIP,
    tripTypeActual: null,
    travelSegments: [estimatedSegment3, estimatedSegment1, estimatedSegment2],
  })

// Act
const result = IndexSerializer.perform(travelAuthorization, currentUser)

// Assert
expect(result.finalDestination).toEqual(expect.objectContaining({ city: "Toronto" }))
```

The named unsaved children are supplied in insertion order `3, 1, 2`; the factory saves them under the new parent. Native loading retains the required query order `1, 2, 3` and secondary `id` order, with the original preloads and explicit `null`. Existing location row identities are reused. Factory Shark preserves supplied child instances while saving; `.include()` loads from the database, so loaded associations need not be those same JavaScript objects. Keep any actual object-reference requirement explicit when deciding whether a replacement fits.

### Valid Contrasts

- A named opt-in trait such as `accessibleBy(user)` above still owns reusable persisted relationship mechanics; it is not a redundant scenario preload wrapper.
- After the action updates related rows, a reload needed to observe fresh persisted state remains valid. An initial `.include()` cannot replace a later reload across a mutation.
- If the installed library lacks equivalent child-graph support or cannot express the required loading/order/lifecycle, retain explicit creation and loading or justified reusable support. Do not migrate libraries to satisfy this example.
- Missing invoked helper code, the actual installed API/version, applicable guidance, or necessary association context is `BLOCKED`, not evidence that all reloads fail or that all native calls pass.

### Semantic Verification Scenarios

Use the supplied `marlens-rules:test-fixture-api-alignment` contract through Verifier's supported final-review path in a fresh OMP process with the released package installed. Record the package/Verifier versions, selected contract ID, complete scenario/helper inputs, actual resolved factory version/API evidence, and review outcome. These are behavioral QA cases, not source-text assertions:

1. Change a serializer test with the reported redundant preload helper; provide complete tests, helper, local guidance, model associations, and installed Factory Shark 2.7.0 evidence. Confirm selection for the changed test and a final-review `FAIL` citing the helper/caller and fitting graph/include API, even if ordinary tests and structural checks pass.
2. Replace it with native includes but nest child builds in the parent payload. Request a fresh assessment; expect a cited `FAIL` for nested construction, not semantic clearance from native API usage.
3. Extract the child builds into named scenario-local records as above, retaining the original scenario's identities, exact attributes/nulls, insertion/query order, persistence, all preloads, action, and assertions. Request an explicit fresh assessment in a new process; expect `PASS` without relying on a prior assessment.
4. Independently exercise the valid trait, required post-mutation reload, and a library with documented absence of equivalent APIs. Expect `PASS` when the complete scenario contract is preserved, not invented migration findings.
5. Omit required helper code, API/version evidence, guidance, or association/lifecycle context in separate cases; expect `BLOCKED` identifying that missing input. Restore it and assess afresh.
6. Drop a preload, explicit null, foreign-key identity, or ordering tie-breaker from the correction; expect `FAIL` for the actual lost contract. A naming-only fix or passing behavioral/structural checks cannot clear it.

Run the target project's focused tests and test TypeScript check separately. Those results prove their own contracts; they do not prove advisor selection, finding delivery, correction reassessment, or fixture semantics. This package supplies the review standard; Verifier owns execution and its existing completion/reassessment mechanism.

## Composable HTTP GET Routes

### Task

“Several endpoints contribute to one scenario. Register their responses independently without hiding the fixtures, query decisions, or real application logic.”

### Without

Each test replaces the entire GET implementation with another URL-dispatch ladder, repeats `{ data: ... }`, and can accidentally discard shared configuration/authentication mocks.

### With `test-fixtures`

Use the project's existing interception layer first. These equivalent Arrange excerpts illustrate payload callbacks, not an MSSRT runtime API or a required dependency:

```ts
mockHttpGetRoute("/api/widgets", () => ({
  widgets: [{ id: 7, name: "Compass" }],
  totalCount: 1,
}))
mockHttpGetRoute("/api/fiscal-periods", () => ({
  fiscalPeriods: [{ id: 3, name: "2026" }],
  totalCount: 1,
}))
```

```ts
mockHttpGetRoutes({
  "/api/widgets": () => ({
    widgets: [{ id: 7, name: "Compass" }],
    totalCount: 1,
  }),
  "/api/fiscal-periods": () => ({
    fiscalPeriods: [{ id: 3, name: "2026" }],
    totalCount: 1,
  }),
})
```

The two forms can also be mixed in one test. Keep entity factory builds, mount options, actions, and visible-result assertions beside that test; keep real loaders/composables in the exercised path.

### Small Axios-Method Mock Example

For a project already mocking its Axios client's methods with Vitest, put this support beside the existing client mock. The runner's setup must mock `@/api/http-client` before importing consumers. Adapt that path to the existing project; do not install a second mock owner.

```ts
import type { AxiosRequestConfig } from "axios"
import { vi } from "vitest"

import httpClient from "@/api/http-client"

type HttpGetRouteHandler = (config: AxiosRequestConfig | undefined) => unknown

export function mockHttpGetRoute(url: string, handler: HttpGetRouteHandler) {
  mockHttpGetRoutes({ [url]: handler })
}

export function mockHttpGetRoutes(routes: Record<string, HttpGetRouteHandler>) {
  const getMock = vi.mocked(httpClient.get)
  const previousImplementation = getMock.getMockImplementation()

  getMock.mockImplementation(async (url, config) => {
    if (Object.hasOwn(routes, url)) {
      const payload = await routes[url](config)
      return { data: payload }
    }

    if (previousImplementation) {
      return previousImplementation(url, config)
    }

    throw new Error(`Unmocked GET ${url}`)
  })
}
```

The callback's `unknown` result includes promises. Awaiting it preserves deferred completion and propagates thrown/rejected failures; it does not simulate HTTP status handling or cancellation.

| Contract       | Behavior                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Composition    | Each registration delegates unmatched requests to the previously installed mock implementation. Earlier routes and unrelated shared GET mocks remain available; other methods are untouched.                                                                       |
| Duplicate URL  | The latest registration wins, whether added singly or in a map. Both forms use the same dispatcher.                                                                                                                                                                |
| Exact matching | Match the URL argument byte-for-byte, not substrings or patterns. `/api/widgets/7`, `/api/widgets/`, and `/api/widgets?active=true` are not `/api/widgets`. Query options in `config.params` remain available to the callback.                                     |
| Payload        | A matched callback returns the body, never the Axios envelope. The helper produces `{ data: payload }` once. A payload legitimately containing a `data` field stays nested; do not guess whether to unwrap it. Existing fallback responses are returned unchanged. |
| Unmatched URL  | Delegate to the existing mock and retain its documented behavior. Without an implementation, reject with `Unmocked GET <url>`. Prefer a strict shared fallback for unexpected requests; never silently introduce live-network passthrough.                         |
| Isolation      | Use the project's configured implementation reset before each test, then recreate shared defaults before scenario registrations. Vitest `mockReset` removes these override chains; `clearMocks` only clears call history. A separate registry is unnecessary.      |

Do not reset or reinitialize the whole client between individual registrations: that would erase earlier overrides. If configured cleanup does not reset these implementations, add that reset once at the existing shared setup owner, not in every test. Shared mutable module mocks are not isolated between concurrent tests in the same module; use the runner's established isolation rather than running those scenarios concurrently.

This intentionally narrow mock serves consumers that read `response.data`. If a scenario needs status, headers, Axios interceptors, cancellation, or actual HTTP serialization, use the project's native adapter/network mocking facilities instead of casting this partial response into a complete Axios response.

### Query, Deferred, and Failure Scenarios

Keep each distinct query matcher and response visible in Arrange instead of branching on request configuration inside a response handler. For a project already using Axios Mock Adapter, these separate definitions match the same URL with different query configurations and share intentional deferred timing:

```ts
const responsesReady = Promise.withResolvers<void>()

mock
  .onGet("/api/flight-segments", {
    params: { order: [["departureAt", "ASC"]] },
  })
  .reply(async () => {
    await responsesReady.promise
    return [200, { flightSegments: [{ id: 7, departureAt: "2026-11-12T08:00:00-07:00" }] }]
  })

mock
  .onGet("/api/flight-segments", {
    params: { order: [["departureAt", "DESC"]] },
  })
  .reply(async () => {
    await responsesReady.promise
    return [200, { flightSegments: [{ id: 9, departureAt: "2026-11-12T17:00:00-07:00" }] }]
  })

// Trigger the real loader and assert its pending state before releasing both responses.
responsesReady.resolve()
```

Here `mock` is the project's existing adapter instance; the adapter owns dispatch and Axios supplies the response envelope. Use the actual query keys and parameter representation. Register specific matchers before an overlapping broad fallback: Axios Mock Adapter matches overlapping handlers in registration order, while identical persistent registrations replace earlier ones. Preserve the existing unmatched behavior (404 by default, or the configured throw/passthrough policy), errors, and reset lifecycle; do not introduce network passthrough.

The URL-only delegation helper above deliberately cannot register distinct `config.params` variants of one URL: another registration replaces that URL's handler. Use existing query-aware support instead of pretending the URL map supports this or introducing a new library. Conditional matching belongs in shared infrastructure, not scenario response selection; homogeneous test tables remain appropriate.

For a loading scenario, return a promise controlled by the test. Resolve it only when the scenario requires the loaded transition:

```ts
const response = Promise.withResolvers<{ widgets: { id: number; name: string }[] }>()
mockHttpGetRoutes({ "/api/widgets": () => response.promise })

// Trigger the real loader and assert its pending state before resolving.
response.resolve({ widgets: [{ id: 7, name: "Compass" }] })
```

Use the project's existing deferred helper when its runtime lacks `Promise.withResolvers`. A failure scenario can throw or return a rejected promise through either registration form; the same error reaches the consumer. Do not turn failures into empty success payloads.

### Pattern Selection and Evidence

| Existing Project Boundary         | Prefer                                                                                | Important Difference                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSW network handlers              | Native `server.use(...)` overrides and configured `resetHandlers()` cleanup.          | Runtime handlers precede baseline handlers; return `HttpResponse.json(payload)`, not `{ data: payload }`. Axios supplies its own response envelope. Query matching uses the request URL; thrown resolver errors are not a direct Axios-method rejection contract. |
| Axios Mock Adapter                | Native `onGet(...).reply(...)`, with body-returning callbacks adapted only if useful. | Replies use `[status, payload]`; Axios supplies the envelope. Identical persistent registrations replace earlier ones, but overlapping matchers remain ordered and URL matching normalizes leading slashes/base URLs.                                             |
| Existing direct Axios-method mock | The small delegation example above.                                                   | Exact URL arguments, arbitrary rejection identity, and the `{ data: payload }` boundary stay explicit without a router or separate mutable registry.                                                                                                              |

Sources:

- [ELCC's original helper](https://github.com/icefoganalytics/elcc-data-management/blob/669d10b1d99b6e52428082b2b752b551fd39eeee/web/tests/support/mock-http-client.ts) already composes overrides by delegation, but expects complete `{ data: ... }` callback results. This example changes that contract to direct payloads.
- [MSW network behavior overrides](https://mswjs.io/guides/best-practices/network-behavior-overrides) explains precedence and restoration of baseline handlers. [Delego's application testing guidance](https://github.com/DelegoLabs/Delego/blob/main/docs/msw-mocking.md) applies resource-handler composition and shared reset to application tests.
- [Axios Mock Adapter's API](https://github.com/ctimmerm/axios-mock-adapter), [registration implementation](https://github.com/ctimmerm/axios-mock-adapter/blob/master/src/index.js), and [matching implementation](https://github.com/ctimmerm/axios-mock-adapter/blob/master/src/utils.js) distinguish replacement from ordered overlap and byte-exact matching.

Do not adopt a dependency solely to copy these names. Do not add a second routing abstraction around native handlers that already express the scenario clearly.

### Check

Exercise the actual support with the project's test runner and test TypeScript check:

1. Register two distinct routes sequentially; request both after the second registration and compare their complete returned payloads with literal expected values.
2. Repeat using a map and mixed map/single registrations; prove the same response shape and latest-route precedence.
3. Retain an unrelated shared GET response and another mocked method; ensure registrations do not replace either. Confirm fallback responses are not wrapped again.
4. Verify exact URL non-matches, callback access to the actual request config, pending-then-resolved responses, and unchanged thrown/rejected errors through both forms.
5. Include a payload whose own field is named `data`; expect `{ data: { data: ... } }`, not heuristic unwrapping.
6. Run a following test under the configured reset; an earlier scenario route must no longer answer, while freshly arranged shared defaults still work.

Keep business fixtures and assertions in their scenarios. These checks prove the support contract; component coverage must still exercise real application behavior rather than mock echoes.
