# Persisted Factory Relationship

## Task

“Several tests need a workflow a user can access.”

## Without

```ts
const createAccessibleWorkflow = async (user: User) =>
  workflowFactory
    .afterCreate(async (workflow) => {
      await workflowPlayerFactory.create({ workflow, user })
    })
    .create()
```

The helper hides persistence and changes the factory lifecycle for one call site.

## With `test-factory-traits-and-service-shape`

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

## Why

The owning factory names and owns the opt-in relationship. Ordinary creation remains unchanged; tests expose the scenario they need.

## Check

Run the project’s factory TypeScript check and the focused endpoint test that requires this relationship.

Source: [`test-factory-traits-and-service-shape`](../skills/test-factory-traits-and-service-shape/SKILL.md).
