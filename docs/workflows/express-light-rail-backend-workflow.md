# Express Light Rail Backend Workflow

Use when adding or changing a backend feature in a Node.js + Express + TypeScript project that follows the light-rail shape: route, controller/handler, policy/auth check, service/use case, serializer, model/data access, and focused tests.

## Intent

**WHY this workflow exists:** Several projects use the same backend feature rails. Centralizing the shape avoids re-copying WRAP-specific docs while keeping the workflow generic enough for Express projects with different ORMs, auth middleware, and test factories.

**WHAT this workflow produces:** A scoped backend slice wired through existing project rails, with explicit auth, validation, response shape, persistence, and verification.

**Decision Rules:**

- Project-local docs, wrappers, model conventions, auth context, error middleware, and factory helpers win.
- Use `docs/templates/backend/express-light-rail/` as the starting point when the project has no closer local template.
- Keep controllers thin: request parsing, policy-scoped ordinary reads, status codes, and response shape; delegate domain decisions and nontrivial orchestration.
- Keep HTTP failure handling visible in the public action or established error boundary under [Error Ownership and Local Recovery](../references/code-organization-reference.md#error-ownership-and-local-recovery). Required-result service failures propagate by throwing; format-specific helpers prepare successful content, not separate HTTP errors from failure-only sentinels. Finish fallible preparation before success headers; preserve valid empty/optional results and existing error/status contracts.
- Pass policy-filtered request attributes directly to services without controller-side `as` assertions to force compatibility. Fix mismatches in the owning policy/service attribute contracts while preserving filtering, authorization, and the established controller shape; this is not a ban on unrelated TypeScript assertions or a mandate for a particular ORM generic.
- Put reusable or multi-step domain work in a service/use-case. A policy-scoped ordinary collection query may stay in the controller: standard filtering, distinct joined counts, ordering, pagination, and serializers do not force an `IndexService`. Keep meaningful business logic and nontrivial orchestration in services; choose that boundary before applying established service naming. Follow [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability), preserving query/transaction semantics and explicit local architecture.
- Authorize and validate before mutation. Fail closed when a policy is unclear.
- Keep text normalization and format/character validation in the existing service/model owner, following [Text Validation Ownership](../references/code-organization-reference.md#text-validation-ownership). Preserve relational constraints, required migration cleanup, and accepted normalization-versus-rejection behavior.
- For validation-only cross-field rules, use normal model validators or the established service validation boundary under [Text Validation Ownership](../references/code-organization-reference.md#text-validation-ownership), not a new pre-validation hook. Preserve model-owned direct-write enforcement and valid/optional/invalid/asynchronous behavior; genuine lifecycle side effects retain their owner.
- When using partial creation attributes, follow the required-presence guards and optional-field preservation in [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability). Guard inside `perform()` before persistence; keep model validation with its owner and apply the contract to dependent ensure services only where they reuse it.
- Pass optional nullable creation fields directly only when model/database evidence proves omission already persists the accepted NULL value; retain meaningful null transformations and omission/default distinctions. Follow the example and persisted-input checks in [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability), preserving required guards, supported optional fields, and PATCH semantics.
- For required-new versus reuse-intended lifecycles and conditional Sequelize 7 managed transaction context, use [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability): keep strict creation distinct from an explicit owning-domain ensure service, and verify propagation and nested reuse before removing transaction parameters.
- Serialize explicit fields. Do not leak raw ORM/model objects unless that is already the project contract.
- For response association loading and partial updates, apply [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability): prefer supported includes plus owning serializers over manual hydration, and preserve omission of optional replacement inputs rather than deriving them from response associations. Verify dialect/page semantics and explicit replacement/clearing through transport.
- For selected-record data missing from an established detail response, use [Detail Responses and Association Visibility](../references/express-light-rail-backend-concepts-reference.md#detail-responses-and-association-visibility): enrich the owning show response and serializer rather than switching to an index-by-ID workaround. Preserve policy and soft-delete filtering in includes and post-mutation reloads; required associations do not justify exposing deleted records. Genuine collection searches and explicitly authorized recovery views retain their own contracts.
- Use existing dependencies: ORM/query builder, transaction helper, logger, validation, and test factories. Do not add a new framework for the template.
- Keep database/model-aware persistence and locking in the owning service/use case, not generic utilities. For protected work, prefer an intention-revealing `With...` service boundary when it coordinates the action; preserve project persistence and transaction rails.
- Reuse a controller-loaded, authorized model across an action-service handoff when project rails support it. If the existing lock helper can reload a supplied model, refresh it after lock acquisition and before business-state checks. Follow [Service Orchestration Readability](../references/code-organization-reference.md#service-orchestration-readability), preserving transaction, authorization, and association-loading contracts without imposing changes on every ID-taking API.
- For persistence-triggered background work, follow [Thin Persistence Lifecycle Handoffs](../references/code-organization-reference.md#thin-persistence-lifecycle-handoffs): reuse existing lifecycle/event wiring, keep callbacks thin, and put discovery/processing in the owning service/job rather than a shared base model. Preserve delivery and transaction semantics.
- When sibling models own parent timestamp propagation, follow [Child-Owned Parent Timestamp Propagation](../references/code-organization-reference.md#child-owned-parent-timestamp-propagation): keep touching in the child persistence lifecycle, select supported instance/bulk hooks from ORM/dialect evidence, and verify affected-parent isolation and rollback.
- Follow the controller/resource namespace for its policy, including nested resources that project a parent model. Compose applicable parent authorization inside the resource policy; do not select the parent policy directly in the controller or scatter resource visibility rules into a listing service. Inspect local nested-policy patterns and preserve existing authorization behavior.
- Fit the controller query types, resource policy scope, and collection service to that resource's model or supported read projection, not a parent model merely relabeled as the child. Reuse parent-access predicates without registering the child policy on the parent model. Inspect existing CRUD patterns; fix the resource boundary rather than adding scope-name overrides to accommodate a mismatch. Preserve shared registration/consumer constants. This does not mandate a new table, SQL view, or universal schema.
- For collection endpoints, including projected/picker resources, inspect sibling request-query helpers. Compose established filter scopes with the resource policy and pass request where conditions to that scoped query: client filters narrow, never replace, authorization. Do not introduce arbitrary query support outside the local contract. Verify combined filtering and an attempted selection outside policy visibility.
- When a current caller needs a collection-wide aggregate, use [Optional Collection Summaries](../references/express-light-rail-backend-concepts-reference.md#optional-collection-summaries): keep the same authorized/filtered population without pagination, enforce aggregate-field permissions, and carry typed collection state to its UI consumer. An ordinary list without that need remains unchanged.
- When a derived collection needs distinct values from potentially many persisted parent rows, prefer database-side projection, splitting/aggregation, deduplication, and ordering over loading every parent's values and hydrating ORM instances for application-side aggregation. Selecting fewer columns does not bound row count. Apply authorization and supported filters in the source query; use a raw query or supported read projection following local conventions. Do not mandate normalization, a new table, or a view solely for this optimization; schema normalization is a separate evidence-backed modeling decision.
- Before adding a resource picker or collection service, inspect neighboring domain inputs and collection endpoints. Compose an owning-domain input when existing resource-input components own fetching, loading/error state, and autocomplete rendering; keep model bindings and contextual hints in the parent. Follow the established collection-service bundle and naming, including nested `IndexService` conventions where present, rather than introducing a flat `List<Resource>Service`. Preserve selection, visibility-triggered loading, errors, and authorization. Do not add wrappers for trivial controls or impose a universal layout.

## Download Filenames

For related download formats, reuse one filename-building function and the consistent layout `<type>, <title>, <date>.<extension>`. Keep title/date preparation shared rather than constructing different layouts per response. Reuse the project's accepted date formatting, filename safety, and header encoding; do not change attachment versus inline behavior or introduce streaming requirements.

For example, with `title` and `formattedDate` already prepared once under that contract:

```ts
function buildDownloadFilename(type: string, title: string, date: string, extension: string) {
  return `${type}, ${title}, ${date}.${extension}`
}

const csvFilename = buildDownloadFilename("Report", title, formattedDate, "csv")
const pdfFilename = buildDownloadFilename("Report", title, formattedDate, "pdf")
```

Both response paths use the same composition and retain their format's extension. Keep the helper local when the concern is controller-local; a shared global utility is not mandatory.

## Process

1. Read the nearest live backend slice for the same area: route, controller/handler, service/use-case, policy/auth, serializer, model, and tests.
2. Pick only the templates needed from `docs/templates/backend/express-light-rail/`.
3. Define the API contract: method, path, params, query/body fields, status codes, response JSON, and error JSON.
4. Add validation at the request boundary using the project’s existing validation style.
5. Add authorization before sensitive reads and all writes. For collections, apply the resource policy together with locally supported filter scopes, then pass the established request where conditions to the authorized query.
6. Implement persistence through the project’s existing model/repository/ORM shape.
7. Serialize the response through the project’s response-shaping pattern.
8. Reuse the project's shared HTTP request/test-support helper when one exists, following its contract. Keep authentication real when testing authentication boundaries; do not replace it with a stub or introduce a new wrapper.
9. Add the smallest runnable test that proves the changed success path and the highest-risk edge. Keep behavioral suites aligned with the source unit they own; follow [Domain-Oriented Modules and Tests](../references/code-organization-reference.md#domain-oriented-modules-and-tests) when a distinct responsibility warrants its own service/use case and matching test file.

## Output Contract

```text
Backend slice: <METHOD path or feature name>
Templates used: <express-light-rail files used>
Contract: <request/response/status summary>
Verification: <targeted test or QA command>
Residual risk: <missing external dependency, migration, or none>
```
