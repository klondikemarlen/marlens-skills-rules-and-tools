# Scoped Readability Review

Use these contrasting cases to exercise the supplied `marlens-rules:scoped-readability` semantic contract through OMP Verifier. They are evaluation inputs and expected decisions, not claims of an executed assessment. The [canonical standard](../docs/references/code-organization-reference.md#scoped-readability-review) owns scope; its construction, operation, and existing configuration-layout sections own the underlying authoring decisions. Keep task, baseline, changed code, and project guidance together in the supported review context. Do not modify the original consumer repositories to evaluate these cases.

## Focused Fix Versus Requested Normalization

Accepted task: fix a destination fallback; do not normalize setup order. The baseline and proposed patch are:

```diff
 const { destination, fallbackDestination } = useDestination()
+const isApproved = computed(() => status.value === "approved")
 const destinationLabel = computed(() => destination.value.label)
-const isApproved = computed(() => status.value === "approved")
-const { save, isSaving } = useSave()
+const { isSaving, save } = useSave()
-const effectiveDestination = destination.value ?? homeDestination
+const effectiveDestination = destination.value ?? fallbackDestination.value
```

Expected `FAIL`: cite the moved `isApproved` computed declaration and reordered `useSave` destructuring; neither serves the destination correction. Retain the fallback fix and restore the unrelated original order. This is not a mandate to undo necessary initialization dependencies or to alphabetize declarations.

- **Original order preserved:** `PASS` scope for the focused fix; assess fallback behavior separately.
- **Requested normalization:** `PASS` justified family setup/destructuring normalization when the complete family, baseline, and binding convention support unchanged effects and bindings. Do not impose a minimal-diff quota.
- **Necessary dependency move:** `PASS` when initialization evidence supports the order and effects remain unchanged.
- **Missing task, baseline, comparison, or required guidance:** `BLOCKED`; name the unavailable input rather than guessing intent.
- **Import-only correction also reformats an untouched response:** `FAIL` unrelated formatting scope even if the new layout follows the convention. Leave the response unchanged.

## Existing Multiline Object Layout

For an authored or meaningfully changed response, apply [Diff-Friendly Configuration Layouts](../docs/references/code-organization-reference.md#diff-friendly-configuration-layouts), including a nested single-property response. Under that convention this compact response fails:

```typescript
const response = {
  summaries: { communityCount },
}
```

The compliant form passes:

```typescript
const response = {
  summaries: {
    communityCount,
  },
}
```

The same existing convention applies to model decorator options; a compact multi-property decorator fails even when typechecking and the formatter accept it:

```typescript
class TravelOrderEvent {
  @Attribute({ type: UtcSqlServerDateTime, columnName: "HostEventTimeStamp", allowNull: true })
  declare eventTimestamp: Date | null
}
```

Expanded options pass:

```typescript
class TravelOrderEvent {
  @Attribute({
    type: UtcSqlServerDateTime,
    columnName: "HostEventTimeStamp",
    allowNull: true,
  })
  declare eventTimestamp: Date | null
}
```

These model excerpts assume the project's existing decorator, external date type, and model setup; they do not introduce those dependencies. Preserve option values, property type, and decorator order. Empty objects, import/destructuring bindings, the documented small self-contained type/call-argument exceptions, and stronger project conventions are not automatic failures. A layout correction applies within accepted scope, not to every compact object in the repository.

## Construction Without Moving Work

Under [Function Calls Before Construction](../docs/references/code-organization-reference.md#function-calls-before-construction), this definition fails: calls are hidden in object values and an array element.

```javascript
function buildPreview(isVisible) {
  if (!isVisible) return null

  return {
    gaps: captureGaps(),
    markers: [createMarker()],
  }
}
```

Extract the calls inside the original branch, with the same order and identities. The following disposable behavioral exercise is runnable with `node --input-type=module` on standard input; it needs no project dependencies and is not a permanent source-text assertion test:

```javascript
import assert from "node:assert/strict"

const events = []
const gapValue = {}
const markerValue = {}

function captureGaps() {
  events.push("gaps")
  return gapValue
}

function createMarker() {
  events.push("marker")
  return markerValue
}

function buildPreview(isVisible) {
  if (!isVisible) return null

  const gaps = captureGaps()
  const marker = createMarker()
  const markers = [marker]

  return {
    gaps,
    markers,
  }
}

assert.equal(buildPreview(false), null)
assert.deepEqual(events, [])
const preview = buildPreview(true)
assert.deepEqual(events, ["gaps", "marker"])
assert.equal(preview.gaps, gapValue)
assert.equal(preview.markers[0], markerValue)
```

- **Original execution scope:** `PASS` calls named inside their branch, loop iteration, callback, lazy getter, or transaction when count, order, effects, and identity remain unchanged.
- **Calls extracted above the guard:** `FAIL`; excluded work now runs.
- **Calls left in computed keys or spread operands:** `FAIL` outside the bounded [serializer projection](../docs/references/code-organization-reference.md#simple-serializer-projections) and [existing policy allowlist](../docs/references/code-organization-reference.md#existing-policy-allowlists) exceptions; these execute during construction too.
- **Later call moved before an effectful getter:** `FAIL`; capture the earlier read at its original evaluation point.
- **Function-valued callback:** retain deferred invocation; extract inside the callback when it constructs an object/array, not during outer construction.
- **Concurrent starts:** `PASS` named promises started in their original order before `Promise.all` consumes their array, with rejection ownership and results preserved. Sequential awaits instead `FAIL`.
- **Already-available value:** `PASS` direct use; no redundant alias/helper is required.

### Simple Serializer Projection Exception

Accepted task: retain the serializer's expanded field projection and separately named `departureTime` transformation, without an `attributes` alias. Apply the [canonical example](../docs/references/code-organization-reference.md#simple-serializer-projections) with the complete baseline, changed code, existing helper contract, and project guidance.

- **Inline field selection:** `PASS` an expanded `...pick(this.record, [fields])` followed by the named `departureTime` value when fields, evaluation count/order, and spread precedence are unchanged. Do not demand extraction solely because `pick` is called in the object.
- **Meaningful local retained:** `PASS` a reused projection result or a local needed to preserve effectful getter/proxy reads at their original evaluation points. The exception permits inline selection; it does not ban justified locals.
- **Transformation hidden in the response:** `FAIL` inlining a meaningful time conversion or nested serializer stage under the projection exception.
- **Effectful or asynchronous work hidden:** `FAIL` treating a query, factory, write, or asynchronous call as simple field selection.
- **Changed order or precedence:** `FAIL` moving the projection across an effectful read/transformation, duplicating it, changing selected fields, or moving it after an explicit field that it now overwrites.

These are semantic review expectations, not claims of executed Verifier results. Existing construction scenarios still apply outside the bounded projection exception.

## Plain Calls, Pending State, and Completion

[Operation Calls and Completion](../docs/references/code-organization-reference.md#operation-calls-and-completion) distinguishes result discarding from completion and error ownership. In a controlled pending-state test, `void commitEdit()` is confusing result-discarding syntax; `await commitEdit()` is also wrong if the next observation must happen while it is pending. A plain call preserves that observation. A separate completion scenario awaits the operation.

This disposable Node exercise demonstrates both states without timers or I/O. Its `commitEdit` owns rejection through the existing local error recorder; removing `void` is not the handler. Real projects must retain their actual error boundary, not adopt a new one merely to copy this illustration.

```javascript
import assert from "node:assert/strict"

function createEditor(save) {
  const editor = {
    isSaving: false,
    observedError: undefined,
    async commitEdit() {
      editor.isSaving = true
      try {
        await save()
      } catch (error) {
        editor.observedError = error
      } finally {
        editor.isSaving = false
      }
    },
  }

  return editor
}

// Pending scenario: an in-memory promise owns no live resource requiring cleanup.
const controlledSave = new Promise(() => {})
const pendingEditor = createEditor(() => controlledSave)
pendingEditor.commitEdit()
assert.equal(pendingEditor.isSaving, true)

// Separate completion scenario with an immediately successful save.
const completedEditor = createEditor(async () => {})
await completedEditor.commitEdit()
assert.equal(completedEditor.isSaving, false)
assert.equal(completedEditor.observedError, undefined)

// The established boundary, not the expression statement, owns rejection.
const saveError = new Error("Save failed")
const failedEditor = createEditor(async () => {
  throw saveError
})
await failedEditor.commitEdit()
assert.equal(failedEditor.observedError, saveError)
```

- **Plain pending call with established rejection owner:** `PASS`; do not await away the observed state.
- **Awaited completion:** `PASS` when subsequent work requires completion and the operation contract remains unchanged.
- **Unary `void` solely discards a result:** `FAIL` the readability default; use the appropriate plain/awaited/owned-result form.
- **Unused `const ignored = operation()` replaces unary `void`:** `FAIL`; the placeholder does not clarify ownership.
- **Removing `void` also removes `.catch` or the caller-owned returned promise:** `FAIL` error ownership; plain calls do not handle rejection.
- **Meaningful promise binding for concurrent work and later awaiting/rejection assertion:** `PASS`; retain native async assertion APIs.
- **TypeScript `function refresh(): void` or callback `() => void`:** `PASS`; types are not unary operators.
- **Missing operation/error-boundary/pending-setup evidence:** `BLOCKED`, not a guessed promise-handling verdict.

## Vue Action Guard Ownership

Use the [accepted UI-gated action convention](../docs/references/vue-component-authoring-reference.md#ui-gated-action-guard-ownership), not a blanket guard-removal rule. For these cases the accepted task is to apply that correction to the changed retirement action and its relevant in-scope sibling actions. Supply the complete baseline/comparison and project guidance as well as the following owner context; these excerpts alone do not establish a real application's caller inventory.

### Accepted UI Owner: Rejected and Corrected Handler

Case context: inspection finds only the existing button calls this local, unexposed handler; no form, keyboard listener, or other caller invokes it. The accepted convention assigns UI policy visibility to `policy?.destroy` and pending presentation to `isDeleting`. The existing API boundary authorizes every retirement request independently; there is no separately accepted reject-while-pending handler contract. Confirmation cancellation must perform no request; request rejection must reach the existing error owner, and `finally` must restore pending state.

```vue
<template>
  <v-btn
    v-if="policy?.destroy"
    :loading="isDeleting"
    @click="retire"
    >Retire</v-btn
  >
</template>

<script setup lang="ts">
// Excerpt: retain the project's existing imports, bindings and request API.
async function retire() {
  if (!policy.value?.destroy || isDeleting.value) return

  const confirmed = await confirmRetirement()
  if (!confirmed) return

  isDeleting.value = true
  try {
    await retireRecord()
  } catch (error) {
    reportRetirementError(error)
  } finally {
    isDeleting.value = false
  }
}
</script>
```

Expected `FAIL`: cite the early return and the template/accepted-owner context; remove only the repeated policy/busy checks. The corrected comparison is:

```diff
 async function retire() {
-  if (!policy.value?.destroy || isDeleting.value) return
-
   const confirmed = await confirmRetirement()
```

Expected `PASS` for this criterion after inspecting the complete corrected action and relevant siblings: the redundant checks are absent, while confirmation, cancellation, server authorization, error propagation and cleanup retain their existing owners. Loading is presentation here, not evidence of universal activation blocking. If an equivalent changed sibling still repeats speculative checks, the whole-scope result remains `FAIL`.

### Independent Entry and Concurrency Owner

Contrasting case context: the changed Vue component exposes an existing `retire` command consumed by a parent bulk-action path as well as its button. The documented command contract requires a live permission decision for direct calls and rejects concurrent requests; the server still authorizes requests. Its baseline and changed handler both retain the following guards before confirmation and the same request/error/finally body:

```typescript
async function retire() {
  if (!policy.value?.destroy) return
  if (isDeleting.value) return

  // Existing confirmation and request/error/finally body remains unchanged.
}
```

Expected `PASS`: cite the actual exposed API, parent caller, accepted live-permission and concurrency contracts, and retained server boundary. The matching guard tokens are not inherently redundant. Deleting them solely because a button has `v-if` and `loading` is `FAIL`; restore the independent command protections. Do not invent this exposed API or concurrency policy for the first case.

### Missing Owner Context

Supply the rejected handler excerpt but omit its template/callers or accepted authorization/concurrency contract. Expected `BLOCKED`: identify the unavailable entry-point or owner evidence needed to decide redundancy. A green typecheck or behavioral suite does not fill that gap. Keep any independently evidenced findings visible, but do not mark partial action coverage as whole-scope `PASS`.

## Knex Migration Constraint Groups

Accepted task: author or organize an actively reviewed unreleased Knex migration without changing its schema. Supply the complete violating and corrected migrations in [Migration Field Groups](../docs/references/express-light-rail-backend-concepts-reference.md#migration-field-groups), the actual baseline/comparison and project guidance, migration release status, and installed Knex/production-dialect evidence. Those complete examples are the paired inputs, not excerpt-only proof.

- **Violating input:** expected `FAIL` for inline FK `references/inTable`, inline `unique`, a check interleaved with ordinary columns, and JSON after lifecycle timestamps. Cite each location; moving only JSON does not fix the constraint group.
- **Corrected input:** expected `PASS` when ordinary columns (including nullable integer FK and JSON) precede lifecycle timestamps, followed by table-level foreign reference, named uniqueness and check, with blank lines between groups. The rollback and schema remain unchanged.
- **Only misplaced constraints:** move the corrected `table.check` before the timestamps while leaving table-level FK/unique syntax intact. Expected `FAIL`; table-level syntax alone is insufficient.
- **Changed semantics:** remove `onDelete("SET NULL")`, make the FK non-nullable, change a default/type/name/check, or drop an existing unique predicate while regrouping. Expected `FAIL`, even with perfect spacing. A supported partial unique index must keep its exact predicate, fields/order, name and enforcement; it must not become an unconditional constraint.
- **Absent groups:** a table with no lifecycle timestamps or separate constraints needs no invented group or field. Implicit primary keys such as `increments` remain legitimate column definitions.
- **Released migration or another DSL:** do not demand a grouping rewrite. Respect accepted scope and history; apply only genuinely relevant criteria.
- **Missing release/API/dialect context needed to establish equivalence:** expected `BLOCKED` with the exact prerequisite, while retaining independently evidenced layout findings. Typechecking and SQL-generation checks do not replace native named-verifier assessment.

## Single-Property Assertion Objects

Accepted task: author the not-found controller assertion under the shared multiline convention, with no stronger project override. Baseline/new assertion comparison:

```diff
-expect(response.body).toEqual({ message: "Travel desk travel request not found." })
+expect(response.body).toEqual({
+  message: "Travel desk travel request not found.",
+})
```

Expected `FAIL` for the compact input and `PASS` for the expanded input under `existing-object-layout-application`. Cite the assertion location; preserve the exact message and matcher. Partial matchers, including a single `id` property, follow the same expected-data rule. `logger.error(message, { error })` remains a valid small ordinary call argument: that exception does not cover assertion objects. Stronger project overrides remain authoritative, and an untouched assertion outside the task is excluded rather than a reason for a formatting sweep.

## Linear Actual Queries and Expected Matchers

Accepted task: preserve the persisted-segment assertion while applying the maintainer's inline, linear correction. Supply the complete query/options, baseline and expected values from [Linear Test Expectations](../docs/references/code-organization-reference.md#linear-test-expectations).

- **Rejected:** assign the query to one-use `savedTravelSegments`, assign each `expect.objectContaining` to one-use expected aliases, then assemble the assertion. Expected `FAIL` when these names add no domain/timing meaning.
- **Corrected:** the canonical expanded `expect(await TravelSegment.findAll(...)).toEqual([expect.objectContaining(...), ...])` form is `PASS`; this is an explicit construction exception, not hidden effect permission.
- **Meaningful actual snapshot or reused value:** `PASS` retaining its local. Do not weaken equality, remove properties, hide assertions in helpers, change row ordering, or compact expected objects.
- **Behavioral proof:** run the consumer's focused assertion scenario against the existing persisted fixture; it must query once with the same options and assert the same literal fields/matchers. Semantic review must separately reject the alias-only input and accept the inline correction.

## Machine Values, Collections, Mirrors and Snapshots

Use the complete paired examples in [Machine Enum Values](../docs/references/code-organization-reference.md#machine-enum-values-and-ui-labels), [Optional Collections](../docs/references/code-organization-reference.md#optional-collections-before-transformations), [Mirrored Comments](../docs/references/code-organization-reference.md#mirrored-contract-comments), and [Serialized Transport Types](../docs/references/code-organization-reference.md#serialized-transport-type-names), with applicable producer/consumer and input contracts.

- **Enum correction:** `PASS` `sale`/`refund`/`void` application values, UI-owned Sale/Refund/Void labels, and explicit provider mapping preserving upstream text/raw snapshots. `FAIL` storing presentation labels as newly authored machine values or renaming the provider's raw contract. Exercise each supported provider value through mapping, persistence/API and label rendering; retain unknown-value handling. Numeric enums and member identifiers are outside this preference.
- **Collection correction:** `FAIL` combined optional access/projection/set construction when undefined already means empty. `PASS` defaulted `positions`/`teams`, separately named projections and sets. Exercise omitted, undefined, empty and populated arrays. Include null only if the real contract permits it: a destructuring default alone does not handle null. `FAIL` silently accepting previously rejected null or changing getter evaluation order. Simple optional output access and ordinary arbitrary input names remain valid.
- **Mirrored encoders:** `FAIL` a one-ended synchronization note or exported test-only encoder. `PASS` reciprocal file/function references and a module-private helper using each boundary's existing options. Run both encoders on supported nested/filter inputs and compare exact output to the existing transport contract; this does not mandate consolidation or a serializer choice. Coincidental similar functions need no synchronization comment.
- **Exact snapshot:** `FAIL` the field-picked `InvoiceBookingSnapshot` described as exact, or a second type duplicating the response owner. `PASS` `BookingEventResponse` with all serialized fields, nested values and omission/null distinctions. Deliberately transformed `InvoiceBookingRecord` is also `PASS` when not misrepresented as exact. Use an actual response with extra/nested/nullable fields to compare captured data and the established mutation-isolation behavior; do not add snapshotting just to exercise this case.

## Ruby Bootstrap Ownership

Accepted task: apply [Entrypoint-Owned Ruby Root Bootstrap](../docs/references/code-organization-reference.md#entrypoint-owned-ruby-root-bootstrap) to affected tooling using its established root. Supply the executable, package loaders, root owner and internal imports.

- **Rejected:** every helper requires `../../root`, discovers its own root, or derives it from `Dir.pwd`. Expected `FAIL`, even if invocation from repository root succeeds.
- **Corrected:** an executable/package loader requires the canonical source-anchored root; internal imports use `File.join(ROOT_DIR, ...)`. Expected `PASS` with unchanged behavior and load order. Direct internal loading explicitly requires the owner first; no per-file fallback.
- **Runnable proof:** from a fresh unrelated temporary directory, invoke each affected executable by absolute path and require each package loader by absolute path in fresh Ruby processes. Exercise the relevant public operation, not only require success. In another fresh `ruby -w` process require the relevant loaders together and reject constant-redefinition warnings. Use the actual repository's development wrapper when required. Missing Ruby/runtime prerequisites or public-operation setup is `BLOCKED`, not a claimed smoke PASS.

## Service Effects, Fixed Errors and Endpoints

Supply the complete before/after [Effect-Oriented Method Slices](../docs/references/code-organization-reference.md#effect-oriented-method-slices) example as a multi-effect consumer task, plus its small `sessions.expire` counterexample.

- **Useful slices:** `PASS` a short effect narrative with cohesive private load/rank/publish methods, explicit meaningful results and direct `this.session` references. `FAIL` generic step wrappers, redundant field aliases, arbitrary seven-line enforcement, or new services merely to shorten the entry method.
- **Preserved lifecycle:** `FAIL` moving budget precharge into the publication transaction, releasing the lease before reads complete, changing cancellation checkpoints, error translation, query/rank order or lazy/concurrent work. Keep the already-readable one-effect method unchanged.
- **Runnable behavioral proof:** run before/after implementations with deterministic recording fakes for budget, lease, query, matcher, progress, transaction and publisher. Compare event traces and returned identity; record lease ownership during query/consumer callbacks. Exercise both cancellation checkpoints and a rejected match/publication, checking identical translation and release/rollback. Source layout and event equivalence protect different contracts; obtain fresh semantic decisions for the rejected/corrected pair too.
- **Operation diagnostics:** run the upload example in [Effect-Oriented Method Slices](../docs/references/code-organization-reference.md#effect-oriented-method-slices). Accept the fixed labels at their rejection boundaries, with one correctly attributed diagnostic and the same error object for each failure. Reject a log-only `stage` reassigned between awaited calls, or a refactor that swallows, wraps, or misattributes a failure. Keep genuine user-visible progress and operations that already provide their own identity.
- **Fixed errors:** use the full five-class [error example](../docs/references/code-organization-reference.md#explicit-fixed-family-error-types). `PASS` explicit expired, mismatch, capacity, unavailable and deadline errors retaining the old tuples and shared-base catch behavior; `FAIL` changing any message/code/status during extraction. Instantiate each old/new error and compare `code`, `message`, `status`, serialization and the real catch/HTTP translation outcome. Dynamic provider translation, useful bases and ordinary tables remain valid.
- **Endpoints:** with Lodash already installed, `PASS` `first`/`last` and existing import style; `FAIL` manual endpoint arithmetic left after an accepted in-scope correction. Compare empty, singleton and multiple-item behavior, including explicit absence guards; preserve arbitrary positional indexing and add no dependency. An unrelated standalone artifact without Lodash is not a violation.

## Guard Layout and Short Bare Returns

Accepted task: apply [JavaScript and TypeScript guard layout](../docs/references/code-organization-reference.md#guard-clauses-and-exceptional-responses) in changed code without changing behavior. With no contrary project policy, both layouts below are `PASS`; do not demand either one:

```ts
if (isEmpty(travelDeskFlightSegmentIds)) return

loadSegments(travelDeskFlightSegmentIds)
```

```ts
if (isEmpty(travelDeskFlightSegmentIds)) {
  return
}

loadSegments(travelDeskFlightSegmentIds)
```

If a project linter requires braces, the one-line unbraced form is `FAIL` under that local policy. Under the shared default, a complex condition, a return with a value (including `return undefined`), a throw, or any other body still uses the multiline braced form. For example:

```diff
-if (isNil(value)) throw new Error("value is required")
+if (isNil(value)) {
+  throw new Error("value is required")
+}
```

Expected `FAIL` for the single-line throw, `PASS` for the braced correction. For the bare-return pair, compare empty and nonempty inputs: the existing predicate runs once, and `loadSegments` only runs for the nonempty input. For the throwing pair, exercise null/undefined and accepted falsy/nonempty values under the existing predicate; compare evaluation count and the exact thrown error. Do not infer a new truthiness rule or rewrite untouched snippets.

## Existing Inline Policy Allowlists

Accepted task: add `actualPrimaryDestinationId` to an established allowlist while retaining its required bulk-replace permission contract. The baseline already contains the inherited spread and nested permission call shown in the [canonical example](../docs/references/code-organization-reference.md#existing-policy-allowlists); the only intended addition is the scalar string.

- **Inline field addition:** expected `PASS` for that complete canonical example; neither permission call needs a one-use alias.
- **Extraction solely for the default:** expected `FAIL` for the following comparison when inspection confirms no reuse, meaningful computation, snapshot, or sequencing need. Restore the inline calls while retaining the added field and required permission API.

```diff
 permittedAttributes() {
+  const inheritedAttributes = super.permittedAttributes()
+  const travelSegmentActualsAttributes =
+    this.travelSegmentActualsPolicy.permittedAttributesForBulkReplace()
   return [
-    ...super.permittedAttributes(),
+    ...inheritedAttributes,
+    "actualPrimaryDestinationId",
     {
-      travelSegmentActualsAttributes: this.travelSegmentActualsPolicy.permittedAttributesForBulkReplace(),
+      travelSegmentActualsAttributes,
     },
   ]
 }
```

- **Meaningful local:** expected `PASS` when actual reuse or effectful-read ordering requires it; the exception is not a ban on locals.
- **Revert bulk-replace permission to a different API:** expected `FAIL` permission behavior even if the shape is inline.
- **Unrelated factory/query call left inline:** expected `FAIL` under the general construction default, not permission to generalize this exception.
- **Missing actual permission or sequencing contract:** `BLOCKED` for equivalence, retaining any independently evidenced scope finding.

## Named Fallback Preparation

Accepted task: prepare this existing passenger-name fallback without changing its behavior:

```diff
+const passengerName = item.passengerName ?? null
+
 return {
-  passengerName: item.passengerName ?? null,
+  passengerName,
 }
```

Expected `FAIL` for inline fallback preparation and `PASS` for the corrected input under `construction-evaluation-ownership`. Both preserve null/undefined as null and empty string as empty string. Supply the surrounding original execution scope and property-read order, not just this excerpt.

- Replacing `??` with `||` is `FAIL`: it changes empty-string behavior.
- Hoisting the local outside its guard/callback, rereading an effectful getter, moving a later fallback before an earlier getter, or eagerly computing its fallback arm is `FAIL`.
- A direct property read with no fallback and a simple literal option are `PASS` without new aliases. Adding or removing fallback behavior is not this correction.

## Explicit Branches and the Scalar Exception

Accepted task: apply the maintainer's explicit-branch correction to the report date and reconciled label. The existing date formatter is synchronous, returns a string, and may throw; the date is optional and formatting must not run when absent. Negative input:

```typescript
function invoiceDateLabel(invoiceBookingDate: Date | null) {
  return invoiceBookingDate
    ? formatInvoiceDate(invoiceBookingDate)
    : ""
}

function reconciledLabel(isReconciled: boolean) {
  return isReconciled ? "Yes" : "No"
}
```

Expected `FAIL` for both conditional expressions: cite each function/location and the accepted correction, not a blanket syntax ban. Positive input, retaining the original function owners rather than adding wrappers:

```typescript
function invoiceDateLabel(invoiceBookingDate: Date | null) {
  if (invoiceBookingDate) {
    return formatInvoiceDate(invoiceBookingDate)
  }

  return ""
}

function reconciledLabel(isReconciled: boolean) {
  if (isReconciled) return "Yes"

  return "No"
}
```

Expected `PASS`: no date formatting for null, one formatting call for a present date, identical return values and thrown error propagation. Computing the formatted date before the guard is `FAIL` lazy evaluation; repeating an effectful predicate is `FAIL` evaluation count.

Contrasting exception context: a pure comparator's equal case is already guarded, both scalar operands are stable locals, and there is no accepted branch-only correction:

```typescript
function compareAmounts(left: number, right: number) {
  if (left === right) return 0

  return left < right ? -1 : 1
}
```

Expected `PASS` for the concise scalar exception when the reviewer finds the conventional ascending comparator mapping clearer at one glance than mutable setup or extra branching; record that concrete reason. This is not precedent for report fields with an accepted explicit-branch correction. `record?.passengerName ?? null` is not a ternary; assess fallback placement separately when constructing an object. Untouched ternaries outside the accepted scope are excluded. Missing baseline, formatter/predicate behavior, or required project guidance is `BLOCKED`, not assumed semantic equivalence.

## Transformation-Aware Domain Names

Accepted task: review a changed building-expense formatting projection and its consumers. The existing `formatCurrency` and `formatRate` helpers format the indicated scalar fields without filtering, sorting, grouping, or indexing. Negative input:

```typescript
const displayedExpenses = buildingExpenses.map((expense) => {
  const subsidyRate = formatRate(expense.subsidyRate)
  const estimatedCost = formatCurrency(expense.estimatedCost)
  const actualCost = formatCurrency(expense.actualCost)

  return {
    ...expense,
    subsidyRate,
    estimatedCost,
    actualCost,
  }
})

renderExpenses(displayedExpenses)
```

Expected `FAIL` under `transformation-aware-domain-names`: cite the binding and callback, explain the observed formatting, recommend `formattedBuildingExpenses` and `buildingExpense`, and update the spread, property reads and consumer together. The same complete code with those names consistently substituted is the positive `PASS` input; no `const displayedExpenses = formattedBuildingExpenses` alias remains. For a separately supplied administration-cost formatting projection, `displayedCosts` similarly fails and consistently applied `formattedAdministrationCosts` passes.

Contrasts, assuming their supplied expressions establish the stated effects:

- `visibleBuildingExpenses = buildingExpenses.filter(isVisibleBuildingExpense)` is `PASS`: this is visibility selection, not formatting.
- `sortedBuildingExpenses` for a non-mutating cost-ordering operation, `groupedBuildingExpenses` for grouping, and `buildingExpensesById` for indexing are `PASS` when those are the actual effects. Calling a formatting-only projection `sortedBuildingExpenses` is `FAIL`.
- An unchanged `finalDestination` pass-through, including its accepted null fallback, remains `PASS` source-domain-named; inventing `formattedFinalDestination` is `FAIL` when no formatting exists.
- Distinct display snapshots and necessary collision names remain valid. Keywords alone prove nothing; missing expression/helper or affected-consumer evidence is `BLOCKED`. Findings identify actual file/symbols, not regex matches.

## Semantic Barrel Groups and Local Labels

Accepted task: extend an existing service barrel. Supply its full baseline, comparison and closest maintained local example; in this fixture that example establishes unlabeled Create/Update/Destroy actions followed by **Stateful Services**, **Special Services**, and **Sub-resource Services**. The modules already own the exported symbols/types and have no initialization-order effects. Negative input mixes these categories without labels:

```typescript
export { ApproveService } from "./approve-service"
export * as Attachments from "./attachments"
export { BuildOverviewService, type Overview } from "./build-overview-service"
export { CreateService } from "./create-service"
export { DestroyService } from "./destroy-service"
export { UpdateService } from "./update-service"
```

Expected `FAIL` under `semantic-barrel-export-groups`: cite this file's mixed categories, the supplied local example and the following concrete correction. Positive input:

```typescript
export { CreateService } from "./create-service"
export { UpdateService } from "./update-service"
export { DestroyService } from "./destroy-service"

// Stateful Services
export { ApproveService } from "./approve-service"

// Special Services
export { BuildOverviewService, type Overview } from "./build-overview-service"

// Sub-resource Services
export * as Attachments from "./attachments"
```

Expected `PASS`, retaining names, companion `Overview` type and operation order. Established **Bundles** in a serializer layer or **Namespaced services** at the service layer also passes with its actual local precedent; do not impose a universal spelling. A homogeneous barrel containing only the three standard actions passes without headings. An actual runtime `index.ts` is not automatically a barrel. Globally alphabetizing across these groups, dropping a type alias, or changing initialization-sensitive order is `FAIL`.

Both mixed and grouped static inputs may pass the executable structural barrel check; that does not clear the negative semantic case. Keep that existing check enabled and separate. Missing the necessary local source/role evidence or unavailable tooling is `BLOCKED`, not a grouping violation, and cannot clear a partial scope.

## Serializer Projection and Required Preloads

Task: add a receipt response. The serializer's record **is** the receipt. `id` and `reference` are always present strings, `issuedAt` is a `Date`, and `lines?: ReceiptLine[]` is undefined until loaded. A loaded receipt can have zero lines. The project already uses Lodash `pick` and `isUndefined`. `ReceiptLineSerializer.perform` accepts the loaded collection. Both candidates must return the same keys, an ISO timestamp, and serialized lines.

```typescript
const { lines } = this.record
if (!lines) {
  throw new Error("Receipt lines must be preloaded")
}

const issuedAt = this.record.issuedAt.toISOString()
const serializedLines = ReceiptLineSerializer.perform(lines)
return {
  id: this.record.id,
  reference: this.record.reference,
  issuedAt,
  lines: serializedLines,
}
```

Expected `FAIL`: report **both** the repeated unchanged assignments and the truthiness guard for an undefined-only preload. The guard is imprecise; it does **not** reject `[]`. Do not attribute this finding to a lost empty collection.

```typescript
const { lines } = this.record
if (isUndefined(lines)) {
  throw new Error("Receipt lines must be preloaded")
}

const issuedAt = this.record.issuedAt.toISOString()
const serializedLines = ReceiptLineSerializer.perform(lines)
return {
  ...pick(this.record, [
    "id",
    "reference",
  ]),
  issuedAt,
  lines: serializedLines,
}
```

Expected `PASS` with an unchanged-field response type based on `Pick<Receipt, "id" | "reference">` and explicit wire types for `issuedAt` and `lines`. Do not introduce `this.record.receipt`, a query, or a `pick` of the raw date or lines. If a source key can be absent and the response requires an own property, establish equivalence before recommending `pick`.

## Evidence Boundary

For each case obtain a cited, current-scope `PASS`, `FAIL`, or `BLOCKED` through the supported semantic review path. Preserve concrete findings even when another criterion lacks context. Formatter/typecheck success and the disposable behavioral exercises protect different contracts; none substitutes for semantic review. Supplied policy and installation do not establish automatic selection, native advisor delivery, or a hard completion gate. Fresh-process discovery and corrective re-review remain release QA responsibilities owned by Verifier.
