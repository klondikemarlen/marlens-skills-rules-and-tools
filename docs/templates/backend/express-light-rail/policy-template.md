# Policy Template

Use for explicit authorization decisions.

In existing class-based policies, construct delegated policies through a private domain-named method on the calling policy, then invoke the permission check from its action. Follow [Delegated Policy Construction](../../../references/express-light-rail-backend-concepts-reference.md#delegated-policy-construction) for the before/after example; preserve user, record, timing, and result without caching or a factory layer. This does not require converting the function template below to a class.

## Independent Permission Decisions

State short guards in each action when the permissions can change independently. In this example, `canUpdateProject()` and `canDestroyProject()` both allow the owner and deny everyone else. `canDestroyProject()` checks ownership itself so a later change to who can update the project does not also change who can delete it. When replacing a shortcut in an existing policy, keep each action's current guards and default-deny behavior.

Ask whether a change to one permission is supposed to change the other. If the guards merely match today, keep them in the policies or actions that own the decisions. Leave trivial guards inline; in an existing class-based policy, use a named private predicate when a check's details would obscure the public action. Here, `create()` states who may create a project note, and `isAccessibleBy()` owns the required association check and the membership test.

```ts
export class ProjectNotesPolicy {
  constructor(
    private readonly user: User,
    private readonly record: ProjectRecord
  ) {}

  create(): boolean {
    return this.isAccessibleBy(this.user.id)
  }

  private isAccessibleBy(userId: number): boolean {
    const { memberships } = this.record
    if (!memberships) {
      throw new Error("Expected project memberships to be preloaded")
    }

    return memberships.some((membership) => membership.userId === userId)
  }
}

type User = {
  id: number
}

type ProjectRecord = {
  memberships?: {
    userId: number
  }[]
}

export default ProjectNotesPolicy
```

The caller loads `memberships`; the policy does not fetch them. An unloaded association throws, while a loaded collection without a matching member (including `[]`) returns `false`. Preserve that distinction and the existing guard order when extracting a predicate. Use the project's existing policy base and preload error where applicable.

If `ProjectAttachmentsPolicy.create()` happens to use the same membership check today, don't make `ProjectNotesPolicy.isAccessibleBy()` public just so the sibling can call it. Keep the check local to each decision so changing note permissions doesn't accidentally change attachment permissions. Share behavior only when the domain calls for it:

- **Deliberate delegation:** When another permission is an explicit prerequisite, such as a child resource requiring access to its parent, keep and document the delegation.
- **Shared invariant:** Use a well-named shared predicate when the same domain fact must change in lockstep for all callers. Each action still decides how that fact affects permission.
- **Domain base class:** Inherit behavior when it belongs to a meaningful common policy type. Don't invent a base class solely to avoid repeating a check.

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
