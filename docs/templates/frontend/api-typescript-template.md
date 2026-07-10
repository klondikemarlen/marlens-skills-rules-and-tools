# Frontend API TypeScript Template

Use when converting or creating a TypeScript API client module that mirrors backend models, serializers, and query options.

```typescript
import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

/** Keep in sync with the backend model. */
export enum ResourceStatuses {
  REQUESTED = "Requested",
  APPROVED = "Approved",
}

/** @deprecated Prefer `ResourceStatuses`. Keep only when legacy callers still import constants. */
export const STATUSES = Object.freeze({
  REQUESTED: "Requested",
  APPROVED: "Approved",
})

/** Keep in sync with the backend model. */
export type Resource = {
  id: number
  name: string
  status: ResourceStatuses
  createdAt: string
  updatedAt: string
}

/** Keep in sync with the backend index/list serializer. */
export type ResourceAsIndex = Pick<Resource, "id" | "name" | "status">

/** Keep in sync with the backend show/detail serializer. */
export type ResourceAsShow = Resource & {
  relatedRecords: ResourceAsReference[]
}

/** Keep in sync with the backend reference serializer. */
export type ResourceAsReference = Pick<Resource, "id" | "name">

export type ResourcePolicy = Policy

export type ResourceWhereOptions = WhereOptions<Resource, "id" | "status">

export type ResourceFiltersOptions = FiltersOptions<{
  search: string
}>

export type ResourceQueryOptions = QueryOptions<
  ResourceWhereOptions,
  ResourceFiltersOptions
>

export const resourcesApi = {
  ResourceStatuses,
  STATUSES,

  async list(params: ResourceQueryOptions = {}): Promise<{
    resources: ResourceAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/resources", { params })
    return data
  },

  async get(resourceId: number): Promise<{
    resource: ResourceAsShow
    policy: ResourcePolicy
  }> {
    const { data } = await http.get(`/api/resources/${resourceId}`)
    return data
  },

  async create(attributes: Partial<Resource>): Promise<{
    resource: ResourceAsShow
  }> {
    const { data } = await http.post("/api/resources", attributes)
    return data
  },

  async update(
    resourceId: number,
    attributes: Partial<Resource>,
  ): Promise<{
    resource: ResourceAsShow
    policy: ResourcePolicy
  }> {
    const { data } = await http.patch(`/api/resources/${resourceId}`, attributes)
    return data
  },

  async delete(resourceId: number): Promise<void> {
    await http.delete(`/api/resources/${resourceId}`)
  },
}

export default resourcesApi
```

## Ordering Convention

1. Enums and legacy constants.
2. Base model type.
3. Serializer-aligned response types: `AsIndex`, `AsShow`, `AsReference`.
4. Policy type.
5. `WhereOptions`, `FiltersOptions`, `QueryOptions`.
6. API methods.

## Checklist

- Verify frontend types against backend models and serializers.
- Prefer serializer-aligned response types over ad hoc nested shapes.
- Keep legacy constants only when callers still need them.
- Exclude backend-only fields that serializers never expose.
