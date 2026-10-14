# HTTP Response Matcher Reference

## Choose a Meaningful Assertion Unit

Prefer one `expect` for one observable contract. For an HTTP response, status and body are one result: the response is correct only when both match. Prefer a native matcher or an existing domain matcher when it already expresses that contract. Do not create a wrapper solely to reduce the number of assertions, and do not combine independent effects such as a response plus a database write into one assertion.

If a suitable response matcher is unavailable and adding one is not appropriate, keep the narrow fallback explicit:

```js
expect(response.status).toBe(201)
expect(response.body).toEqual(expectedBody)
```

## Install as a Development Dependency

Install the matcher from its GitHub repository as a test-only dependency:

```bash
npm install --save-dev github:klondikemarlen/marlens-skills-rules-and-tools
```

The matcher is an opt-in ESM module at `marlens-skills-rules-and-tools/lib/http-response-matchers.mjs`. It has no runtime dependencies. Consumers provide their own Jest or Vitest `expect`; the package does not install dependencies into an application runtime or register the matcher automatically. The repository URL follows its default branch; use the commit pinned in the generated lockfile when reproducing an existing install.

## Register It in the Test Runner

The setup/config examples use ESM: use a project with `"type": "module"` or give JavaScript setup and config files the `.mjs` extension. For Jest's native ESM mode, invoke the existing Jest command with Node's VM-module support, for example `node --experimental-vm-modules node_modules/jest/bin/jest.js`. Preserve the project's documented development wrapper and existing transforms when integrating this setup.

Register once in the runner's setup module. Jest setup files run after Jest initializes its assertion environment:

```js
// test/setup-http-response-matcher.js
import { expect } from "@jest/globals"

import { toHaveHttpResponse } from "marlens-skills-rules-and-tools/lib/http-response-matchers.mjs"

expect.extend({ toHaveHttpResponse })
```

```js
// jest.config.js
export default {
  setupFilesAfterEnv: ["<rootDir>/test/setup-http-response-matcher.js"],
}
```

Vitest uses its own `expect` and `setupFiles`:

```js
// test/setup-http-response-matcher.js
import { expect } from "vitest"

import { toHaveHttpResponse } from "marlens-skills-rules-and-tools/lib/http-response-matchers.mjs"

expect.extend({ toHaveHttpResponse })
```

```js
// vitest.config.js
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: ["./test/setup-http-response-matcher.js"],
  },
})
```

Use the `expect` instance supplied by the active runner. For Node's built-in test runner, import `expect` from the development dependency `expect` and register the same matcher explicitly.

## TypeScript Registration

The runtime module has a matching `.d.mts` declaration. Augment the assertion types for the runner used by the project. Keep the applicable augmentation in a `.d.ts` file such as `test/http-response-matchers.d.ts`; do not add an augmentation for an uninstalled runner.

For the `expect` package used by Jest:

```ts
import "expect"

declare module "expect" {
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toHaveHttpResponse(expectedStatus: number, expectedBody: unknown): R
  }
}
```

For current Vitest types:

```ts
import "vitest"

declare module "vitest" {
  interface Matchers<R, T> {
    toHaveHttpResponse(expectedStatus: number, expectedBody: unknown): R
  }
}
```

Make sure TypeScript includes the augmentation file as well as the test setup and tests. Merge the paths into the project's existing `include` list rather than replacing its source entries:

```json
{
  "include": ["src/**/*.ts", "test/**/*.ts", "test/http-response-matchers.d.ts"]
}
```

The setup module must also be within the configured TypeScript project if it is written in TypeScript. An explicit import of `expect` from `vitest` or `@jest/globals` does not require adding runner globals to `compilerOptions.types`.

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
