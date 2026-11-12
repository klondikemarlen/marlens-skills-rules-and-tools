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

Apply [Service Runtime Exports](code-organization-reference.md#service-runtime-exports) and [Integration Model Contracts](code-organization-reference.md#integration-model-contracts) when authoring these rails: expose the service rather than unrelated runtime exports, and import external-system contracts from their integration-model owners.

## Safety Defaults

Validate input before persistence. Authorize before sensitive reads and all writes. Use the project transaction helper for multi-write changes. Keep response fields explicit so private columns, lazy associations, and ORM metadata do not become API surface.

For cumulative field permissions, prefer one explicit base allow-list, conditional additions, and one final return when this makes the policy clearer. For example, an empty base can receive editable question fields for an authorized administrator and response fields for an authorized owner. Preserve the actual roles, overlapping-role behavior, exact field set, and deny-by-default contract; this layout is not permission to combine mutually exclusive rules or broaden authorization.

## Sequelize: Named Partial Indexes

For partial or complex indexes, prefer named `createIndexDecorator` declarations in the owning project's existing index-module layout rather than an inline `@Index({ unique: true, where: ... })`. Use a descriptive stable decorator identifier and an explicit snake_case database index name matching the migration:

```typescript
import { createIndexDecorator } from "sequelize-typescript"

export const TagsNameUniqueIndex = createIndexDecorator({
  name: "tags_name_unique",
  unique: true,
  where: { deleted_at: null },
})
```

The model imports that decorator from its existing index-module location:

```typescript
@TagsNameUniqueIndex
@Column
declare name: string
```

Here `TagsNameUniqueIndex` is the TypeScript declaration identity; `tags_name_unique` is the migration's database index name on `tags(name)` with the same uniqueness and `deleted_at IS NULL` predicate. Use the installed decorator API and actual column/predicate mapping. When replacing an inline declaration, preserve all indexed fields, ordering, uniqueness, and predicate; do not invent a new constraint. Follow [Self-Contained Migrations](code-organization-reference.md#self-contained-migrations) for routine soft-delete naming. Simple indexes need no mandatory extraction, and another project's directory names are not universal.

## Migration Field Groups

While authoring migrations or doing requested organization cleanup, group columns by role: main fields, timestamps, then extras, with blank lines between groups. Classify from the actual schema, not alphabetically. For example, in an existing Knex migration:

```typescript
await knex.schema.createTable("source_events", (table) => {
  table.increments("id")
  table.string("source_identifier").notNullable().unique()

  table.timestamp("created_at").notNullable().defaultTo(knex.fn.now())
  table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now())

  table.jsonb("source_snapshot").nullable()
})
```

This illustrates layout, not fields or defaults to adopt. Preserve column types, defaults, nullability, constraints, and behavior; do not reorder unrelated existing schemas or released migrations merely for appearance. Follow [Self-Contained Migrations](code-organization-reference.md#self-contained-migrations) for migration ownership and history.

## Sequelize: Explicit Find, Update, or Create

For Sequelize persistence, prefer finding a record by its actual identity, updating the found instance, or creating when absent instead of `Model.upsert` and its returned tuple. Keep this decision in the existing owning operation. Preserve the complete identity predicate, authorized attributes, transaction, validation/hooks, returned-record contract, and failure propagation. This is a Sequelize-specific preference, not a prohibition on SQL conflict handling or other ORMs.

For example, inside an existing persistence step whose `LocalEvent` is identified uniquely by `sourceIdentifier`, with already prepared `attributes` and the operation's existing `transaction`:

```typescript
const existingEvent = await LocalEvent.findOne({
  where: { sourceIdentifier: attributes.sourceIdentifier },
  transaction,
})

let localEvent: LocalEvent

if (existingEvent) {
  localEvent = await existingEvent.update(attributes, { transaction })
} else {
  localEvent = await LocalEvent.create(attributes, { transaction })
}
```

Return or consume `localEvent` through the operation's existing response contract, not an invented `[record, created]` tuple. Use the actual identity, including tenant/source scope or composite keys when required; do not substitute the example's single field. Inspect the installed Sequelize version and production dialect for validation, hook, generated-field, and returned-instance behavior before changing an existing persistence path.

A transaction alone does not make the find/create sequence race-free. Preserve the accepted uniqueness constraints and concurrent-writer/conflict behavior; determine the operation's consistency requirements before choosing any locking, retries, or conflict recovery. Do not silently add those mechanisms or promise atomic conflict handling from this example.

Verify both paths in the consuming project: an existing identity updates the same record without a duplicate, an absent identity creates the expected record, and the returned instance has the required persisted fields. Exercise a persistence failure and verify propagation and the existing rollback contract, including earlier writes in a multi-record synchronization. Preserve unrelated records and check concurrent writers when the operation requires that guarantee.

## Model Collection Queries

Use the model's supported collection APIs at the owning operation, such as `findAll` for a genuinely bounded read or the project's `findEach` for incremental processing. Do not add a custom model finder solely to package ordinary filters, includes, and ordering behind another public name. Preserve meaningful model validation, domain behavior, supported ORM scopes, and demonstrated specialized query contracts; this is not a ban on model methods.

For example, replace a thin `SourceEvent.findAllByRecordLocator(recordLocator)` call with the standard query below, moving its complete options into the existing caller. This illustrative Sequelize model already has the named associations and a unique `sourceIdentifier`; use the target's actual types, registered associations, predicates, and ordering:

```typescript
const sourceQuery: FindOptions<Attributes<SourceEvent>> = {
  where: { recordLocator },
  include: [
    {
      association: "passengers",
      separate: true,
      order: [
        ["lastNameElement", "ASC"],
        ["passengerElement", "ASC"],
      ],
    },
    {
      association: "airReservationSegments",
      separate: true,
      order: [["airSegmentNumber", "ASC"]],
    },
    { association: "serviceFeeTransaction" },
  ],
  order: [
    ["databaseTimestamp", "ASC"],
    ["sourceIdentifier", "ASC"],
  ],
}

const sourceEvents = await SourceEvent.findAll(sourceQuery)
```

Retain policy scoping, association visibility, separate loading, child ordering, projection, pagination, transaction options, and error behavior when removing the wrapper. Update every affected caller and remove the obsolete method rather than keeping a forwarding alias. Moving the query does not authorize changing its population or order. Keep the query in a service when that service owns synchronization or other meaningful orchestration.

### Bounded Synchronization Reads

A familiar collection API alone does not make a large synchronization safe. For potentially large source populations, use supported batched iteration and serialize/process records incrementally rather than loading all models and then building another full transformed collection. Keep genuinely bounded reads simple; this does not require pagination of every endpoint or impose a universal batch size.

Inspect the installed batching implementation and types before choosing its call shape. `findEach` may be project-defined rather than a stock ORM method. Verify options, callback versus async-iterator behavior, awaiting, traversal order, and failure propagation; do not invent a new model base or assume that a method name guarantees bounded reads.

For a project whose existing `findEach(options, processRecord)` loads bounded batches and awaits each callback sequentially, replace the preceding `findAll` call and whole-collection serialization with this loop. Reuse the complete `sourceQuery` above, and keep the existing transaction, single-record serializer, persistence operation, and response collection. Here `persistEvent` names the operation's existing persistence step; for Sequelize, use [Explicit Find, Update, or Create](#sequelize-explicit-find-update-or-create) within that owner rather than `Model.upsert`. The example does not require another helper or service:

```typescript
await SourceEvent.findEach(sourceQuery, async (sourceEvent) => {
  const attributes = SourceEventSerializer.perform(sourceEvent)
  const localEvent = await persistEvent(attributes, transaction)

  synchronizedEvents.push(localEvent)
})
```

This bounds source-batch loading and avoids a second full source-serialization array; it does **not** make total operation memory constant. The returned `synchronizedEvents` collection still grows with the result count, and association fan-out or a large individual record can make a batch large. Identify these remaining accumulations separately. Changing the response to streaming, summaries, or pagination requires its own accepted contract change.

Preserve deterministic traversal, including a unique tie-breaker where needed, without discarding an established primary sort. Check the batching implementation's offset/keyset and concurrent-mutation behavior against the operation's consistency requirements: deterministic order alone is not snapshot consistency. Retain existing filtering, preloads, transaction boundaries, rollback, cancellation, and failure ownership. A local transaction does not automatically provide a snapshot of an external source. Do not translate callback/domain failures into source-query failures merely because both escape the iteration call.

For a focused consuming-project check, use a supported small batch size with three matching source events ordered `201`, `202`, `203`, so processing crosses `[201, 202]` and `[203]`. Observe all three in order with their required associations, including multiple children without cross-product duplication, and exclude another locator's event. Verify empty input performs no work. Exercise a processing failure in the second batch and confirm the existing transaction/error contract rather than partial success or swallowed errors. This checks traversal and processing behavior, not measured peak memory; use the actual installed API and production dialect before claiming compatibility.

## Serializer Selection by Action

In backend rails that already distinguish `IndexSerializer` and `ShowSerializer`, reserve `IndexSerializer` for index endpoints. Use `ShowSerializer` for ordinary single-resource show, create, and update responses. Select by the endpoint's contract, not by whether a serializer happens to accept one record or whether the two representations currently expose identical fields. Keep those contracts distinct so detail responses can evolve without coupling them to collection projection.

For example, in an existing controller whose update service returns the authorized, response-ready record:

```typescript
const updatedProject = await UpdateService.perform(project, permittedAttributes)
const serializedProject = ShowSerializer.perform(updatedProject)

return response.status(200).json({ project: serializedProject })
```

Use the project's real imports, service signature, status, response envelope, and sync/async serializer convention. The selection is `ShowSerializer`, not `IndexSerializer` borrowed for a single record. Ordinary show actions likewise serialize their authorized loaded record with `ShowSerializer`; create actions retain their established status and envelope.

Preserve explicit operation-specific representations such as a clone response and all accepted response fields, policy visibility, and preload requirements. Do not rename unrelated function-based serializers, introduce classes, broaden payloads, or migrate an application merely to adopt this guidance.

## Existing Class-Based Serializer Dispatch

When the project already has a serializer base with a supported collection entrypoint, pass the collection directly to that entrypoint rather than repeating equivalent single-record mapping at each caller. For an index endpoint, prefer `IndexSerializer.perform(records)` to `records.map((record) => IndexSerializer.perform(record))`, forwarding any required context through the supported arguments. Keep [Serializer Selection by Action](#serializer-selection-by-action): accepting an array does not make a show representation the index contract. In an existing class-based family, implement its instance `perform()` contract and inherit dispatch instead of bypassing it with a bespoke static-only method.

Inspect the actual base and callers before replacing a map. Preserve fields, order, required context, preload errors, and the project's sync/async and empty-array behavior. Mapping that filters, transforms, or performs other work beyond equivalent serializer dispatch remains legitimate. A base that aggregates promises is not equivalent to a caller that intentionally returns an array of promises. This guidance does not introduce a base class, migrate function serializers, or authorize a dispatcher rewrite solely to simplify a caller.

### Typed Constructor Inference

For work on an existing dispatcher, infer the record, constructor-tail tuple (`Args extends unknown[]`), and result from the constructor and instance `perform()` contract. Its structural shape is `new (record: Record, ...args: Args) => { perform(): Result }`. Prefer direct inference to `any`-based tail extraction or nested `InstanceType`/`ReturnType` machinery when the target compiler and representative subclasses prove equivalent inference. Keep separate single-record and array overloads. Accept the record or collection separately from `...args`, then forward that same tuple to each constructor; do not call `args.slice(1)` inside every map iteration.

The maintained [Express Light Rail implementation at `90832d2`](https://github.com/klondikemarlen/express-light-rail/blob/90832d2dc836f0b73c9d222b3460268798a9c92c/src/base-serializer/base-serializer.ts) owns the executable base. This example uses that existing contract and the project's own `BaseSerializer` import, not another base implementation:

```typescript
type ProjectRecord = { id: number; name: string }
type SerializerContext = { prefix: string }
type ProjectJson = { id: number; name: string }

class IndexSerializer extends BaseSerializer<ProjectRecord, ProjectJson> {
  constructor(
    record: ProjectRecord,
    private readonly context: SerializerContext,
    private readonly labelCase: "original" | "upper" = "original"
  ) {
    super(record)
  }

  perform() {
    const name = this.labelCase === "upper" ? this.record.name.toUpperCase() : this.record.name

    return { id: this.record.id, name: `${this.context.prefix}${name}` }
  }
}

const project = { id: 1, name: "Library" }
const records = [project]
const context = { prefix: "Public: " }

const single = IndexSerializer.perform(project, context)
const collection = IndexSerializer.perform(records, context, "upper")
```

The calls infer `ProjectJson` and `ProjectJson[]` respectively, while preserving the required `SerializerContext` and optional `"original" | "upper"` argument. No call-site type arguments, assertions, or blanket lint suppression are needed. These are illustrative fields and context, not changes to an application's payload or naming convention.

### Contract Checks

Before adopting a dispatcher change or replacing caller-side mapping, check the actual compiler and representative consuming subclasses:

- Compile valid single/array calls with required and optional context. Require missing/wrong required context, wrong records, and wrong optional arguments to fail. Assert exact output types rather than accepting assignment to a widened type. Include actual overloads or generic subclasses when used; this example does not establish universal inference for them.
- Exercise both single and collection dispatch, context identity/forwarding, order and fields, omitted/provided optional arguments, and required-preload failures. Check synchronous exceptions and asynchronous rejection propagation, including the caller's existing error boundary.
- Establish exact sync/async output types and runtime behavior separately. The linked Express Light Rail source returns `Result[]`, including an array of promises when `Result` is a promise; it returns `[]` synchronously for empty input. Do not silently add `Promise.all`.
- Compare the consuming implementation's own empty-array and aggregation rules. The [Travel Authorization #446 proposal revision at `f0f1ca9`](https://github.com/icefoganalytics/travel-authorization/blob/f0f1ca97b4c488f7e78c57650258af53a5e54969/api/src/serializers/base-serializer.ts), originally cited as a draft proposal, aggregates nonempty async arrays but returns empty arrays synchronously. It is not merged/released precedent or a universal policy; preserve the target contract.
- When comparing argument forwarding, count the relevant argument-tail slice calls under the same input. Removing those calls establishes only that allocation-path difference, not zero allocations, a timing result, or a measured speedup.

These are focused adoption checks, not a new runtime helper or automatic migration policy. Source links establish inspectable implementations, not installed-artifact proof.

## Detail Responses and Association Visibility

Keep an established show/detail loader for a selected record. If its consumer needs an additional association or field, extend the owning response-loading contract and show serializer, then carry the typed result through the existing frontend detail composable. For example, keep `useWorkflowTemplate(workflowTemplateId)` and add the permitted category reference to the show response instead of replacing it with `useWorkflowTemplates({ where: { id: workflowTemplateId }, perPage: 1 })` solely to obtain category data. Reuse existing serializers and loading conventions; serializers still do not query. Genuine collection search, filtering, and pickers remain collection operations.

Required response associations do not authorize broader visibility. Preserve normal policy and soft-delete filtering in show queries, association includes, and any necessary post-mutation reload. In a Sequelize project whose category model uses paranoid deletion, these options contrast ordinary loading with an unjustified bypass:

```typescript
// Normal category loading, subject to the existing policy/loading contract.
const include = [{ association: "category" }]

// Do not use this merely to satisfy a non-null category response type.
const visibilityBypass = [{ association: "category", paranoid: false }]
```

Apply the same normal include graph when a mutation response genuinely requires reloading, at the owning mutation service's final return step under [Service Orchestration Readability](code-organization-reference.md#service-orchestration-readability). The controller serializes that returned result directly; do not add a reload solely for this example or query from a serializer. Association presence, visibility, and requiredness are separate contracts: inspect creation requirements, same-organization/existence validation, and deletion restrictions before claiming that a category is guaranteed. A required foreign key or non-null TypeScript annotation alone is not that proof. Do not hide a broken loading/domain invariant with deleted data, a type assertion, or invented response fields; resolve it at its actual owner using the project's established failure behavior.

Inactive is not deleted. Preserve the domain's existing inactive-record rules rather than treating inactivity as permission to bypass deletion filtering or as an automatic reason to hide an otherwise visible association. Explicitly requested recovery or administrative deleted-record views may deliberately include deleted data under their own authorization and response contract; this exception does not widen ordinary user-facing reads.

Review the distinction with a selected record missing category data, a legitimate collection search, and a post-mutation response requiring the same association. Check live/inactive/deleted visibility against the actual model and policy, separately from the response type. These are authoring decisions, not authorization to migrate a consuming application or add a new endpoint abstraction.

## Database-Side Existence Guards

When a caller needs only whether a persisted condition holds, express the complete predicate in one parameterized existence query rather than loading candidate rows solely to finish filtering with application-side `some` or `filter`. Prefer the project's supported ORM existence query when it clearly expresses the full condition; use parameterized raw SQL when that is the clearer supported form. Keep the query in the existing model/service owner, not a new query framework.

For example, suppose an existing guard asks whether the authorized workflow has a later finished step in the current nullable group. Its organization/workflow scope is already authorized, deleted rows are excluded, and two null group IDs count as the same group. This candidate query leaves part of that persisted predicate in JavaScript:

```sql
SELECT group_id
FROM workflow_steps
WHERE organization_id = :authorizedOrganizationId
  AND workflow_id = :workflowId
  AND position > :currentPosition
  AND finished_at IS NOT NULL
  AND deleted_at IS NULL;
```

```javascript
const hasLaterFinishedStep = candidateSteps.some((step) => step.group_id === currentGroupId)
```

Instead, return the answer directly without transferring candidate records:

```sql
SELECT CASE WHEN EXISTS (
  SELECT 1
  FROM workflow_steps
  WHERE organization_id = :authorizedOrganizationId
    AND workflow_id = :workflowId
    AND position > :currentPosition
    AND finished_at IS NOT NULL
    AND deleted_at IS NULL
    AND (
      group_id = :currentGroupId
      OR (group_id IS NULL AND :currentGroupId IS NULL)
    )
) THEN 1 ELSE 0 END AS hasLaterFinishedStep;
```

Use the actual policy-scoped query and supported driver bindings; the minimal organization/workflow predicates are illustrative, not replacements for authorization. Do not interpolate inputs into SQL. Preserve soft-delete/default scopes, null semantics, transaction visibility, isolation, and required locking. A query-form change does not itself prevent concurrent-write races. Decode the driver's numeric/boolean result into the existing boolean contract rather than treating a result row or a string `"0"` as truthy.

Keep record loading when the caller actually needs the records, or when the predicate genuinely depends on application-owned data that cannot be expressed in the database. Do not turn this preference into mandatory raw SQL, unrelated query rewrites, schema changes, or new infrastructure. Verify matching and absent rows, outside-scope and deleted rows, nullable groups, and the existing transaction contract using the consuming project's ORM and production dialect.

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
