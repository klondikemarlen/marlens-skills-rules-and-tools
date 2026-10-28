# Serializer Template

Use for explicit API response shape. For operation-specific placement and naming, follow [Primary Operations and Local Implementation](../../../references/module-boundary-reference.md#primary-operations-and-local-implementation); retain explicit fields and existing type/barrel conventions.

## Template

```ts
export function serializeProject(project: ProjectLike) {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

type ProjectLike = {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
}
```

## Checklist

- [ ] Exposes only intended API fields.
- [ ] Formats dates/enums the same way as sibling serializers.
- [ ] Serializes loaded associations explicitly.
- [ ] Does not query the database.
