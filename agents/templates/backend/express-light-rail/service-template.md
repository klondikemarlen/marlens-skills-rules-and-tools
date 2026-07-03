# Service Template

Use for reusable domain work, multi-step mutations, or transaction boundaries.

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
- [ ] Uses existing transaction helpers for multi-write changes.
- [ ] Returns the shape the serializer expects.
