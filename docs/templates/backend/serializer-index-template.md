# Backend Serializer Index Template

Use this when a TypeScript API exposes typed index/show/reference payloads that should line up with frontend `AsIndex`, `AsShow`, and `AsReference` aliases.

## Placeholders

- `{ResourceName}`: model type.
- `{ResourceNameAsIndex}` / `{ResourceNameAsShow}` / `{ResourceNameAsReference}`: response projection types.
- `{resourceName}`: serializer argument.

## Template

```ts
export type {ResourceNameAsIndex} = Pick<
  {ResourceName},
  | "id"
  | "name"
  | "createdAt"
  | "updatedAt"
>

export type {ResourceNameAsShow} = {ResourceNameAsIndex} & Pick<
  {ResourceName},
  | "description"
>

export type {ResourceNameAsReference} = Pick<
  {ResourceName},
  | "id"
  | "name"
>

export class IndexSerializer extends BaseSerializer {
  perform({resourceName}: {ResourceName}): {ResourceNameAsIndex} {
    return {
      id: {resourceName}.id,
      name: {resourceName}.name,
      createdAt: {resourceName}.createdAt,
      updatedAt: {resourceName}.updatedAt,
    }
  }
}
```

## Verification Checklist

- [ ] Index projection contains only table/list fields.
- [ ] Show projection contains edit/detail fields and explicit associations already eager-loaded by the controller or service.
- [ ] Reference projection contains only autocomplete/filter fields.
- [ ] Frontend API aliases match these projections.
