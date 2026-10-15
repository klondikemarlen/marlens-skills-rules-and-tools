# HTTP Response Matcher Reference

## Choose a Meaningful Assertion Unit

Prefer one `expect` for one observable contract. For an HTTP response, status and body are one result: the response is correct only when both match. Prefer a native matcher or an existing domain matcher when it already expresses that contract. Do not create a wrapper solely to reduce the number of assertions, and do not combine independent effects such as a response plus a database write into one assertion.

If a suitable response matcher is unavailable and adding one is not appropriate, keep the narrow fallback explicit:

```js
expect(response.status).toBe(201)
expect(response.body).toEqual(expectedBody)
```

## Use the Focused Standalone Package

The [standalone `@klondikemarlen/expect-http-response` package](https://github.com/klondikemarlen/expect-http-response) owns the matcher implementation, declarations, installation instructions, and runner-specific setup. Do not install MSSRT to obtain this matcher. Install it as a development dependency with `npm install --save-dev @klondikemarlen/expect-http-response`; see its [installation instructions](https://github.com/klondikemarlen/expect-http-response#installation) for the alternative GitHub route.

Register the matcher once with the active test runner's `expect` instance:

```js
import { expect } from "vitest"
import { toHaveHttpResponse } from "@klondikemarlen/expect-http-response"

expect.extend({ toHaveHttpResponse })
```

Use `@jest/globals` instead of `vitest` for Jest. Follow the standalone package's [installation and runner setup](https://github.com/klondikemarlen/expect-http-response#installation) and [TypeScript declaration guidance](https://github.com/klondikemarlen/expect-http-response#typescript) for project-specific configuration.

## Express and Supertest Example

This example exercises an actual Express route through Supertest. The single assertion describes the response contract; it does not mix in a separate persistence claim:

```ts
import express from "express"
import { expect, test } from "vitest"
import request from "supertest"

const app = express()
app.get("/users/:id", (req, res) => {
  res.status(200).json({
    user: { id: Number(req.params.id), name: "Ada" },
  })
})

test("when the user exists, returns the complete user response", async () => {
  // Arrange: the route above supplies user 7.
  // Act
  const response = await request(app).get("/users/7")

  // Assert
  expect(response).toHaveHttpResponse(200, {
    user: { id: 7, name: "Ada" },
  })
})
```

## Equality and Negation

The matcher compares numeric `response.status` and the complete `response.body`. Body comparison uses the active runner's equality function and custom equality testers, plus iterable equality where the runner exposes it, matching `toEqual` behavior. Transport fields such as request, socket, or response internals are not traversed or serialized.

- Extra body keys fail just as they do with `toEqual`; provide the complete expected body when that is the contract.
- Asymmetric values such as `expect.objectContaining(...)` intentionally request a partial body match.
- `.not` negates the combined status-and-body contract. It passes if either status or body differs, and fails only if both match.
- The expected status must be a finite number, and the received `response.status` must be a finite number. An Express `res.status()` method is not a sent response status. Invalid inputs throw even through `.not`; they are not converted into successful negative assertions.
- Pass `undefined` explicitly as the expected body when the response body is undefined.
