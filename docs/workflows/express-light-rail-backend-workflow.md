# Express Light Rail Backend Workflow

Use when adding or changing a backend feature in a Node.js + Express + TypeScript project that follows the light-rail shape: route, controller/handler, policy/auth check, service/use case, serializer, model/data access, and focused tests.

## Intent

**WHY this workflow exists:** Several projects use the same backend feature rails. Centralizing the shape avoids re-copying WRAP-specific docs while keeping the workflow generic enough for Express projects with different ORMs, auth middleware, and test factories.

**WHAT this workflow produces:** A scoped backend slice wired through existing project rails, with explicit auth, validation, response shape, persistence, and verification.

**Decision Rules:**

- Project-local docs, wrappers, model conventions, auth context, error middleware, and factory helpers win.
- Use `docs/templates/backend/express-light-rail/` as the starting point when the project has no closer local template.
- Keep controllers thin: request parsing, status codes, and response shape only.
- Put reusable or multi-step domain work in a service/use-case. Do not create a service for a trivial read if sibling endpoints keep that inline.
- Authorize and validate before mutation. Fail closed when a policy is unclear.
- For required-new record lifecycles, use [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability): prefer strict creation over convenience reuse/repair while preserving accepted unchanged-state paths.
- Serialize explicit fields. Do not leak raw ORM/model objects unless that is already the project contract.
- Use existing dependencies: ORM/query builder, transaction helper, logger, validation, and test factories. Do not add a new framework for the template.
- Keep database/model-aware persistence and locking in the owning service/use case, not generic utilities. For protected work, prefer an intention-revealing `With...` service boundary when it coordinates the action; preserve project persistence and transaction rails.
- Reuse a controller-loaded, authorized model across an action-service handoff when project rails support it. If the existing lock helper can reload a supplied model, refresh it after lock acquisition and before business-state checks. Follow [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability), preserving transaction, authorization, and association-loading contracts without imposing changes on every ID-taking API.
- For persistence-triggered background work, follow [Thin Persistence Lifecycle Handoffs](../references/code-organization-reference.md#thin-persistence-lifecycle-handoffs): reuse existing lifecycle/event wiring, keep callbacks thin, and put discovery/processing in the owning service/job rather than a shared base model. Preserve delivery and transaction semantics.
- Follow the controller/resource namespace for its policy, including nested resources that project a parent model. Compose applicable parent authorization inside the resource policy; do not select the parent policy directly in the controller or scatter resource visibility rules into a listing service. Inspect local nested-policy patterns and preserve existing authorization behavior.
- Fit the controller query types, resource policy scope, and collection service to that resource's model or supported read projection, not a parent model merely relabeled as the child. Reuse parent-access predicates without registering the child policy on the parent model. Inspect existing CRUD patterns; fix the resource boundary rather than adding scope-name overrides to accommodate a mismatch. Preserve shared registration/consumer constants. This does not mandate a new table, SQL view, or universal schema.
- For collection endpoints, including projected/picker resources, inspect sibling request-query helpers. Compose established filter scopes with the resource policy and pass request where conditions to that scoped query: client filters narrow, never replace, authorization. Do not introduce arbitrary query support outside the local contract. Verify combined filtering and an attempted selection outside policy visibility.
- When a derived collection needs distinct values from potentially many persisted parent rows, prefer database-side projection, splitting/aggregation, deduplication, and ordering over loading every parent's values and hydrating ORM instances for application-side aggregation. Selecting fewer columns does not bound row count. Apply authorization and supported filters in the source query; use a raw query or supported read projection following local conventions. Do not mandate normalization, a new table, or a view solely for this optimization; schema normalization is a separate evidence-backed modeling decision.
- Before adding a resource picker or collection service, inspect neighboring domain inputs and collection endpoints. Compose an owning-domain input when existing resource-input components own fetching, loading/error state, and autocomplete rendering; keep model bindings and contextual hints in the parent. Follow the established collection-service bundle and naming, including nested `IndexService` conventions where present, rather than introducing a flat `List<Resource>Service`. Preserve selection, visibility-triggered loading, errors, and authorization. Do not add wrappers for trivial controls or impose a universal layout.

## Process

1. Read the nearest live backend slice for the same area: route, controller/handler, service/use-case, policy/auth, serializer, model, and tests.
2. Pick only the templates needed from `docs/templates/backend/express-light-rail/`.
3. Define the API contract: method, path, params, query/body fields, status codes, response JSON, and error JSON.
4. Add validation at the request boundary using the project’s existing validation style.
5. Add authorization before sensitive reads and all writes. For collections, apply the resource policy together with locally supported filter scopes, then pass the established request where conditions to the authorized query.
6. Implement persistence through the project’s existing model/repository/ORM shape.
7. Serialize the response through the project’s response-shaping pattern.
8. Reuse the project's shared HTTP request/test-support helper when one exists, following its contract. Keep authentication real when testing authentication boundaries; do not replace it with a stub or introduce a new wrapper.
9. Add the smallest runnable test that proves the changed success path and the highest-risk edge.

## Output Contract

```text
Backend slice: <METHOD path or feature name>
Templates used: <express-light-rail files used>
Contract: <request/response/status summary>
Verification: <targeted test or QA command>
Residual risk: <missing external dependency, migration, or none>
```
