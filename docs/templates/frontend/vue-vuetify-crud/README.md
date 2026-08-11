# Vue Vuetify CRUD Templates

Use these templates for Vue 3 + TypeScript admin CRUD screens that use Vuetify, a typed API client, and project-local router/composable/data-table patterns.

## Stack Assumptions

- Vue 3 with `<script setup lang="ts">`.
- Vuetify components are available.
- A typed API client owns HTTP calls and serializer-aligned response types.
- Project-local table, route, toast/snackbar, and error helpers may replace template snippets.

## Templates

- `admin-resource-pages-template.md` - list/show/form page composition and observable states.
- `nested-sibling-resource-routes-template.md` - route topology for a parent-tab list with sibling new/show/edit pages.
- `nested-sibling-resource-table-template.md` - parent-scoped server table and sibling-page navigation.
- `nested-sibling-resource-pages-template.md` - sibling new, show, and edit page states and parent-list return navigation.

Use the nested sibling-resource templates when only the list belongs in a parent detail tab and mutations or detail need independent page shells. Use `admin-resource-pages-template.md` for top-level CRUD, or `../administration-tab-page-template.md` when the child view stays in the parent tab host.

Related shared templates:

- `../api-typescript-template.md` - typed API shape.
- `../searchable-autocomplete-template.md` - debounced reference lookup and filter/autocomplete pattern.
