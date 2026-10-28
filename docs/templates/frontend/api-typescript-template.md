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

export type ResourceQueryOptions = QueryOptions<ResourceWhereOptions, ResourceFiltersOptions>

export const resourcesApi = {
  ResourceStatuses,

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
    attributes: Partial<Resource>
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

1. Enums.
2. Base model type.
3. Serializer-aligned response types: `AsIndex`, `AsShow`, `AsReference`.
4. Policy type.
5. `WhereOptions`, `FiltersOptions`, `QueryOptions`.
6. API methods.

## Resource-Owned POST Actions

Keep collection and item CRUD methods on the parent resource client. Put a POST action that operates on one resource in a separate client module under that resource's API directory, exposing it as `create(resourceId)` rather than adding a custom action verb to the parent CRUD client. Re-export the named client from the existing resource barrel and use the application's existing API bundle. The action client owns its HTTP request; its caller owns workflow coordination, sequencing, refreshes, and user-facing error handling.

Match the backend's actual route, request body, success response contract, and HTTP error behavior. The route below is illustrative, not a required spelling. Do not add guessed response fields or catch/transform errors merely because the action is nested.

`src/api/resources/replicate-estimates-api.ts`

```typescript
import http from "@/api/http-client"

export const replicateEstimatesApi = {
  async create(resourceId: number): Promise<void> {
    await http.post(`/api/resources/${resourceId}/replicate-estimates`)
  },
}

export default replicateEstimatesApi
```

This example has no request body and no consumed response. Preserve the real endpoint's existing body, response type, and return handling when they are part of its contract; do not replace them with this example's `void` contract.

`src/api/resources/index.ts`

```typescript
export { replicateEstimatesApi } from "./replicate-estimates-api"
```

Call through the resource namespace already exposed by the application's API bundle:

```typescript
await api.resources.replicateEstimatesApi.create(resource.id)
```

Keep the parent `resourcesApi` CRUD methods and surrounding caller-owned workflow behavior unchanged.

## Checklist

- Verify frontend types against backend models and serializers.
- Prefer serializer-aligned response types over ad hoc nested shapes.
- Add legacy constants only for existing callers.
- Exclude backend-only fields that serializers never expose.
