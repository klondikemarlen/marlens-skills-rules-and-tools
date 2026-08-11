# Vue Nested Sibling Resource Routes Template

Use this when a nested resource list belongs in a parent detail page's tab host, but its new, show, and edit pages need sibling routes with their own page shell, breadcrumbs, and action state. Use the ordinary [admin resource pages template](admin-resource-pages-template.md) when the resource is top-level, and [the administration tab page template](../administration-tab-page-template.md) when every view stays inside the parent tab host.

## Boundary

```text
Parent detail layout
└── {ParentRoutePath}/:{parentResourceName}Id/{resource-names}              list tab

Sibling page routes
├── {ParentRoutePath}/:{parentResourceName}Id/{resource-names}/new          new page
├── {ParentRoutePath}/:{parentResourceName}Id/{resource-names}/:{resourceName}Id
└── {ParentRoutePath}/:{parentResourceName}Id/{resource-names}/:{resourceName}Id/edit
```

Keep only the list route under the parent layout. Define the three mutation/detail routes beside that layout route so they do not inherit the tab host shell.

## Placeholders

- `{ParentResourceName}` / `{parentResourceName}` / `{parent-resource-name}`: parent resource in PascalCase, camelCase, and kebab-case.
- `{ParentRoutePath}`: parent detail path without its id, e.g. `/accounts`.
- `{ParentDetailRouteName}`: parent detail route name.
- `{ParentResourceListRouteName}`: named list-tab route under the parent detail layout.
- `{parentResourceName}Id`: parent route param and page prop.
- `{ParentForeignKey}`: nested-resource API filter/key, e.g. `accountId`.
- `{ResourceName}` / `{ResourceNames}` / `{resourceName}` / `{resourceNames}` / `{resource-name}` / `{resource-names}`: nested resource naming variants.
- `{ResourceNewRouteName}`, `{ResourceShowRouteName}`, `{ResourceEditRouteName}`: sibling route names.
- `{RouteGuard}`: project-local authorization guard, if required.

## Route Declaration Shape

Adapt this pseudocode to the project router. Keep the paths, names, params, and parent-context mapping intact; do not introduce a router helper for this one route family.

```ts
parentDetailRoute = {
  path: "{ParentRoutePath}/:{parentResourceName}Id",
  name: "{ParentDetailRouteName}",
  component: {ParentResourceName}TabHost,
  children: [
    {
      path: "{resource-names}",
      name: "{ParentResourceListRouteName}",
      component: {ResourceNames}ListTab,
      guard: {RouteGuard},
    },
  ],
}

siblingRoutes = [
  {
    path: "{ParentRoutePath}/:{parentResourceName}Id/{resource-names}/new",
    name: "{ResourceNewRouteName}",
    component: {ResourceName}NewPage,
    guard: {RouteGuard},
  },
  {
    path: "{ParentRoutePath}/:{parentResourceName}Id/{resource-names}/:{resourceName}Id",
    name: "{ResourceShowRouteName}",
    component: {ResourceName}ShowPage,
    guard: {RouteGuard},
  },
  {
    path: "{ParentRoutePath}/:{parentResourceName}Id/{resource-names}/:{resourceName}Id/edit",
    name: "{ResourceEditRouteName}",
    component: {ResourceName}EditPage,
    guard: {RouteGuard},
  },
]
```

Map every `:{parentResourceName}Id` path param to the same page prop in the local router. In Vue Router, that normally means enabling route props for the list, new, show, and edit components.

## Decision Rules

- Keep the list route under the parent tab host when it is parent-scoped navigation.
- Use sibling pages when creating, viewing, or editing needs an independent shell or breadcrumb trail.
- Include `{parentResourceName}Id` in every sibling route. Never recover parent context from browser history or global state.
- Give the list, new, show, and edit routes unique names. Navigation should use route names and params, not hard-coded URL strings.
- Apply the existing project guard to every route consistently; do not embed policy checks in this topology template.

## Verification Checklist

- [ ] The list renders in the parent detail layout, while new/show/edit render outside it.
- [ ] Every new/show/edit path and route prop includes `{parentResourceName}Id`.
- [ ] The show and edit routes also include `{resourceName}Id`.
- [ ] Route names are unique and each navigation destination supplies all required params.
- [ ] The project-local guard applies equally to list and sibling routes.
