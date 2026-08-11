# Vue Nested Sibling Resource Table Template

Use this for the nested resource list rendered inside a parent detail page's tab host. The table owns parent-scoped query state and sends row navigation to sibling new/show/edit pages; those pages do not render inside the tab host.

## Placeholders

- `{ParentResourceName}` / `{parentResourceName}` / `{parent-resource-name}`: parent resource naming variants.
- `{parentResourceName}Id`: parent route prop.
- `{ParentForeignKey}`: API filter key, e.g. `accountId`.
- `{ResourceName}` / `{ResourceNames}` / `{resourceName}` / `{resourceNames}`: nested resource naming variants.
- `{ResourceTableComponent}`: project-local server table component.
- `{ResourceApiClient}`: typed nested-resource API client.
- `{ResourceNewRouteName}` / `{ResourceShowRouteName}` / `{ResourceEditRouteName}`: sibling page route names.
- `{RouteQuerySuffix}`: unique table state suffix for this tab.
- `{ResourcePolicyExpression}`: project-local policy expression for row actions.
- `{ConfirmationHelper}` / `{Toast}`: optional project-local confirmation and feedback utilities.
- `{HideParentColumnProp}`: optional table prop, e.g. `hide-account-column`; remove the whole attribute when unavailable.

## Template

```vue
<template>
  <{ResourceTableComponent}
    ref="resourceTable"
    :where="where"
    route-query-suffix="{RouteQuerySuffix}"
    {HideParentColumnProp}
  >
    <template #header-actions>
      <v-btn color="primary" @click="navigateToResourceNewPage">
        Add {ResourceName}
      </v-btn>
    </template>

    <template #item.actions="{ item }">
      <v-btn
        variant="text"
        @click="navigateToResourceShowPage(item.id)"
      >
        View
      </v-btn>
      <v-btn
        v-if="{ResourcePolicyExpression}"
        variant="text"
        @click="navigateToResourceEditPage(item.id)"
      >
        Edit
      </v-btn>
      <v-btn
        v-if="{ResourcePolicyExpression}"
        color="error"
        variant="text"
        :loading="isDeleting"
        @click="deleteResource(item.id)"
      >
        Delete
      </v-btn>
    </template>
  </{ResourceTableComponent}>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

const props = defineProps<{
  {parentResourceName}Id: string
}>()

const router = useRouter()
const resourceTable = ref<InstanceType<typeof {ResourceTableComponent}> | null>(null)
const isDeleting = ref(false)

const where = computed(() => ({
  {ParentForeignKey}: props.{parentResourceName}Id,
}))

function parentRouteParams() {
  return { {parentResourceName}Id: props.{parentResourceName}Id }
}

function navigateToResourceNewPage() {
  router.push({ name: "{ResourceNewRouteName}", params: parentRouteParams() })
}

function navigateToResourceShowPage({resourceName}Id: string) {
  router.push({
    name: "{ResourceShowRouteName}",
    params: { ...parentRouteParams(), {resourceName}Id },
  })
}

function navigateToResourceEditPage({resourceName}Id: string) {
  router.push({
    name: "{ResourceEditRouteName}",
    params: { ...parentRouteParams(), {resourceName}Id },
  })
}

async function deleteResource({resourceName}Id: string) {
  const confirmed = await {ConfirmationHelper}("Delete this {ResourceName}?")
  if (!confirmed) return

  isDeleting.value = true
  try {
    await {ResourceApiClient}.delete({resourceName}Id)
    await resourceTable.value?.refresh()
    {Toast}.success("{ResourceName} deleted.")
  } catch (error) {
    console.error("Failed to delete {resourceName}", { error })
    {Toast}.error("Could not delete {ResourceName}.")
  } finally {
    isDeleting.value = false
  }
}
</script>
```

## Rules

- Scope the table's server query with exactly `{ParentForeignKey}: props.{parentResourceName}Id`.
- Let `{ResourceTableComponent}` retain the project's pagination, sorting, filters, loading, and empty-state behavior. Do not rebuild that state in the tab.
- Use a unique `{RouteQuerySuffix}` so sibling tabs do not share table query state.
- Refresh the table in place after a successful mutation that starts in the tab; sibling pages navigate back instead.
- Gate actions with the project-local policy expression and use its existing confirmation/toast behavior.

## Verification Checklist

- [ ] The server query returns only records whose `{ParentForeignKey}` matches the current parent id.
- [ ] Table filters, sorting, and pagination remain isolated from sibling tabs.
- [ ] New, show, and edit actions preserve the parent id and target sibling route names.
- [ ] Delete confirmation cancellation leaves the table unchanged.
- [ ] Successful delete refreshes the visible table; failures preserve rows and show project-standard feedback.
