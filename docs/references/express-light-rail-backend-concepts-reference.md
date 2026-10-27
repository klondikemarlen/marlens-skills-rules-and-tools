# Express Light Rail Backend Concepts Reference

Use with `docs/workflows/express-light-rail-backend-workflow.md` when centralizing Node.js + Express + TypeScript backend feature patterns.

## Rails

- **Route:** URL shape and middleware order.
- **Controller/handler:** request parsing, response status, response JSON, and `next(error)` handoff.
- **Policy/auth check:** access decision; default deny when unclear.
- **Service/use case:** reusable business rule, transaction, or multi-step mutation.
- **Serializer/presenter:** explicit response object.
- **Model/repository:** data access through the project’s existing ORM/query builder.
- **Factory/fixture:** minimal valid test data with unique values where required.

## Rules

Skip rails that the target project does not use. Centralized templates are starting points, not a mandate to add layers.

Controllers should not own business rules. Services should not own HTTP status codes. Serializers should not query the database. Policies should not mutate data.

## Safety Defaults

Validate input before persistence. Authorize before sensitive reads and all writes. Use the project transaction helper for multi-write changes. Keep response fields explicit so private columns, lazy associations, and ORM metadata do not become API surface.

## Detail Responses and Association Visibility

Keep an established show/detail loader for a selected record. If its consumer needs an additional association or field, extend the owning response-loading contract and show serializer, then carry the typed result through the existing frontend detail composable. For example, keep `useWorkflowTemplate(workflowTemplateId)` and add the permitted category reference to the show response instead of replacing it with `useWorkflowTemplates({ where: { id: workflowTemplateId }, perPage: 1 })` solely to obtain category data. Reuse existing serializers and loading conventions; serializers still do not query. Genuine collection search, filtering, and pickers remain collection operations.

Required response associations do not authorize broader visibility. Preserve normal policy and soft-delete filtering in show queries, association includes, and any necessary post-mutation reload. In a Sequelize project whose category model uses paranoid deletion, these options contrast ordinary loading with an unjustified bypass:

```typescript
// Normal category loading, subject to the existing policy/loading contract.
const include = [{ association: "category" }]

// Do not use this merely to satisfy a non-null category response type.
const visibilityBypass = [{ association: "category", paranoid: false }]
```

Apply the same normal include graph when a mutation response genuinely requires reloading; do not add a reload solely for this example or query from a serializer. Association presence, visibility, and requiredness are separate contracts: inspect creation requirements, same-organization/existence validation, and deletion restrictions before claiming that a category is guaranteed. A required foreign key or non-null TypeScript annotation alone is not that proof. Do not hide a broken loading/domain invariant with deleted data, a type assertion, or invented response fields; resolve it at its actual owner using the project's established failure behavior.

Inactive is not deleted. Preserve the domain's existing inactive-record rules rather than treating inactivity as permission to bypass deletion filtering or as an automatic reason to hide an otherwise visible association. Explicitly requested recovery or administrative deleted-record views may deliberately include deleted data under their own authorization and response contract; this exception does not widen ordinary user-facing reads.

Review the distinction with a selected record missing category data, a legitimate collection search, and a post-mutation response requiring the same association. Check live/inactive/deleted visibility against the actual model and policy, separately from the response type. These are authoring decisions, not authorization to migrate a consuming application or add a new endpoint abstraction.

## Optional Collection Summaries

Add collection summaries only when a current caller needs an aggregate over the complete authorized, filtered population. An ordinary policy-scoped list with no aggregate consumer stays unchanged, including an ordinary read in its controller. Do not add unused fields, aggregate queries, an `IndexService`, a base class, or a runtime helper merely to match this example. A real aggregate/orchestration need can use the project's existing collection-service pattern.

Keep collection aggregates distinct from record fields and non-aggregate metadata. A total matching cost belongs alongside the collection; an individual expense's cost belongs on that record; a configured ranking weight is metadata, not an aggregate. When needed, use a typed `{ records, totalCount, summaries }` response, retaining the project's actual resource key instead of mechanically renaming it to `records`.

### Worked Population and Permission Contract

Suppose the policy authorizes organization 7 and the validated request filter selects approved expenses:

| ID  | Organization | Status   | Cost |
| --- | ------------ | -------- | ---- |
| 11  | 7            | approved | 100  |
| 12  | 7            | approved | 200  |
| 13  | 8            | approved | 9000 |
| 14  | 7            | draft    | 8000 |

The matching population is IDs 11 and 12, not every visible record and not just the page. With cost-field and aggregate access explicitly authorized, these illustrative parameterized SQL queries share that population; pagination affects only the records query:

