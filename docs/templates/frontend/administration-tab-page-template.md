# Vue Administration Tab Page Template

Use this when a Vue administration detail layout already owns the parent shell, card, breadcrumbs, and tab navigation, and the child tab only needs to render one parent-scoped related list or focused related view.

## Stack Assumptions

- Vue 3 with `<script setup lang="ts">`.
- TypeScript route props pass the parent id as a string.
- Vuetify-like buttons/slots are available, or can be replaced with local equivalents.
- A project-local server/data-table component already handles fetching, route-query state, pagination, sorting, and refresh.
- A project-local API client/composable/snackbar/confirmation utility exists when delete actions are enabled.

## Placeholders

- `{ParentResourceName}`: PascalCase parent resource, e.g. `Account`.
- `{parentResourceName}`: camelCase parent resource, e.g. `account`.
- `{parent-resource-names}`: kebab-case parent collection segment, e.g. `accounts`.
- `{RelatedResourceNames}`: PascalCase related collection, e.g. `AccountUsers`.
- `{relatedResourceNames}`: camelCase related collection, e.g. `accountUsers`.
- `{related-resource-names}`: kebab-case related collection path, e.g. `account-users`.
- `{ParentForeignKey}`: API filter key for parent scoping, e.g. `accountId`.
- `{RouteQuerySuffix}`: stable tab-specific suffix, e.g. `users`.
- `{optional-hide-parent-column}`: optional prop such as `hide-account-column`.
- `{RelatedResourcePolicyExpression}`: optional row-action policy expression.
- `{DeleteErrorPrefix}`: short user-visible error prefix.

## Template: Filtered Data Table Tab

```vue
<template>
  <{RelatedResourceNames}FilterableDataTableServer
    :where="where"
    route-query-suffix="{RouteQuerySuffix}"
    {optional-hide-parent-column}
  />
</template>

<script setup lang="ts">
import { computed } from "vue"

import {RelatedResourceNames}FilterableDataTableServer from "@/components/{related-resource-names}/{RelatedResourceNames}FilterableDataTableServer.vue"

const props = defineProps<{
  {parentResourceName}Id: string
}>()

const {parentResourceName}Id = computed(() => Number.parseInt(props.{parentResourceName}Id, 10))

const where = computed(() => ({
  {ParentForeignKey}: {parentResourceName}Id.value,
}))
</script>
```

## Template: Filtered Data Table Tab With Optional Delete Action

```vue
<template>
  <{RelatedResourceNames}FilterableDataTableServer
    ref="{relatedResourceNames}Table"
    :where="where"
    route-query-suffix="{RouteQuerySuffix}"
    {optional-hide-parent-column}
  >
    <template #item.actions="{ item }">
      <v-btn
        v-if="{RelatedResourcePolicyExpression}"
        color="error"
        variant="outlined"
        :loading="isDeleting"
        @click="deleteRelatedRecord(item.id)"
      >
        Delete
      </v-btn>
    </template>
  </{RelatedResourceNames}FilterableDataTableServer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"

import confirmAction from "@/utils/confirm-action"
import useSnack from "@/use/use-snack"
import {relatedResourceNames}Api from "@/api/{related-resource-names}-api"
import {RelatedResourceNames}FilterableDataTableServer from "@/components/{related-resource-names}/{RelatedResourceNames}FilterableDataTableServer.vue"

const props = defineProps<{
  {parentResourceName}Id: string
}>()

const {parentResourceName}Id = computed(() => Number.parseInt(props.{parentResourceName}Id, 10))
const {relatedResourceNames}Table = ref<InstanceType<typeof {RelatedResourceNames}FilterableDataTableServer> | null>(null)
const isDeleting = ref(false)
const snack = useSnack()

const where = computed(() => ({
  {ParentForeignKey}: {parentResourceName}Id.value,
}))

async function deleteRelatedRecord(relatedRecordId: number) {
  const confirmed = await confirmAction("Remove this related record?")
  if (!confirmed) return

  isDeleting.value = true
  try {
    await {relatedResourceNames}Api.delete(relatedRecordId)
    await {relatedResourceNames}Table.value?.refresh()
    snack.success("Related record removed.")
  } catch (error) {
    console.error("Failed to remove related record", { error })
    snack.error(`{DeleteErrorPrefix}: ${error}`)
  } finally {
    isDeleting.value = false
  }
}
</script>
```

## Rules

- Keep child tab pages small. Do not rebuild the parent layout, card, breadcrumbs, or tab shell in the child.
- Drive parent identity from route props; convert it once near the top of the file.
- Build one computed `where` object scoped by the parent foreign key.
- Always set a per-tab `route-query-suffix` so sibling tab filters, pagination, and sorting do not collide.
- Hide the parent column when the table already lives under that parent detail page.
- Gate row actions with the existing project-local policy/composable instead of duplicating authorization logic.
- After successful delete/mutation, refresh the table in place and show visible success feedback.
- On failure, preserve the page state, log the developer-facing error, and show visible error feedback.

## Verification Checklist

- Route props parse the expected parent id and handle the project’s id type.
- The `where` object filters by the parent foreign key and no broader records appear.
- The `route-query-suffix` is unique among sibling tabs under the same parent page.
- Optional parent-column hiding still leaves enough context in the table.
- Optional delete/action buttons honor policy state and loading state.
- Successful mutation refreshes the data table without leaving the tab.
- Failed mutation leaves existing rows visible and shows a user-facing error.
- The child tab does not duplicate the parent administration shell.
