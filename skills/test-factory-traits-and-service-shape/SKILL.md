---
name: test-factory-traits-and-service-shape
description: Use when TypeScript tests need reusable persisted relationship setup through Fishery-style factories.
---

# Factory Traits

Use the local `docs/workflows/test-factory-traits-and-service-shape-workflow.md`, then `agents/workflows/test-factory-traits-and-service-shape-workflow.md`; otherwise use the [packaged workflow](workflow.md).

Use the project’s existing factory API. When multiple tests need persisted related records, add an opt-in named builder trait to the owning factory. Keep ordinary factory creation unchanged. See [Fishery reusable builders/traits](https://github.com/thoughtbot/fishery#adding-reusable-builders-traits-to-factories).

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
- Keep unit-test imports direct when that is the project convention.
- For factory type changes, run the project’s test TypeScript check, not only the application build.
