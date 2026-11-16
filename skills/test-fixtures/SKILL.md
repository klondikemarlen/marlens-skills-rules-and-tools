---
name: test-fixtures
description: Use when TypeScript tests need reusable persisted relationships, API entity fixtures, or composable HTTP response mocks, including frontend component tests.
---

# Test Fixtures

Use the local `docs/workflows/test-factory-traits-and-service-shape-workflow.md`, then `agents/workflows/test-factory-traits-and-service-shape-workflow.md`; otherwise use the [packaged workflow](workflow.md).

Use the project’s existing factory API. When multiple tests need persisted related records, add an opt-in named builder trait to the owning factory. Keep ordinary factory creation unchanged. See [Fishery reusable builders/traits](https://github.com/thoughtbot/fishery#adding-reusable-builders-traits-to-factories).

For scenario-local child graphs, preloads, and fixture review, use [Native Fixture Setup and Semantic Review](workflow.md#native-fixture-setup-and-semantic-review). Resolve the installed API/version, name child records before the parent payload, and preserve scenario contracts; valid traits, necessary post-mutation reloads, and libraries without equivalent native APIs remain supported. The [supplied agentic contract](../../verifications/test-fixture-api-alignment.json) assesses semantics, not just test structure.

For repeated HTTP response setup, reuse project-native route mocking or small composable support. Keep scenario payloads local; see [Composable HTTP GET Routes](../../examples/factory-traits-and-service-shape.md#composable-http-get-routes) for single-route and map forms, lifecycle, and failure semantics.

## Without This Guidance

```ts
const createAccessibleWorkflow = async (user: User) =>
  workflowFactory
    .afterCreate(async (workflow) => {
      await workflowPlayerFactory.create({ workflow, user })
    })
    .create()
```

This hides relationship setup in a one-off helper and changes factory lifecycle behavior per test.

## With This Guidance

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

The named trait owns its persisted relationship and remains opt-in.

- Do not use per-test `.afterCreate(...)` mutations or transient flags as a substitute for a reusable trait.
- For dependency-bundle versus direct-subject test imports, use [Project-Root Imports and Paths](../../docs/references/code-organization-reference.md#project-root-imports-and-paths).
- For factory type changes, run the project’s test TypeScript check, not only the application build.
