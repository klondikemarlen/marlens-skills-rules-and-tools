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
- **Calls left in computed keys or spread operands:** `FAIL` outside the [simple serializer projection exception](../docs/references/code-organization-reference.md#simple-serializer-projections); these execute during construction too.
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

## Evidence Boundary

For each case obtain a cited, current-scope `PASS`, `FAIL`, or `BLOCKED` through the supported semantic review path. Preserve concrete findings even when another criterion lacks context. Formatter/typecheck success and the disposable behavioral exercises protect different contracts; none substitutes for semantic review. Supplied policy and installation do not establish automatic selection, native advisor delivery, or a hard completion gate. Fresh-process discovery and corrective re-review remain release QA responsibilities owned by Verifier.
