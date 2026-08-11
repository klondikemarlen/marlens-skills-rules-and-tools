# Vue Administration Tab-Host Layout Template

Use this for the parent route component that owns a resource detail card, header actions, and navigation between child administration tabs. Build each child tab with [the administration tab page template](administration-tab-page-template.md); do not repeat this shell in the child pages.

## Stack Assumptions

- Vue 3 with `<script setup lang="ts">` and Vue Router.
- Vuetify `v-tabs`, `v-tab`, and `v-btn` components are available, or can be replaced with local equivalents.
- A project-local `{ParentResourceDetailCard}` renders the parent resource and exposes a header-actions slot.
- Parent and child routes receive `{parentResourceName}Id` through route props.

## Placeholders

- `{ParentResourceName}`: PascalCase parent resource, e.g. `Account`.
- `{parentResourceName}`: camelCase parent resource, e.g. `account`.
- `{parent-resource-name}`: kebab-case parent resource, e.g. `account`.
- `{parent-resource-names}`: kebab-case parent collection segment, e.g. `accounts`.
- `{ParentResourceDetailCard}`: project-local host component, e.g. `AccountDetailCard`.
- `{ParentResourceEditRouteName}`: named parent edit route.
- `{ParentResourceOverviewRouteName}`: named default child-tab route.
- `{ParentResourceRelatedRouteName}`: named related child-tab route.

## Template: Parent Tab Host

```vue
<template>
  <{ParentResourceDetailCard} :{parent-resource-name}-id="parentResourceId">
    <template #header-actions>
      <v-btn
        color="primary"
        :to="{
          name: '{ParentResourceEditRouteName}',
          params: { {parentResourceName}Id: parentResourceId },
        }"
      >
        Edit {ParentResourceName}
      </v-btn>
    </template>

    <v-tabs>
      <v-tab
        :to="{
          name: '{ParentResourceOverviewRouteName}',
          params: { {parentResourceName}Id: parentResourceId },
        }"
      >
        Overview
      </v-tab>
      <v-tab
        :to="{
          name: '{ParentResourceRelatedRouteName}',
          params: { {parentResourceName}Id: parentResourceId },
        }"
      >
        Related Records
      </v-tab>
    </v-tabs>

    <RouterView />
  </{ParentResourceDetailCard}>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router"

defineProps<{
  {parentResourceName}Id: string
}>()
</script>
```

## Route Shape

Set `props: true` on the parent route and every child route. The router then passes the same `{parentResourceName}Id` to the tab host and selected child tab.

```ts
{
  path: "/{parent-resource-names}/:{parentResourceName}Id",
  component: {ParentResourceName}TabHost,
  props: true,
  children: [
    {
      path: "",
      name: "{ParentResourceOverviewRouteName}",
      component: {ParentResourceName}OverviewTab,
      props: true,
    },
    {
      path: "related-records",
      name: "{ParentResourceRelatedRouteName}",
      component: {ParentResourceName}RelatedRecordsTab,
      props: true,
    },
  ],
}
```

## Rules

- Keep the tab host responsible only for parent framing, navigation, and parent-level actions.
- Use named child routes in every tab link. Include the parent id in each route's params.
- Give every child tab a unique route name and path; do not reuse one child component for unrelated tabs.
- Keep route-prop names consistent from the parent route through each child component.
- Keep resource loading and table/query state in the owning host or child component; do not add a second parent fetch only to render tabs.
- Replace `{ParentResourceDetailCard}` and the `header-actions` slot with the local host component's actual API.

## Verification Checklist

- Selecting each tab changes to its intended named child route and keeps the selected tab active after navigation or refresh.
- Child route names and paths are unique among this parent's tabs.
- Every tab link includes the current `{parentResourceName}Id` route param.
- The parent route and all child routes set `props: true` and receive the same parent identity.
- Header actions target the intended parent resource, not a hard-coded path or unrelated id.
- Child tabs use [the administration tab page template](administration-tab-page-template.md) when they render parent-scoped related data instead of duplicating this layout.
