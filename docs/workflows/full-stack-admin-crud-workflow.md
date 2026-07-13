# Full-Stack Admin CRUD Workflow

Use when adding a conventional admin CRUD resource to a Node.js + Express + Sequelize backend and Vue 3 + Vuetify frontend.

## Intent

**WHY this workflow exists:** Downstream repos repeatedly carry large CRUD scaffolds. This workflow extracts the reusable route from those examples without importing project-specific commands, auth setup, route names, domain language, or deployment steps.

**WHAT this workflow produces:** A scoped backend rail, frontend pages/components, typed API surface, and observable verification checklist for one admin resource.

**Decision Rules:**

- Read project-local guidance first. Local route helpers, auth policies, dev wrappers, naming conventions, and serializers win.
- Use only the template slices needed for the current resource; do not generate unused pages, actions, filters, or associations.
- Keep project-specific commands, credentials, deployment, route prefixes, UI labels, and domain terms in the downstream repo.
- If the downstream repo keeps an agent-guidance ledger, update it as an informational/audit-only note. The ledger is not an allowlist and must not restrict upstream discovery.

## Source Material

Inspect the target repo equivalents before editing:

1. Existing model, migration, and association patterns.
2. Existing controller/service/policy/serializer rails for a sibling resource.
3. Existing API client, composable/store, data table, form, and page patterns.
4. Existing tests or browser QA path for admin CRUD.

## Template Slices

- Backend Express/Sequelize rail: [`../templates/backend/express-sequelize-crud/resource-rail-template.md`](../templates/backend/express-sequelize-crud/resource-rail-template.md)
- Vue/Vuetify admin pages: [`../templates/frontend/vue-vuetify-crud/admin-resource-pages-template.md`](../templates/frontend/vue-vuetify-crud/admin-resource-pages-template.md)
- Searchable autocomplete/filter: [`../templates/frontend/searchable-autocomplete-template.md`](../templates/frontend/searchable-autocomplete-template.md)
- Typed API client shape: [`../templates/frontend/api-typescript-template.md`](../templates/frontend/api-typescript-template.md)

## Steps

1. Name the resource placeholders: PascalCase singular, camelCase singular/plural, kebab-case singular/plural, API response keys, and route parameter names.
2. Backend: add or confirm model scope/search behavior, controller actions, policy guards, mutation services, serializers, route registration, and focused tests.
3. Frontend: add typed API methods, list/detail/create/edit/delete UI, filters/search, loading/error/empty states, and refresh-after-mutation behavior.
4. Wire navigation only where the target project already exposes admin navigation; do not invent new menu architecture.
5. Verify observable contracts end to end.

## Verification Checklist

- [ ] List endpoint returns scoped, paginated, sorted rows and `totalCount`.
- [ ] Show endpoint returns `404` when missing, `403` when forbidden, and serialized data plus policy when allowed.
- [ ] Create/update reject unauthorized or invalid payloads and return serialized resource data when successful.
- [ ] Delete uses the project’s deletion convention and refreshes the list without stale rows.
- [ ] Frontend shows loading, empty, success, validation error, authorization error, and network/server error states.
- [ ] Search/filter/autocomplete inputs reset pagination or dependent state when their query changes.
- [ ] Tests or browser QA exercise the real route labels and project-local commands from the downstream repo.

## Output Contract

```text
Resource: <name>
Backend: <model/controller/policy/services/serializers/routes/tests>
Frontend: <api/composable/components/pages/navigation>
Verification: <commands or browser scenario>
Ledger: <not applicable | informational entry updated>
```
