# Serializer Template

Use for explicit API response shape. For operation-specific placement and naming, follow [Primary Operations and Local Implementation](../../../references/code-organization-reference.md#primary-operations-and-local-implementation); retain explicit fields and existing type/barrel conventions.

For projects using `IndexSerializer` and `ShowSerializer`, select by endpoint action under [Serializer Selection by Action](../../../references/express-light-rail-backend-concepts-reference.md#serializer-selection-by-action). Keep the simple function template below when that is the project's existing convention.

Only when the project already uses a class-based family, follow [Existing Class-Based Serializer Dispatch](../../../references/express-light-rail-backend-concepts-reference.md#existing-class-based-serializer-dispatch) for inherited instance serialization, supported collection calls, and typed constructor arguments. Do not replace this function template merely to adopt that pattern.

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
