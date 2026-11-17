# Service Template

Use for reusable domain work, multi-step mutations, or transaction boundaries.

For required transactions, follow [Database Transaction Entry Point](../../../references/express-light-rail-backend-concepts-reference.md#database-transaction-entry-point): use the project's established database owner (`import db from "@/models"` and `db.transaction(...)` where supported), not a scoped model's `.sequelize`. This includes required read-only snapshots; preserve options, callback awaiting, scoped queries, and propagation. Do not add transactions or redirect an integration's work to an unrelated database.

When controller helpers already resolve request sorting, consume their supplied order unchanged under [Controller-Owned Request Ordering](../../../references/express-light-rail-backend-concepts-reference.md#controller-owned-request-ordering). Domain operations that independently own ordering retain it.

## Template

```ts
type CreateProjectAttributes = {
  name: string
}

export async function listProjectsForUser(userId: string, query: unknown) {
  // Use the project’s repository/ORM/query-builder and pagination/filter helpers.
}

export async function findProjectForUser(userId: string, projectId: string) {
  // Scope by user or policy before returning sensitive data.
}

export async function createProjectForUser(userId: string, attributes: CreateProjectAttributes) {
  if (!attributes.name) {
    // Replace with the project’s standard validation error.
    throw new Error("Name is required")
  }

  // Use the project’s transaction helper when multiple writes must succeed together.
}
```

## Checklist

- [ ] Accepts primitive ids and validated attributes, not Express request/response objects.
- [ ] Owns business rules, not HTTP status codes.
- [ ] Uses the established database entry point for required multi-write or snapshot transactions, preserving scoped queries and transaction semantics.
- [ ] Returns the shape the serializer expects.
