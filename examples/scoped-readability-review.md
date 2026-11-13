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
- **Calls left in computed keys or spread operands:** `FAIL`; these execute during construction too.
- **Later call moved before an effectful getter:** `FAIL`; capture the earlier read at its original evaluation point.
- **Function-valued callback:** retain deferred invocation; extract inside the callback when it constructs an object/array, not during outer construction.
- **Concurrent starts:** `PASS` named promises started in their original order before `Promise.all` consumes their array, with rejection ownership and results preserved. Sequential awaits instead `FAIL`.
- **Already-available value:** `PASS` direct use; no redundant alias/helper is required.

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

## Evidence Boundary

For each case obtain a cited, current-scope `PASS`, `FAIL`, or `BLOCKED` through the supported semantic review path. Preserve concrete findings even when another criterion lacks context. Formatter/typecheck success and the disposable behavioral exercises protect different contracts; none substitutes for semantic review. Supplied policy and installation do not establish automatic selection, native advisor delivery, or a hard completion gate. Fresh-process discovery and corrective re-review remain release QA responsibilities owned by Verifier.
