# Serializer Template

Use for explicit API response shape.

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
