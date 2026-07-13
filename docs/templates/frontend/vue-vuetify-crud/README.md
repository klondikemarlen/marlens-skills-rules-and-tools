# Vue Vuetify CRUD Templates

Use these templates for Vue 3 + TypeScript admin CRUD screens that use Vuetify, a typed API client, and project-local router/composable/data-table patterns.

## Stack Assumptions

- Vue 3 with `<script setup lang="ts">`.
- Vuetify components are available.
- A typed API client owns HTTP calls and serializer-aligned response types.
- Project-local table, route, toast/snackbar, and error helpers may replace template snippets.

## Templates

- `admin-resource-pages-template.md` - list/show/form page composition and observable states.

Related shared templates:

- `../api-typescript-template.md` - typed API shape.
- `../searchable-autocomplete-template.md` - debounced reference lookup and filter/autocomplete pattern.
