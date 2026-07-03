# Policy Template

Use for explicit authorization decisions.

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