```sql
WITH matching AS (
  SELECT id, cost FROM expenses
  WHERE organization_id = :authorizedOrganizationId AND status = :status
)
SELECT id, cost FROM matching ORDER BY id LIMIT :limit OFFSET :offset;

WITH matching AS (
  SELECT id, cost FROM expenses
  WHERE organization_id = :authorizedOrganizationId AND status = :status
)
SELECT COUNT(*) AS totalCount, COALESCE(SUM(cost), 0) AS totalCost FROM matching;
```

`authorizedOrganizationId` comes from the server's policy decision, not an unrestricted client parameter; `status` is the supported request filter. Use the actual policy-scoped model/query and supported bindings in production, not this minimal organization predicate as a replacement for the project's access policy. Preserve its read-consistency, transaction, ordering, and serialization contracts.

| Request                     | Returned Record IDs | totalCount | summaries            |
| --------------------------- | ------------------- | ---------- | -------------------- |
| approved, limit 1, offset 0 | `[11]`              | 2          | `{ totalCost: 300 }` |
| approved, limit 1, offset 5 | `[]`                | 2          | `{ totalCost: 300 }` |
| rejected, limit 1, offset 0 | `[]`                | 0          | `{ totalCost: 0 }`   |

The empty-page case does not erase the available aggregate. Define empty-population semantics per field: this SUM uses zero; an average or another aggregate may legitimately use a different contract. Never derive a full-population total from page records, `records[0]`, or a page's length.

List visibility does not grant aggregate-field permission. If total-cost access is forbidden, skip cost aggregation and omit `summaries` under this example's contract rather than returning a misleading zero. Keep the ordinary authorized count query without the cost projection; do not run the combined count/cost query above just to obtain `totalCount`. Independently filter sensitive record fields through their policy/serializer; the cost-bearing page projection above assumes that field is permitted. Do not expose hidden values through a summary merely because the caller can list records.

### API and UI Handoff

Using the existing serialized record type, the optional aggregate can be represented as:

```typescript
type Summaries<Field extends string = string> = Record<Field, number>
type ExpensesIndexResponse = {
  records: ExpenseRow[]
  totalCount: number
  summaries?: Summaries<"totalCost">
}
```

Carry that contract through the actual API response type, existing list-state/composable owner, and UI consumer. For example, given an existing typed list request and its owned reactive state:

```typescript
const response: ExpensesIndexResponse = await expensesApi.list(query)
records.value = response.records
totalCount.value = response.totalCount
summaries.value = response.summaries
```

Assign the optional summary on every accepted response, including absence, so a previous permitted result is not retained after the response withholds it. The UI reads collection state directly, preserving a legitimate zero:

```vue
<output v-if="summaries !== undefined">{{ summaries.totalCost }}</output>
```

Reuse the project's formatting/component conventions and existing request lifecycle rather than adding another fetch or custom state wrapper. Do not fall back to the first record or calculate the total from the returned page.

### Attributed Source and Adaptation

Travel Authorization provides the concrete source at commit `3d03b722b79f4e852a9e95b59085fee7894d2ef6`: its [Expenses IndexService](https://github.com/icefoganalytics/travel-authorization/blob/3d03b722b79f4e852a9e95b59085fee7894d2ef6/api/src/services/expenses/index-service.ts) returns `{ expenses, totalCount, summaries: { totalCost } }`, and its [frontend base API types](https://github.com/icefoganalytics/travel-authorization/blob/3d03b722b79f4e852a9e95b59085fee7894d2ef6/web/src/api/base-api.ts) define numeric `Summaries`. The SQL and permission/optional-response examples above illustrate the reusable contract; they are not claims that this exact API or permission shape is implemented there.

Its [IndexService template](https://github.com/icefoganalytics/travel-authorization/blob/3d03b722b79f4e852a9e95b59085fee7894d2ef6/agents/templates/backend-index-service-template.md) explains version-specific Sequelize aggregate options, including clearing pagination/order and joined-policy behavior. Verify the consuming ORM version, dialect, scope options, numeric representation, and JOIN cardinality rather than copying its options or type suppression. Aggregate over one row per matching entity: distinct counts do not fix a duplicated SUM, and `SUM(DISTINCT cost)` incorrectly merges different records with the same cost. Reuse the owning query's supported distinct-identity projection or equivalent policy predicate when joins multiply rows.

Verify three decisions separately: no aggregate consumer means no new contract; a real filtered-total consumer receives the complete authorized aggregate; an out-of-range page retains its aggregate. Also check field-permission withholding, empty-population semantics, and joined-row duplication where applicable. These are consumer contracts, not a mandate to migrate WRAP, ELCC, or any other application.
