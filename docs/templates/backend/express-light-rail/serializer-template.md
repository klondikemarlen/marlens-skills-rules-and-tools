# Serializer Template

Use for explicit API response shape. For operation-specific placement and naming, follow [Primary Operations and Local Implementation](../../../references/code-organization-reference.md#primary-operations-and-local-implementation); retain explicit fields and existing type/barrel conventions.

For projects using `IndexSerializer` and `ShowSerializer`, select by endpoint action under [Serializer Selection by Action](../../../references/express-light-rail-backend-concepts-reference.md#serializer-selection-by-action). Keep the simple function template below when that is the project's existing convention.

Only when the project already uses a class-based family, follow [Existing Class-Based Serializer Dispatch](../../../references/express-light-rail-backend-concepts-reference.md#existing-class-based-serializer-dispatch) for inherited instance serialization, supported collection calls, and typed constructor arguments. Do not replace this function template merely to adopt that pattern.

Follow [Serializer Model Ownership](../../../references/express-light-rail-backend-concepts-reference.md#serializer-model-ownership): ordinary response serializers standardize their model's output and delegate associated-model mappings to their dedicated serializers. A dedicated sync serializer instead owns complete source-to-target attribute conversion with necessary caller context, without a second service mapping; queries, transactions, persistence, and orchestration stay in the service. Check required preloads at the entrypoint before preparing output, distinguishing unloaded `undefined` from accepted loaded null/empty associations.

Use [Repeated Serializer Normalization](../../../references/code-organization-reference.md#repeated-serializer-normalization) for repeated scalar rules and [Serializer Timestamp Conversion](../../../references/code-organization-reference.md#serializer-timestamp-conversion) for named, typed helpers with available Luxon. Preserve the date contract; the pass-through dates below are intentional, not a request to add conversion or a dependency.

For clone-for-creation representations, exclude source primary identity from both the allowlist and final caller payload under [Cloning for New Persisted Records](../../../references/code-organization-reference.md#cloning-for-new-persisted-records); preserve legitimate association identifiers and distinguish editor snapshots.

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

export default serializeProject
```

## Checklist

- [ ] Exposes only intended API fields.
- [ ] Preserves accepted date types, timezone, precision, nullability, and invalid-input behavior across analogous serializer fields.
- [ ] Checks required preloads before output preparation; preserves loaded null and empty collections.
- [ ] Delegates associated-model field mapping through existing dedicated serializer single/collection APIs.
- [ ] Distinguishes ordinary response representation from dedicated sync conversion; the latter owns the complete mapping, not database work or orchestration.
- [ ] Names repeated normalization with private helpers and local results while retaining unchanged field allowlists.
- [ ] Does not query the database.
