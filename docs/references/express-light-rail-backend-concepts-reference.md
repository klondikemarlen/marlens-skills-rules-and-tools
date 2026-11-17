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

Validate input at its agreed owner before persistence. Respect caller-owned formatting guarantees under [Text Validation Ownership](code-organization-reference.md#text-validation-ownership), without adding replacement defensive guards after an accepted removal. Authorize before sensitive reads and all writes. Use the project transaction helper for multi-write changes. Keep response fields explicit so private columns, lazy associations, and ORM metadata do not become API surface.

For cumulative field permissions, prefer one explicit base allow-list, conditional additions, and one final return when this makes the policy clearer. For example, an empty base can receive editable question fields for an authorized administrator and response fields for an authorized owner. Preserve the actual roles, overlapping-role behavior, exact field set, and deny-by-default contract; this layout is not permission to combine mutually exclusive rules or broaden authorization.

### Delegated Policy Construction

When one policy constructs another for delegation, put construction in a private, domain-named method on the calling policy. Keep the action focused on the permission decision. For example, replace inline construction:

```typescript
show() {
  return new TravelDeskInvoicesPolicy(this.user, this.record).show()
}
```

With these methods in the same policy:

```typescript
show() {
  const travelDeskInvoicesPolicy = this.buildTravelDeskInvoicesPolicy()

  return travelDeskInvoicesPolicy.show()
}

private buildTravelDeskInvoicesPolicy() {
  return new TravelDeskInvoicesPolicy(this.user, this.record)
}
```

The builder is inherently bound to the calling policy's user and record; preserve both inputs, construction timing, and the delegated result or thrown failure. Do not add caching, a factory layer, or apply this preference to every constructor or controller policy setup.

### Database Transaction Entry Point

Start required transactions through the project's established database owner, not a scoped model's `.sequelize` property. Where `@/models` exports the database as its default, use `import db from "@/models"` and `db.transaction(...)`. This applies to required read-only snapshots as well as multi-write transactions:

```typescript
import { Transaction } from "sequelize"

import db from "@/models"

await db.transaction(
  {
    readOnly: true,
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  },
  async (transaction) => {
    await scopedFlightReconciliations.findEach(
      { ...queryOptions, transaction },
      async (flightReconciliation) => {
        await writeCsvRow(flightReconciliation)
      }
    )
  }
)
```

This excerpt assumes an existing policy-scoped model with the supported awaited callback API, accepted query options, and a required snapshot. Preserve those scopes, options, callback awaiting, error propagation, and query transaction propagation. Use the installed ORM's supported options. Follow another database owner's actual contract for external integrations; do not route them through an unrelated local database or introduce a transaction without a consistency requirement.

### Controller-Owned Request Ordering

Where controllers already compose request queries, resolve client ordering, defaults, and required traversal tie-breakers in the existing ordering helper. Downstream services consume that order unchanged. For example, in the controller's existing `buildOrder()`:

```typescript
const clientOrder = super.buildOrder()
let primaryOrder = clientOrder
if (primaryOrder.length === 0) {
  primaryOrder = [["createdAt", "DESC"]]
}

if (primaryOrder.some(([field]) => field === "id")) {
  return primaryOrder
}

return [...primaryOrder, ["id", "ASC"]]
```

Here client sorts take precedence; `createdAt DESC` is the default only without client sorting, and `id ASC` is an already-required unique tie-breaker when not already present. Use the real helper's types and supported field/direction representation, and retain an explicit client ID sort rather than appending a conflicting duplicate. Pass the resolved `order` into the export service and its scoped query unchanged; do not append another fallback in the service. Service-owned ordering remains valid for independently owned domain operations and other architectures need not add a controller helper.

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

For new or actively reviewed unreleased Knex migrations, use three blank-line-separated groups inside each table definition:

1. Column declarations: primary key first, foreign-key columns next, then other data columns including JSON/JSONB. A business timestamp belongs with ordinary domain data.
2. Lifecycle timestamps, such as the schema's existing created, updated, and deleted timestamps.
3. Table-level foreign-key references, unique indexes/constraints, other indexes, and check constraints.

Keep column modifiers such as types, defaults, and nullability with their columns; move inline references and unique declarations into the final table-level group. Foreign-key column order is separate from the final foreign-key constraint declarations: moving a column does not move its constraint into the column group. Omit absent groups rather than inventing fields. This Knex convention does not apply to unrelated schema DSLs or authorize appearance-only edits to released migrations. Preserve schema and dependency semantics. For example, this complete unreleased PostgreSQL migration violates the grouping:

```typescript
import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("source_events", (table) => {
    table.increments("id")
    table.integer("source_id").nullable().references("id").inTable("sources").onUpdate("CASCADE").onDelete("SET NULL")
    table.string("source_identifier").notNullable().unique({ indexName: "source_events_identifier_unique" })
    table.integer("attempt_count").notNullable().defaultTo(0)
    table.check("attempt_count >= 0", [], "source_events_attempt_count_check")

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now())
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now())
    table.timestamp("deleted_at").nullable()

    table.jsonb("source_snapshot").nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("source_events")
}
```

The corrected migration keeps the same schema and rollback: `id`, then the `source_id` foreign-key column, then other data columns; lifecycle timestamps and table-level constraints remain separate:

```typescript
import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("source_events", (table) => {
    table.increments("id")
    table.integer("source_id").nullable()
    table.string("source_identifier").notNullable()
    table.integer("attempt_count").notNullable().defaultTo(0)
    table.jsonb("source_snapshot").nullable()

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now())
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now())
    table.timestamp("deleted_at").nullable()

    table.foreign("source_id").references("id").inTable("sources").onUpdate("CASCADE").onDelete("SET NULL")
    table.unique(["source_identifier"], { indexName: "source_events_identifier_unique" })
    table.check("attempt_count >= 0", [], "source_events_attempt_count_check")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("source_events")
}
```

These illustrate layout, not fields or defaults to adopt; the referenced `sources` table already exists. Inspect the installed Knex API and production dialect before translating column modifiers to table-level declarations. Preserve every type, default, nullability, FK column/target/schema/action/deferrability, indexed field/order, uniqueness, database constraint/index name (including a previously generated name), predicate, and check expression/binding. Do not turn a partial unique index into an unconditional constraint or alter enforcement merely to fit the example. Implicit primary keys such as `increments` retain their existing column API. When equivalent syntax or migration release status cannot be established, report the missing prerequisite instead of guessing or rewriting history. Follow [Self-Contained Migrations](code-organization-reference.md#self-contained-migrations) for ownership and history.

Author through the [backend workflow](../workflows/express-light-rail-backend-workflow.md), review through the [code-review workflow](../workflows/code-review-workflow.md), and exercise the [scoped migration review cases](../../examples/scoped-readability-review.md#knex-migration-constraint-groups). The existing scoped-readability contract checks this rule; installation and structural checks alone do not establish semantic compliance.

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

## Sequelize: Contextual Association Loading

Choose association loading for the selected parent population and response needs, not a blanket rule for every include. For a single parent constrained by its primary key, prefer a normal include when appropriate. Put deterministic child ordering at the query's top level; ordering the one selected parent adds nothing:

```typescript
const invoice = await scopedInvoices.findOne({
  where: { id: invoiceId },
  include: ["items"],
  order: [
    ["items", "position", "ASC"],
    ["items", "id", "ASC"],
  ],
})
```

Here `scopedInvoices` is the existing policy-scoped query, `items` is a registered has-many association, and the child's unique `id` breaks equal-position ties. Keep any parent/tenant constraints in addition to the primary key. A supported `findByPk` lookup follows the same include/order shape; do not replace a scoped query with an unscoped lookup.

For a paginated parent collection with a has-many response association, prefer `separate: true` where appropriate. Put child ordering inside that include, independently of the parent's top-level ordering and pagination:

```typescript
const invoices = await scopedInvoices.findAll({
  where,
  include: [
    {
      association: "items",
      separate: true,
      order: [
        ["position", "ASC"],
        ["id", "ASC"],
      ],
    },
  ],
  order: [
    ["createdAt", "DESC"],
    ["id", "DESC"],
  ],
  limit,
  offset,
})
```

These fields illustrate an already accepted response and sort, not fields or associations to add to every endpoint. Retain the actual parent sort and a unique tie-breaker where needed, supported client sorting, authorized filters, count semantics, and response envelope. Do not add an include when its association is not needed.

A join avoids a separate association fetch but repeats parent columns in the SQL result for each child; several to-many joins can multiply rows further. Separate loading avoids that joined-row multiplication and keeps parent pagination independent, at the cost of an additional association query and round trip. Sequelize normally batches the has-many fetch for the selected parents rather than issuing one query per parent; `separate: true` is not inherently N+1. Inspect the installed implementation and generated SQL for per-parent limits, nested associations, or other options before making an exact query-count claim.

Joined paginated loading can work with Sequelize's ORM subquery pagination behavior; it is not categorically incorrect. Keep a supported join when association predicates or ordering determine the parent population, an existing contract requires it, or measured workload tradeoffs favor it. Separate loading is a has-many-specific option, not a universal replacement for belongs-to, has-one, or many-to-many includes. Verify installed ORM/version/dialect support and actual parent-page and count behavior; do not disable subqueries or alter required/include predicates merely to match an example. See [Sequelize eager-loading and ordering documentation](https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/#ordering-eager-loaded-associations).

In either form, preserve authorization, parent constraints, child visibility and soft-delete filtering, projection, existing transaction/snapshot requirements, requiredness, and serializer/response contracts. Moving a child filter out of a join can change which parents qualify; do not make that change as a loading optimization. Retain the existing transaction propagation or explicit options for every query; a separate read must not silently escape its owning transaction.

In a consuming project, check a primary-key detail lookup with equal-position children and an empty child collection; verify deterministic child order and missing/forbidden/other-parent visibility without changing its response. For the paginated list, use several parents with unequal child counts and tied child positions across a page boundary: verify stable parent pages and total counts, complete ordered children, empty-child parents where allowed, and excluded unauthorized/deleted rows. Observe generated SQL to distinguish batched association loading from per-parent fetching, and retain required rollback/read-consistency behavior when the query belongs to a transaction.

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

If a concrete or authorized scoped model should expose an existing base-model API, repair that API's ownership before borrowing it in consumers. Inspect both runtime inheritance (does the concrete class extend the local supported base?) and static types (did a policy scope or service parameter erase the inherited statics?). Preserve the concrete static contract through those boundaries; do not invent a new base or copy a method into each caller. Inspect user-designated sibling implementations when requested, then reuse the target project's supported base.

For a project whose `findEach` has the awaited callback contract below, replace `await (BaseModel.findEach<FlightReconciliation>).call(scopedFlightReconciliations, options, processRecord)` with a direct call after repairing inheritance or erased types:

```typescript
await scopedFlightReconciliations.findEach(
  { ...queryOptions, transaction },
  async (flightReconciliation) => {
    await processRecord(flightReconciliation)
  }
)
```

Keep the authorized scope, complete options, transaction, sequential callback awaiting, and propagated query/processing failures. Do not substitute an unscoped concrete model just to satisfy typing. Deliberate rebinding remains valid when it is the actual supported function contract; this is not a universal `.call` ban.

### Bounded Synchronization Reads

A familiar collection API alone does not make a large synchronization safe. For potentially large source populations, use supported batched iteration and serialize/process records incrementally rather than loading all models and then building another full transformed collection. Keep genuinely bounded reads simple; this does not require pagination of every endpoint or impose a universal batch size.

Inspect the installed batching implementation and types before choosing its call shape. `findEach` may be project-defined rather than a stock ORM method. Verify options, callback versus async-iterator behavior, awaiting, traversal order, and failure propagation; do not invent a new model base or assume that a method name guarantees bounded reads.

For a project whose existing `findEach(options, processRecord)` loads bounded batches and awaits each callback sequentially, replace the preceding `findAll` call and whole-collection serialization with this loop. Reuse the complete `sourceQuery` above, and keep the existing transaction, single-record serializer, persistence operation, and response collection. Here `persistEvent` names the operation's existing persistence step; for Sequelize, use [Explicit Find, Update, or Create](#sequelize-explicit-find-update-or-create) within that owner rather than `Model.upsert`. The example does not require another helper or service:

```typescript
await SourceEvent.findEach(sourceQuery, async (sourceEvent) => {
  const attributes = SourceEventSyncSerializer.perform(sourceEvent, normalizedRecordLocator)
  const localEvent = await persistEvent(attributes, transaction)

  synchronizedEvents.push(localEvent)
})
```

Here the dedicated `SourceEventSyncSerializer` owns the complete source-to-local attribute conversion, including external identifier/timestamp names, excluded source fields, and caller-supplied normalized context. Its output goes directly to persistence without a second caller-side `omit` or rename mapping. Use the existing serializer's actual context and sync/async contract and retain every accepted persisted value and evaluation order. An ordinary source response serializer may instead standardize source output before service-owned conversion; choose by the serializer's purpose under [Serializer Model Ownership](#serializer-model-ownership).

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

## Serializer Field Allowlists

For fields returned unchanged under the same names, prefer spreading an explicit `pick` allowlist using the project's existing utility instead of repeating assignments. Keep timestamp conversions, renamed/computed fields, and relationship serialization explicit:

```typescript
const createdAt = this.serializeTimestamp(this.record.createdAt)

return {
  ...pick(this.record, ["eventType", "recordLocator", "reservationSystemDescription"]),
  createdAt,
}
```

This represents an existing response with those four fields and a required `Date` timestamp. Use the typed private helper under [Serializer Timestamp Conversion](code-organization-reference.md#serializer-timestamp-conversion) when Luxon is available, retaining the actual date contract. Retain the actual field list, nullability, timestamp conversion, and relation serializers; never spread the whole model or replace the allowlist with an exclusion list. Use this preference only where the installed utility preserves the existing response shape, including optional/missing-property behavior. Do not add a dependency solely for this syntax, rewrite unrelated serializers, or infer an identifier-naming convention from the example.

## Human-Facing Report Formatting

When a server-generated report serializer owns display presentation, destructure source attributes in `perform()`, pass them to named private `formatXyz` methods, and evaluate the formatted results into descriptive locals before constructing the report object. The methods own formatting and blank-value handling without reaching back into `this.record`; combined fields accept the explicit attributes they need. This applies [Private Helper Inputs](code-organization-reference.md#private-helper-inputs) and [Function Calls Before Construction](code-organization-reference.md#function-calls-before-construction) to meaningful report formatting, not to unchanged field projections.

For example, these methods belong inside an existing report serializer whose contract uses uppercase airline labels, blank strings for absent presentation values, two decimal places for amounts, and date-only ranges displayed as `MMM d, yyyy`:

```typescript
perform() {
  const { id, invoiceDetailVendorName, amount, departureDate, returnDate, isApproved } = this.record
  const formattedAirline = this.formatAirline(invoiceDetailVendorName)
  const formattedAmount = this.formatAmount(amount)
  const formattedDateRange = this.formatDateRange(departureDate, returnDate)

  return {
    id,
    airline: formattedAirline,
    amount: formattedAmount,
    dateRange: formattedDateRange,
    isApproved,
  }
}

private formatAirline(vendorName: string | null | undefined): string {
  if (isNil(vendorName)) return ""

  return vendorName.trim().toUpperCase()
}

private formatAmount(amount: number | null | undefined): string {
  if (isNil(amount)) return ""

  return amount.toFixed(2)
}

private formatDateRange(
  departureDate: string | null | undefined,
  returnDate: string | null | undefined
): string {
  if (isNil(departureDate) || isNil(returnDate)) return ""

  const formattedDepartureDate = DateTime.fromISO(departureDate).toFormat("MMM d, yyyy")
  const formattedReturnDate = DateTime.fromISO(returnDate).toFormat("MMM d, yyyy")

  return `${formattedDepartureDate} – ${formattedReturnDate}`
}
```

Here `isNil` and `DateTime` use the project's existing nil predicate and Luxon imports; the dates are already validated ISO calendar-date strings. The explicit amount guard preserves `0` as `"0.00"`, the unformatted `isApproved` preserves `false`, and blank airline text remains `""`. Pass unchanged attributes directly; do not add pass-through `formatId`/`formatIsApproved` wrappers or meaningless temporary aliases. [Simple Serializer Projections](code-organization-reference.md#simple-serializer-projections) remain valid for unchanged allowlists.

Adapt to the existing report contract rather than imposing these example defaults. Preserve null versus undefined/omission, meaningful empty strings and false values, accepted casing/blank behavior, date-only versus instant/timezone semantics, locale, currency and rounding precision, invalid-input handling, and required association preload errors. Keep required preload guards at the entrypoint before formatting; a blank formatter fallback must not conceal an unloaded association. Follow [Serializer Timestamp Conversion](code-organization-reference.md#serializer-timestamp-conversion) for actual timestamp inputs rather than treating them as calendar dates.

Presentation does not transfer business ownership: totals, eligibility, rates, and other domain computations stay in their existing domain/service owners; the report serializer formats their results. Ordinary machine-facing API serializers retain their transport types and contracts rather than adopting human-facing display strings. Review every report serializer added or meaningfully changed within the accepted scope, not unrelated existing serializers. Consumers should reference this shared owner rather than copy the pattern into local READMEs, and claim adoption only after the published guidance is actually available in their resolved shared source.

## Serializer Model Ownership

A serializer normally standardizes the representation of its input model. Keep local-model output recognizable as that model's data: a `TravelDeskBookingEvent` response retains `externalTravelPortIdentifier`, rather than renaming it to the remote model's `travelOrderIdentifier` merely to resemble that model. Ordinary formatting, computed response fields, and intentional presentation aliases remain valid; they do not require a new service.

A dedicated source-to-target sync serializer has a different contract: it owns the complete attribute conversion between those models, including renamed identifiers/timestamps and excluded source fields. Forward necessary caller context through its existing serializer interface instead of retaining a second mapping in the service. The service still owns queries, transactions, persistence, and orchestration; serializers do not gain database access or business workflow decisions. See [Bounded Synchronization Reads](#bounded-synchronization-reads).

For review, consider a dedicated sync serializer whose accepted target attributes are `eventType`, `externalTravelPortIdentifier`, and a caller-normalized `recordLocator`:

```typescript
perform() {
  return {
    ...pick(this.record, ["eventType"]),
    externalTravelPortIdentifier: this.record.travelOrderIdentifier,
    recordLocator: this.normalizedRecordLocator,
  }
}
```

Accept this complete conversion inside that serializer: source-only `id` and timestamps are deliberately excluded under this illustrative target contract, and the service persists its output directly. Reject leaving the identifier rename or source-field exclusion as a second service mapping after the dedicated serializer. Conversely, an ordinary local-event response retaining `externalTravelPortIdentifier` is correct; renaming it merely to mimic the remote model is not the same conversion requirement. Intentional presentation aliases remain valid. Review the actual complete accepted fields and constructor/context contract, not these illustrative field names.

Prefer dedicated associated-model serializers for their field mappings instead of embedding those mappings in private parent methods. Compose using the project's existing single/collection interface; do not introduce another base. The parent owns its response's preload requirements and any parent-specific ordering or composition, while each associated serializer owns its model's representation.

### Required Preloads and Composition

Check required preloads at the beginning of `perform()`, before normalization or projection. In a loading contract where `undefined` means unloaded, reject it without conflating it with a loaded nullable association (`null`) or loaded empty collection (`[]`). Keep helpers focused on narrowed, already-validated inputs. Do not query/reload here, repeat guarantees already established by the actual input contract, or move unrelated business validation into serialization.

For example, these illustrative types distinguish the loading states and use the existing synchronous `BaseSerializer.perform(recordOrRecords)` contract:

```typescript
type PassengerRecord = { id: number; name: string }
type FeeRecord = { id: number; amount: number }
type EventRecord = {
  externalTravelPortIdentifier: string
  passengers?: PassengerRecord[]
  serviceFeeTransaction?: FeeRecord | null
}
type EventJson = {
  externalTravelPortIdentifier: string
  passengers: PassengerRecord[]
  serviceFeeTransaction: FeeRecord | null
}

class PassengerSerializer extends BaseSerializer<PassengerRecord, PassengerRecord> {
  perform() {
    return pick(this.record, ["id", "name"])
  }
}

class ServiceFeeTransactionSerializer extends BaseSerializer<FeeRecord, FeeRecord> {
  perform() {
    return pick(this.record, ["id", "amount"])
  }
}

class EventSerializer extends BaseSerializer<EventRecord, EventJson> {
  perform() {
    const { passengers, serviceFeeTransaction } = this.record
    if (passengers === undefined) throw new Error("passengers must be preloaded")
    if (serviceFeeTransaction === undefined)
      throw new Error("serviceFeeTransaction must be preloaded")

    const serializedPassengers = PassengerSerializer.perform(passengers)
    const serializedServiceFeeTransaction =
      serviceFeeTransaction === null
        ? null
        : ServiceFeeTransactionSerializer.perform(serviceFeeTransaction)

    return {
      ...pick(this.record, ["externalTravelPortIdentifier"]),
      passengers: serializedPassengers,
      serviceFeeTransaction: serializedServiceFeeTransaction,
    }
  }
}
```

Use the actual model/output types, imports, established preload errors, and dedicated serializer names; the example's identical record/output field sets only keep the composition small. Preserve all fields, normalization, ordering, context forwarding, sync/async behavior, and accepted null/empty outputs. The collection call returns `[]` for a loaded empty passenger list; null fees remain null. Keep meaningful sorting/transformation in a parent private composition helper under [Service Orchestration Readability](code-organization-reference.md#service-orchestration-readability), not the associated model's field mapping.

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
