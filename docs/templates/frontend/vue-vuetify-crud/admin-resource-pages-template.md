# Vue Vuetify Admin Resource Pages Template

Use this when a Vue 3 + Vuetify admin area needs list, show, and form pages for a conventional CRUD resource. Keep route paths, labels, auth checks, menu placement, and project command names downstream.

## Placeholders

- `{ResourceName}` / `{ResourceNames}`: PascalCase singular/plural.
- `{resourceName}` / `{resourceNames}`: camelCase singular/plural.
- `{resource-name}` / `{resource-names}`: kebab-case route and file segment.
- `{ResourceNamesApi}`: typed API object.
- `{ResourceNameAsIndex}` / `{ResourceNameAsShow}`: serializer-aligned response types.
- `{RouteBase}`: project-local route name/path base.

## List Page Slice

```vue
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>{ResourceNames}</span>
      <v-spacer />
      <v-btn color="primary" @click="goTo{ResourceName}NewPage">Add {ResourceName}</v-btn>
    </v-card-title>

    <v-card-text>
      <v-text-field
        v-model="search"
        label="Search {resourceNames}"
        clearable
        prepend-inner-icon="mdi-magnify"
        @update:model-value="reloadFromFirstPage"
      />

      <ProjectDataTable
        :items="items"
        :loading="isLoading"
        :total-count="totalCount"
        @update:options="updateTableOptions"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import {ResourceNamesApi}, { type {ResourceNameAsIndex} } from "@/api/{resource-names}-api"

const router = useRouter()
const items = ref<{ResourceNameAsIndex}[]>([])
const totalCount = ref(0)
const isLoading = ref(false)
const search = ref("")

async function fetch{ResourceNames}() {
  isLoading.value = true
  try {
    const response = await {ResourceNamesApi}.list({ filters: { search: search.value } })
    items.value = response.{resourceNames}
    totalCount.value = response.totalCount
  } finally {
    isLoading.value = false
  }
}

function reloadFromFirstPage() {
  // Reset project-local pagination here before fetching.
  fetch{ResourceNames}()
}

function updateTableOptions() {
  fetch{ResourceNames}()
}

function goTo{ResourceName}NewPage() {
  router.push({ name: "{RouteBase}New" })
}

onMounted(fetch{ResourceNames})
</script>
```

## Navigation Handler Names

Name router-navigation handlers after their destination and effect; see [UI Navigation Handler Names](../../../references/code-organization-reference.md#ui-navigation-handler-names).

## Show/Form Slices

- Show pages fetch `{ResourceNameAsShow}`, render loading/error/not-found states, and expose edit/delete only when policy permits.
- Form pages share the same component for create and update when fields overlap; submit through `{ResourceNamesApi}.create` or `.update` and show validation errors returned by the backend.
- Delete confirms intent, calls `{ResourceNamesApi}.delete`, then returns to the list or refreshes the current table.

## Verification Checklist

- [ ] List page renders loading, empty, populated, and server-error states.
- [ ] Search/filter changes reset pagination and refetch.
- [ ] Show page handles missing/forbidden responses without leaving stale data visible.
- [ ] Form page displays backend validation errors next to visible fields or in a project-standard alert.
- [ ] Successful create/update/delete navigates or refreshes according to existing admin behavior.
- [ ] Action buttons obey serialized policy data or the target project’s existing authorization helper.
