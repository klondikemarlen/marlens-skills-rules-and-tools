# Complexity Standards

## Task

“Add a required date-only field to a browser form.”

## Without This Package

```tsx
<DatePicker
  id="starts-on"
  required
  value={form.startsOn}
  onChange={(date) => form.setValue("startsOn", toIsoDate(date))}
/>
```

The wrapper adds component state, date conversion, and a dependency boundary for a standard form control.

## With This Package's Complexity Standards

```html
<label for="starts-on">Starts on</label>
<input
  id="starts-on"
  name="startsOn"
  type="date"
  required
/>
```

## Why

The browser owns date entry and submits an ISO `YYYY-MM-DD` value. The labelled native control makes the input, validation, and ownership visible at the form boundary. Introduce a custom component only when the product requires behavior a native date input cannot provide, such as a date range or unavailable-date calendar.

## Check

Exercise the form with a valid date and verify the submitted value is `YYYY-MM-DD`. Verify the form rejects an empty required value before submission.

Source: [`Complexity Standards`](../AGENTS.md#complexity-standards).

## Accepted Vue Form Conventions Across Siblings

Review related create/edit forms after the maintainer accepts a correction. The [Vue authoring reference](../docs/references/vue-component-authoring-reference.md#accepted-form-guards) owns the convention; these excerpts are contrasting consumer scenarios, not claims about an installed application's activation behavior.

### Before: Only the Edit Form Was Corrected

The creation handler still contains:

```typescript
if (isCreating.value || form.value === null) return
```

Its submit button uses loading, but its sibling Cancel link still uses busy disabled styling:

```vue
<v-btn type="submit" :loading="isCreating">Create</v-btn>
<v-btn
  type="button"
  :disabled="isCreating"
  :to="{
    name: 'workflow-details',
    params: {
      workflowId: props.workflowId,
    },
  }"
>Cancel</v-btn>
```

### After: Apply the Accepted Convention to Both Forms

In each loading-controlled create/edit handler, use the project's existing `isNil` predicate for the ref guard, leaving validation, persistence, error feedback, and `finally` completion in their existing owners:

```typescript
if (isNil(form.value)) return
```

Keep Create's loading binding and change Cancel's busy binding to `:loading="isCreating"` without renaming the destination or route input. In the edit form, bind Save, Cancel, and other in-flight action buttons to its actual `isSaving` state. Do not retain a redundant busy early return just because an earlier version of the guidance left removal unresolved.

### Distinguish Parsed Route Inputs

Before, a numeric local shadows the string prop's name and its numeric consumer is ambiguous:

```typescript
const workflowId = computed(() => parseInt(props.workflowId))
const workflowQuery = useWorkflow(workflowId)
```

After, change the local binding and its numeric consumer together:

```typescript
const workflowIdAsNumber = computed(() => parseInt(props.workflowId))
const workflowQuery = useWorkflow(workflowIdAsNumber)
```

This excerpt assumes the existing `useWorkflow` accepts the numeric ref. The Cancel route above still uses the original string `props.workflowId` and unchanged `workflowId` route key. Apply the same correction to relevant sibling edit/detail pages; do not rename the external contract or replace `parseInt` with `Number`.

### Check the Difference

Apply [Accepted Form Guards](../docs/references/vue-component-authoring-reference.md#accepted-form-guards), [Loading and Disabled State](../docs/references/vue-component-authoring-reference.md#loading-and-disabled-state), and [Direct Prop Refs](../docs/references/vue-component-authoring-reference.md#direct-prop-refs) to these cases. Evaluate complete relevant siblings, not just the reported line. These are semantic authoring/review scenarios; source-string assertions and green typechecks alone do not prove the decisions.

| Case | Expected Decision |
| --- | --- |
| Edit guard is corrected; create retains `isCreating.value` or a null-only form guard | `FAIL` convention coverage; use `isNil` and remove the redundant busy check in both relevant loading-controlled handlers. |
| Submit uses loading but Cancel or another in-flight form action uses busy disabled styling | `FAIL`; use loading for all those actions, including router links, without adding busy disabled alongside it. |
| Both handlers use `isNil`, all in-flight actions use loading, and existing validation/save/error owners are preserved | `PASS` these scoped conventions; this does not prove keyboard or router-link activation safety. |
| Read-only value fields or a custom picker's supported disabled contract are unchanged | Keep the field contract; the action-button convention is not a blanket input rewrite or dependency-upgrade request. |
| A non-form download rejects concurrent requests, or an operation has an explicitly accepted queued/reject-while-pending contract | Retain its distinct concurrency guard; do not generalize the redundant create/edit form-check removal. |
| Authorization or a missing prerequisite makes an idle action unavailable | Preserve enforcement and accepted unavailable presentation; do not replace it with a false loading spinner. |
| Cancel must independently prevent navigation during saving | Keep supported enforcement and route-leave/save lifetime guarantees; conditional omission with an explanation remains valid where needed. Do not assume loading alone proves the restriction. |
| A claim says loading blocks every Enter submission, handler call, or router-link path | Reject the unsupported claim; run version-scoped interaction QA if that behavior is disputed. The accepted style correction does not await or imply that universal guarantee. |
| Numeric route-prop binding gains `AsNumber`, but a sibling numeric consumer retains the old binding | `FAIL` incomplete migration; align the local binding and numeric consumers across relevant edit/detail siblings. |
| Prop changes from `"5"` to `"9"` with the corrected computed binding | Expect the numeric ref and consumer to update from `5` to `9`; verify the prop read remains inside the getter. |
| Existing parser, explicit radix, or invalid-input behavior changes during a naming cleanup | `FAIL` scope preservation; keep the original conversion semantics, including its invalid result, with no new fallback. |
| An ordinary numeric value, unchanged numeric prop ref, or unrelated page has no `AsNumber` suffix | Leave it alone; this convention distinguishes numeric derivations of string route props, not every number. |
| Governing local contract or installed component behavior needed for a disputed interaction is unavailable | `BLOCKED` only for that missing evidence; name it and continue the independent convention review. |
