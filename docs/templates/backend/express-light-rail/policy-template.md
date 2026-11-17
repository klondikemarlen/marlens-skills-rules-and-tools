# Policy Template

Use for explicit authorization decisions.

In existing class-based policies, construct delegated policies through a private domain-named method on the calling policy, then invoke the permission check from its action. Follow [Delegated Policy Construction](../../../references/express-light-rail-backend-concepts-reference.md#delegated-policy-construction) for the before/after example; preserve user, record, timing, and result without caching or a factory layer. This does not require converting the function template below to a class.

## Template

```ts
export function canReadProject(userId: string, project: ProjectLike) {
  if (project.ownerId === userId) return true

  return false
}

export function canCreateProject(userId: string) {
  return Boolean(userId)
}

export function canUpdateProject(userId: string, project: ProjectLike) {
  if (project.ownerId === userId) return true

  return false
}

type ProjectLike = {
  ownerId: string
}
```

## Checklist

- [ ] Default is deny, not allow.
- [ ] Policy functions are pure and do not mutate data.
- [ ] Controller/service calls policy before sensitive reads and writes.
- [ ] Field-level permitted attributes are defined when create/update allow different fields.
