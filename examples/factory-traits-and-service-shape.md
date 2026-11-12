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

mock.onGet("/api/flight-segments", {
  params: { order: [["departureAt", "ASC"]] },
}).reply(async () => {
  await responsesReady.promise
  return [200, { flightSegments: [{ id: 7, departureAt: "2026-11-12T08:00:00-07:00" }] }]
})

mock.onGet("/api/flight-segments", {
  params: { order: [["departureAt", "DESC"]] },
}).reply(async () => {
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
