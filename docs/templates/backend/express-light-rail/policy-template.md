# Policy Template

Use for explicit authorization decisions.

In existing class-based policies, construct delegated policies through a private domain-named method on the calling policy, then invoke the permission check from its action. Follow [Delegated Policy Construction](../../../references/express-light-rail-backend-concepts-reference.md#delegated-policy-construction) for the before/after example; preserve user, record, timing, and result without caching or a factory layer. This does not require converting the function template below to a class.

## Independent Permission Decisions

State short guards in each action when the permissions can change independently. In this example, `canUpdateProject()` and `canDestroyProject()` both allow the owner and deny everyone else. `canDestroyProject()` checks ownership itself so a later change to who can update the project does not also change who can delete it. When replacing a shortcut in an existing policy, keep each action's current guards and default-deny behavior.

Ask whether a change to one permission is supposed to change the other. If the guards merely match today, restate them. If the domain explicitly makes one permission a prerequisite for another, document that relationship and keep the delegation. Keep composition with another resource's policy and use well-named shared predicates for genuine invariants, not just to avoid repeating short guards.

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
  if (project.ownerId === userId) {
    return true
  }

  return false
}

export function canDestroyProject(userId: string, project: ProjectLike) {
  if (project.ownerId === userId) {
    return true
  }

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
