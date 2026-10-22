# Model / Repository Template

Use for the data-access rail. Keep this ORM-neutral and copy the target project’s live model shape.

Follow sibling models' established declaration groups and section comments. Keep persisted fields and associations in their own meaningful groups, with lifecycle hooks distinct from unrelated static helpers where those categories exist. Preserve initialization dependencies and behavior; do not invent empty sections or impose a universal ORM layout.

## Template

```ts
export type ProjectRecord = {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export async function findProjectById(projectId: string) {
  // Use the project’s existing ORM/query-builder/repository convention.
}

export async function listProjectsByOwner(ownerId: string, query: unknown) {
  // Apply pagination/filter/order using sibling endpoint helpers.
}

export async function createProject(attributes: Pick<ProjectRecord, "name" | "ownerId">) {
  // Use the project’s model/repository create pattern.
}
```

## Checklist

- [ ] Database field names and TypeScript property names follow project convention.
- [ ] Declarations follow sibling models' meaningful section headings and order: persisted fields, associations, lifecycle hooks, and static helpers where present; no empty groups or unrelated import moves.
- [ ] Soft-delete, tenant, or owner scoping matches sibling models.
- [ ] Search/filter/sort helpers are registered where the project expects them.
- [ ] Callers do not bypass required policy scopes.
