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

| Task and Evidence | Expected Decision |
| --- | --- |
| Same focused fix, original computed/destructuring order preserved | `PASS` scope; assess the actual fallback behavior separately. |
| Explicit request to normalize this family's setup/destructuring order, complete family/baseline and binding convention supplied | `PASS` the justified normalization when effects and binding semantics remain unchanged; do not apply a minimal-diff quota. |
| A new dependency requires the move, with initialization evidence showing the necessary order | `PASS` the justified move, preserving initialization effects. |
| Missing accepted task, baseline revision/code, changed comparison, or required project guidance | `BLOCKED`; identify the unavailable input rather than guessing whether the move is incidental. |
| Import-only correction; proposed patch also expands an untouched response object | `FAIL` unrelated formatting scope, even if the expanded object follows the layout convention. Leave the response unchanged. |

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

| Variant | Expected Decision |
| --- | --- |
| Named calls remain inside the branch/loop iteration/callback/lazy getter/transaction that originally executed them | `PASS` when count/order/effects and identity are preserved. |
| Calls extracted above the visibility guard | `FAIL`: previously excluded work now runs. |
| Calls in computed keys or spread operands left inline | `FAIL`: those are construction-time calls too. |
| A later call moved ahead of an earlier effectful property getter | `FAIL`: naming alone does not preserve evaluation order; capture the earlier read at its original point. |
| Function-valued object's callback invokes an operation only when called | Keep the invocation deferred; extract inside the callback if it constructs another object/array, not during outer construction. |
| Two existing concurrent starts extracted into named promises before `Promise.all` consumes their array | `PASS` when starts, observation, rejection ownership, and results are preserved; sequential awaits instead are `FAIL`. |
| Already-available value used directly in a declarative object | `PASS`; no redundant alias or helper is required. |

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

| Variant | Expected Decision |
| --- | --- |
| Plain call before a pending-state assertion, established rejection owner retained | `PASS`; do not await away the observed state. |
| `await` before an assertion requiring completed work | `PASS` when it preserves the operation contract. |
| Unary `void` solely discards the call result | `FAIL` the readability default; use the appropriate plain/awaited/owned-result form. |
| An unused `const ignored = operation()` replaces `void operation()` | `FAIL`; the placeholder does not clarify ownership. |
| Removing `void` also removes a `.catch` or caller-owned returned promise | `FAIL` error ownership; plain calls do not handle rejection. |
| Meaningful promise binding used to start concurrent work and later await or assert its rejection | `PASS`; preserve concurrency and native async assertion APIs. |
| `function refresh(): void` or a callback typed `() => void` | `PASS`; TypeScript return types are not the unary operator. |
| Required operation/error boundary or pending-test setup unavailable | `BLOCKED` for that assessment, not a guessed promise-handling verdict. |

## Evidence Boundary

For each case obtain a cited, current-scope `PASS`, `FAIL`, or `BLOCKED` through the supported semantic review path. Preserve concrete findings even when another criterion lacks context. Formatter/typecheck success and the disposable behavioral exercises protect different contracts; none substitutes for semantic review. Supplied policy and installation do not establish automatic selection, native advisor delivery, or a hard completion gate. Fresh-process discovery and corrective re-review remain release QA responsibilities owned by Verifier.
