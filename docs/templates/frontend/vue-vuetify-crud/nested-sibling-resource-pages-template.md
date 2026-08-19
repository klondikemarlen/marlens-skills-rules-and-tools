# Vue Nested Sibling Resource Pages Template

Use this for new, show, and edit pages whose nested resource list stays in a parent tab host but whose mutation/detail pages need independent page shells. Each page receives the parent id from its sibling route and returns to the parent list by named route.

## Placeholders

- `{ParentResourceName}` / `{parentResourceName}` / `{parent-resource-name}`: parent resource naming variants.
- `{parentResourceName}Id`: parent route prop.
- `{ParentForeignKey}`: nested-resource create key, e.g. `accountId`.
- `{ParentResourceListRouteName}`: named list-tab return destination.
- `{ResourceName}` / `{ResourceNames}` / `{resourceName}` / `{resourceNames}`: nested resource naming variants.
- `{ResourceNameAsShow}`: serializer-aligned detail response type.
- `{ResourceEditRouteName}`: named sibling edit route.
- `{resourceName}Id`: nested resource route prop.
- `{ResourceApiClient}`: typed API client.
- `{ResourceFormComponent}` / `{ResourceDetailComponent}`: project-local page components.
- `{ResourceCreatePolicyExpression}` / `{ResourceUpdatePolicyExpression}`: project-local policy expressions.
- `{Toast}`: project-local success/error feedback utility.

## Shared Parent Return Navigation

Use the same parent-context return path in new, show, edit, cancel, success, and recoverable-failure UI.

```ts
const props = defineProps<{
  {parentResourceName}Id: string
  {resourceName}Id?: string
}>()

const router = useRouter()

function navigateToParentResourceList() {
  router.push({
    name: "{ParentResourceListRouteName}",
    params: { {parentResourceName}Id: props.{parentResourceName}Id },
  })
}
```

## New Page

```vue
<template>
  <v-card>
    <v-card-title>Add {ResourceName}</v-card-title>
    <v-card-text>
      <{ResourceFormComponent} v-if="{ResourceCreatePolicyExpression}"
      :{parent-resource-name}-id="{parentResourceName}Id" :is-submitting="isSubmitting" @submit="createResource"
      @cancel="navigateToParentResourceList" />
      <v-alert v-else type="error">You cannot add this {ResourceName}.</v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"

const props = defineProps<{
  {parentResourceName}Id: string
}>()

const router = useRouter()
const isSubmitting = ref(false)

function navigateToParentResourceList() {
  router.push({
    name: "{ParentResourceListRouteName}",
    params: { {parentResourceName}Id: props.{parentResourceName}Id },
  })
}

async function createResource(formValues: Record<string, unknown>) {
  isSubmitting.value = true
  try {
    await {ResourceApiClient}.create({
      ...formValues,
      {ParentForeignKey}: props.{parentResourceName}Id,
    })
    {Toast}.success("{ResourceName} created.")
    navigateToParentResourceList()
  } catch (error) {
    console.error("Failed to create {resourceName}", { error })
    {Toast}.error("Could not create {ResourceName}.")
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

## Show Page

```vue
<template>
  <v-progress-linear v-if="isLoading" indeterminate />
  <v-alert v-else-if="errorMessage" type="error">{{ errorMessage }}</v-alert>
  <{ResourceDetailComponent} v-else-if="{resourceName}" :{resource-name}="{resourceName}"
  @back="navigateToParentResourceList" @edit="navigateToResourceEditPage" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"

const props = defineProps<{
  {parentResourceName}Id: string
  {resourceName}Id: string
}>()

const router = useRouter()
const {resourceName} = ref<{ResourceNameAsShow} | null>(null)
const isLoading = ref(true)
const errorMessage = ref("")

function navigateToParentResourceList() {
  router.push({
    name: "{ParentResourceListRouteName}",
    params: { {parentResourceName}Id: props.{parentResourceName}Id },
  })
}

function navigateToResourceEditPage() {
  router.push({
    name: "{ResourceEditRouteName}",
    params: {
      {parentResourceName}Id: props.{parentResourceName}Id,
      {resourceName}Id: props.{resourceName}Id,
    },
  })
}

async function fetchResource() {
  isLoading.value = true
  errorMessage.value = ""
  try {
    {resourceName}.value = await {ResourceApiClient}.get(props.{resourceName}Id)
  } catch (error) {
    console.error("Failed to load {resourceName}", { error })
    errorMessage.value = "Could not load {ResourceName}."
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchResource)
</script>

## Edit Page Rules Start from the show-page loading/error flow, gate the form with `{ResourceUpdatePolicyExpression}`,
pass both route ids to `{ResourceFormComponent}`, and submit through `{ResourceApiClient}.update`. On success, show
`{Toast}` feedback then return to `{ParentResourceListRouteName}` with `{parentResourceName}Id`. On validation or
network failure, keep the form and entered values visible with the project-standard error feedback. ## Verification
Checklist - [ ] New, show, and edit pages each receive `{parentResourceName}Id`; show and edit also receive
`{resourceName}Id`. - [ ] New page creates with `{ParentForeignKey}` from the parent route, never from stale local
state. - [ ] Show page visibly distinguishes loading, successful detail, and failed fetch states. - [ ] Successful
create/update returns to the named parent list route with the same parent id. - [ ] Failed create/update leaves the page
usable and exposes project-standard error feedback. - [ ] No page imports parent-tab host components or assumes a parent
shell is mounted.
```
