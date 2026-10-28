# Vue Component Authoring Reference

Use for Vue authoring and review. Project-local conventions and supported component contracts take precedence.

For coupled interaction corrections, fit-check the whole contract before the next gesture patch using [Interaction-Contract Activation](../workflows/outcome-first-planning-workflow.md#interaction-contract-activation) in the outcome-first planning workflow. Preserve adjacent accepted behavior; component structure and presentation guidance do not define which operations are allowed.

## Component-Owned Public Types

When a small public prop or emitted-event type belongs to a component's own contract, prefer exporting it from a normal `<script lang="ts">` block alongside `<script setup lang="ts">`, rather than extracting a standalone file solely to expose that type. For example, an `ItemPicker.vue` event-typing excerpt:

```vue
<script lang="ts">
export type SelectionChange = {
  selectedIds: number[]
}
</script>

<script setup lang="ts">
const emit = defineEmits<{
  change: [payload: SelectionChange]
}>()
</script>
```

External type consumers use the owning component without introducing a runtime dependency for the type:

```typescript
import type { SelectionChange } from "@/components/ItemPicker.vue"
```

Use the project's actual component path, resolver, and existing type shape. Verify the installed Vue type compilation and affected consumers; keep type-only imports type-only rather than exporting types from `script setup` or adding runtime imports. Apply an accepted move to affected in-scope exports and consumers together, removing a superseded type-only module when nothing else needs it. Retain independently owned domain/shared types and legitimate component-family support modules with their actual owners; do not relocate unrelated types or infer ownership solely from caller count.

## Multiline Prop Object Types

Prefer multiline object types passed to `defineProps`, even for a single property. Put the opening brace, each property, and the closing brace on separate lines:

```typescript
const props = defineProps<{
  administrationCostCategoryId: string
}>()
```

Apply an accepted correction to equivalent declarations within the requested authoring or review scope, preserving prop names, types, optionality, defaults, and behavior. Formatter success does not establish this structural preference; inspect the declaration itself rather than treating a compact form accepted by a formatter as sufficient. Do not sweep unrelated files.

## One Template Root and Existing Components

Keep exactly one top-level rendered root in reusable components, even where Vue permits fragments. Only a page registered with Vue Router and named with a `Page` suffix may render multiple roots; neither the suffix nor directory placement alone establishes page ownership. A routed component without that suffix is not eligible for this exception. Pages may retain a single root; do not promote a reusable component into a route solely to permit a fragment.

For reusable components, static footer controls and informational content belong inside the existing root rather than as simultaneous sibling roots. For drag containers, use the supported row selector or slot contract so only intended rows are draggable; static content must remain non-draggable. Preserve existing route/component responsibilities, layout, and interaction behavior.

Prefer complete `v-if`/`v-else` wrapper branches over repeating one condition across coordinated styling and semantic attributes when they express distinct alternatives. These mutually exclusive branches still produce one rendered root. Keep shared slot content and spacing consistent, and put branch-specific attributes such as `role` or `aria-label` on the branch that needs them. This is not a ban on ternaries or conditional class bindings when they express the contract more clearly.

For example, both branches preserve the slot and gap while only one applies status semantics:

```vue
<template>
  <div
    v-if="isLabeled"
    class="d-flex align-center ga-2"
    role="status"
    aria-label="Status message"
  >
    <slot />
  </div>
  <div
    v-else
    class="d-flex ga-2"
  >
    <slot />
  </div>
</template>
```

Switching `v-if` branches can unmount and remount slot descendants. Preserve required descendant state and lifecycle behavior; a stable root with conditional attributes/classes may be more appropriate when separate branch roots are unnecessary. Inspect the actual wrapper/accessibility contract rather than assuming the structures are behaviorally equivalent. Reuse the project's existing utilities and scoped-style conventions; the example's classes are illustrative.

Before writing custom informational UI, inspect shared components and nearby usage. Reuse the stock component when it serves the need; keep specific component names project-local.

Prefer component names in `<Model|Parent><Type><TopLevelComponent>` order: model or owning parent first, variant or purpose next when needed, and the actual semantic root element/component type last. A `div` root uses `Div`, a `v-card` root uses `Card`, and a `v-row` root uses `Row`: rename `WorkflowStepRowDiv` to `WorkflowStepRow` when its root is `v-row`. An ordinary workflow-steps edit card follows `WorkflowStepsEditCard`, not a verb-first name. Inspect nearby app conventions for other root types rather than inventing a universal suffix mapping; preserve route-level naming contracts and stronger project-local conventions.

Apply an accepted naming correction to analogous components within the affected change, not just the highlighted filename. Update component names, filenames, imports, template consumers, and affected component refs/callers together, preserving behavior and unrelated existing code.

Prefer camelCase component names for component template refs. For an existing `LiveStepsDiv`, use `liveStepsDiv`; for an existing `EditWorkflowStepsCard`, use `editWorkflowStepsCard`. If the component itself is renamed under the naming convention above, derive its ref from the final component name. For example, with an existing `WorkflowStepsEditCard` exposing `refresh`, pair `<WorkflowStepsEditCard ref="workflowStepsEditCard" />` with the script binding `workflowStepsEditCard` and its existing caller `workflowStepsEditCard.value?.refresh()`. Keep the project's supported Vue ref API; align the template ref string, script binding, and callers without changing the exposed operation or its availability checks. Retain descriptive native-element refs and meaningful distinctions between repeated component instances; do not sweep unrelated refs.

Before adding an inline resource picker, inspect neighboring domain inputs and reuse an existing resource-input component when it owns fetching, loading/error state, and autocomplete rendering. Compose the owning-domain input from the dashboard or form; keep model bindings and contextual hints in its parent. Preserve selection behavior, visibility-triggered loading, errors, and authorization. Follow local component contracts and do not add a wrapper for a trivial control.

When one field's value updates another field within a particular form or card, keep that dependency in a watcher owned by that form or card. Keep a shared picker focused on selection rather than adding form-specific behavior or events to it. Follow local reactive patterns; do not rewrite unrelated shared components.

## Related-Record Descriptions

In ordinary user-facing descriptions, prefer a related record's readable name over its internal identifier. When a descriptive label is unavailable after the existing loading/error handling, use `Unknown` rather than stringifying the identifier. Preserve available labels and the existing data flow; intentional technical identifier displays remain valid. For example, with an existing description primitive's `label` and `value` props:

```vue
<DescriptionElement
  label="Fiscal year"
  :value="fundingPeriod?.fiscalYear ?? 'Unknown'"
/>
```

When only a stable related-record ID is available and the description needs a lookup, reuse a model-specific description wrapper, or compose the existing description primitive in one. The wrapper accepts that ID, uses the existing model-access composable, and owns the lookup and loading presentation. Keep the contextual label in the consuming page rather than duplicating the lookup there. For example, a page using its project's category-description wrapper:

```vue
<CategoryDescriptionElement
  :category-id="record.categoryId"
  label="Category"
/>
```

Component, prop, and model names are illustrative; follow the project's actual contracts. The wrapper presents the resolved category name, with the missing-label fallback above, while preserving existing errors, authorization, and reactive ID/lifecycle ownership. Already-resolved values do not require a new wrapper. Apply accepted corrections to equivalent descriptions within the requested scope, not unrelated identifier displays; do not add caches, new data-access mechanisms, persistence changes, or elaborate recovery states for this presentation preference.

## Inferred Static Template Refs

For statically named SFC template refs, prefer `useTemplateRef("name")` without an explicit generic when the installed Vue version and language tooling infer the actual contract. Avoid repeating an inferred component instance type with `ref<InstanceType<typeof Component> | null>(null)`. For the existing `WorkflowStepsEditCard` and its static `ref="workflowStepsEditCard"`:

```typescript
const workflowStepsEditCard = useTemplateRef("workflowStepsEditCard")

workflowStepsEditCard.value?.refresh()
```

Check the installed tooling and typecheck existing exposed-method calls, such as `validate()` or `refresh()`, with their availability guards unchanged. Retain explicit typing when inference cannot represent the actual contract, including genuinely dynamic or otherwise uninferable refs; do not add casts merely to silence errors. Keep template names, script bindings, and callers aligned, and apply accepted corrections to analogous refs within the affected change rather than sweeping unrelated code. This preference does not require a dependency upgrade.

## Component Refs at Consumer Boundaries

Inspect the installed consumer's runtime and type contract before projecting a component ref into a second DOM-root ref. When it already accepts the original component or element ref, pass that ref directly rather than adding a page-local `computed(() => liveStepsDiv.value?.$el ?? null)` solely as an adapter. Component instances and DOM elements are not interchangeable; runtime support alone does not establish type compatibility.

For example, with an existing `liveStepsDiv` component ref and resize callback, pass the original ref when the installed VueUse `useResizeObserver` runtime and types support it:

```typescript
useResizeObserver(liveStepsDiv, onResize)
```

When a different consumer actually requires an element, keep the necessary conversion at that consuming boundary. For an existing DOM-only scrolling handler using its supported `unrefElement` helper:

```typescript
function scrollToCurrentRoot() {
  const element = unrefElement(liveStepsDiv)
  if (!(element instanceof HTMLElement)) return

  element.scrollIntoView()
}
```

Resolve the current root when that operation needs it instead of retaining a stale element in page state. Preserve mounting, unmounting, scrolling, and exposed component methods through the original ref. Retain a genuinely necessary reactive element conversion when the actual consumer requires one, with its existing lifecycle tracking; do not move or duplicate it into every page. Follow project imports and installed types, without adding a dependency for this example. This is not a ban on computed values, optional chaining, or null handling.

## Route Inputs and Internal Resources

When an existing routed page receives a slug, resolve its resource inside the page through the established model-access composable before passing record-derived inputs to children. An internal feature's database ID requirement does not justify adding a required route prop or threading that ID through parents and tabs without an accepted route-contract change.

For example, an existing `/workflows/:workflowSlug` route supplies `workflowSlug="approval-flow"` to its page. The page uses its existing resource composable to resolve that slug; when the record `{ id: 42, slug: "approval-flow" }` is available, its live-update child receives `workflow.id`. The route and tab entry still require only `workflowSlug`, not a new `workflowId`. Follow the actual project's composable API and record types rather than introducing another loader or parallel record owner.

During review, verify direct navigation and tab entry using only the existing route inputs. Reuse [Layered Page Orchestration](../workflows/layered-page-orchestration-workflow.md) for page-owned loading, errors, invalid/missing resources, and direct-entry guards; do not render a child requiring an ID before its current record is available. Preserve authorization and existing request/lifecycle ownership. Intentional route-contract changes and established ID-based routes remain valid when accepted; this preference applies to extending a feature without such a change.

## Optional Live-Update Composition

Compose optional live-update behavior between the routed page and the existing base component: the page renders the feature wrapper, and the wrapper renders the base component. Reserve the `Page` suffix for route-level components; feature components sit below pages rather than wrapping an existing page.

Keep normal model-backed editors in their established component families. Reuse existing models, resource composables, and API clients rather than relocating or reimplementing them to introduce the capability. The wrapper owns live subscriptions and refresh coordination through the project's existing lifecycle mechanisms; the base component keeps its ordinary editing responsibilities and remains usable without live behavior.

During authoring and review, ask whether introducing the capability unnecessarily moved existing base components or broadened the PR. Preserve existing route contracts, permissions, record/state ownership, and required descendant lifecycle behavior; changing composition is not permission to reset an active editor. This boundary does not mandate feature directories or wrappers for ordinary UI work, override stronger local ownership conventions, or collapse legitimate separate interaction capabilities.

## State-Specific Content Owners

When application states own different instructions or controls, prefer separate, explicitly named components over a boolean mode prop that combines their content. Accept modest duplicated presentation when it keeps each state's wording and actions directly readable. Reuse genuinely shared, context-neutral presentation primitives, but do not move the state switch into another wrapper.

For a parent whose status is already known to be either draft or published:

```vue
<template>
  <DraftGuidanceCard v-if="status === 'draft'" />
  <PublishedGuidanceCard v-else />
</template>
```

Each card owns its state's instructions and controls without an `isDraft` mode prop; the parent selects the state explicitly. Preserve the existing instructions, controls, layout, and required descendant state/lifecycle when changing that selection. Ordinary dynamic visibility, a button's loading state, and genuinely neutral shared components do not justify separate state-specific owners. This is not a boolean-prop ban or permission to split unrelated components.

## Task-Focused Help and Supplemental Table Information

Before adding or polishing explanatory UI, identify the end-user task or decision it supports. Keep QA-only ranking mechanics, count explanations, and verification notes in testing instructions or reviewer evidence, not the product. When feedback questions a panel's value or existence, reconsider removing it before improving its layout. Preserve administrative counts and help that serve an evidenced user need.

Write help in plain language using recognizable actions and outcomes, not unexplained implementation geometry. If the supported interaction is dragging a step outside its group, explain that action rather than saying "The left gutter ungroups a step in place." Verify the actual behavior and visible labels before choosing wording; this example does not prescribe a gesture or ordering policy.

Review nearby page-level help before adding another blurb. Consolidate overlapping explanations for the same reader need into one coherent guide using the existing informational component, preserving necessary assignment, saving, and other task instructions. Keep distinct contextual help separate when it serves different tasks; this is not a one-card quota.

Place useful supplemental table explanations below the complete table, including pagination, following stronger project-local conventions. Match nearby pages' vertical gaps, edge alignment, and surrounding padding, not only their component choice. Warnings, required controls, and task-critical instructions may need a different position.

Verify settled desktop and narrow-screen layouts: pagination remains usable, help wraps without overflow, and spacing/alignment match the page's conventions. Component names and spacing values stay project-local. Guidance review does not establish rendered application behavior; changes to a consuming UI still require actual-surface verification.

## Explicit Derived-Field Bindings

Prefer a readonly `computed` → `:model-value` → named `@update:model-value` handler pipeline for derived form fields. Keep writes visible in the handler rather than a computed setter or watcher-mirrored copy of derived state. Separate state declarations, computed blocks, and handlers with blank lines. Preserve the form's accepted edit/save lifecycle and genuine form-owned dependent-field watchers; this preference does not mandate a draft-storage design.

For an already-available record whose established edit contract permits this field assignment:

```vue
<script setup lang="ts">
const selectedTagIds = computed(() => record.value.tagIds)

function updateSelectedTagIds(tagIds: string[]) {
  record.value.tagIds = tagIds
}
</script>

<template>
  <v-select
    :model-value="selectedTagIds"
    @update:model-value="updateSelectedTagIds"
  />
</template>
```

The example shows binding and ownership only; reuse the project's actual record availability, types, and write/save operation rather than copying an assignment into an incompatible contract.

## State-Driven Dialogs and Recovery

Application error handlers/plugins update shared recovery/error state, through its ordinary writable refs or meaningful state operations, rather than imperative dialog `show`/`hide` commands. The presentation component derives visibility from error presence and owns display lifecycle. Preserve genuine close/recovery policies and the [transport/UI error boundary](code-organization-reference.md#error-ownership-and-local-recovery); do not add a new store or trivial setter layer.

When a dialog already has a supported visibility model, do not add an outer `v-if` solely to duplicate show/hide state. Keep conditional inner content for transient availability, and retain an outer mount guard when an independent lifecycle requirement actually needs it. Verify observable closure/hidden content, not mandatory DOM removal from a dialog whose supported contract keeps hidden nodes mounted.

If a URL reflects runtime-only recovery, make state ownership and synchronization direction explicit instead of maintaining competing URL/runtime truth through paired reconciliation watchers. Preserve actual route, navigation, and dismissal contracts; do not impose a universal URL mirror or hide a legitimate close policy.

## Component-Tree State Sharing

Choose the state owner, consumers, and lifetime from the actual component tree before selecting a sharing mechanism. Prefer `provide`/`inject` for simple shared values, such as a display-density setting. For shared object collections, such as an editable array of records, prefer an appropriate existing composable or store rather than making injection the default collection API.

Keep component-tree state scoped to its owning tree when that is its lifetime; choosing a composable or store does not make the state application-global. Independent editor trees must retain their intended isolation, while consumers within one tree share the intended instance. Use application-wide ownership only when the actual contract calls for it. Preserve model-access and editor ownership described below rather than creating another canonical collection.

This is a maintainability preference, not a universal prohibition on providing collections, a requirement to use Pinia, or permission to add a dependency or migrate unrelated state. Respect stronger project-local contracts and genuine existing injection boundaries.

## Model-Mirror Composables and Editor Ownership

Inspect established sibling composables and any user-designated architecture before extending a `use` module. When singular/plural data-access composables mirror the model layer, retain those mirrors while the underlying model exists, even with zero current callers. An editor-specific wrapper does not replace the model mirror. Remove obsolete mirrors when their model is deleted; do not use this exception to preserve arbitrary dead code or invent speculative wrappers.

Keep component-specific editing workflows—drafts, queued writes, reconciliation, editor errors, and retry feedback—with the owning editor component, rather than accumulating them in a model-access composable. Preserve genuine shared reactive/lifecycle composables and explicit project ownership contracts; a function starting with `use` is not evidence that it owns every editing operation.

Consumers use the composable's returned reactive record/collection refs as the model source. Do not copy them into a parallel record map and watch fetches to merge fields or revision counters. Keep genuine pending commands and failure feedback with the editor. If accepted edits must survive navigation, inspect editor lifetime and supported framework retention before adding parallel model ownership; preserve the accepted save/navigation guarantee. An explicitly contracted detached draft remains valid; neither `KeepAlive` nor a particular draft-storage design is mandatory.

## Writable State and Reset Operations

Follow the established reactive-state plus `...toRefs(state)` return pattern for ordinary writable composable state. Prefer caller-side `error.value = capturedError` over `readonly(error)` plus a trivial `setError` wrapper when no accepted invariant requires the action. Keep meaningful operations, including reset and actions that actually protect invariants; this is not a blanket removal of store actions or permission to rewrite unrelated composables.

When writable state fields need declared types, prefer a complete object type on `reactive<{ ... }>(...)` over assertions on individual initializers such as `items: [] as Item[]`. For example, with the existing `Item` type:

```typescript
const state = reactive<{
  items: Item[]
  loading: boolean
  error: Error | null
}>({
  items: [],
  loading: false,
  error: null,
})

return { ...toRefs(state) }
```

Preserve initial values, writable returned refs, and runtime state ownership. Leave accurately inferred values alone and retain genuinely necessary assertions; this is a scoped typing preference, not a mandate to annotate every value or a blanket assertion ban.

When an operation restores initial/empty state and siblings call that operation `reset`, use `reset` rather than a specialized synonym such as `clearError`. Inspect sibling contracts first and retain names for genuinely different operations. Apply accepted API changes to affected callers and tests together, preserving behavior and required invariant boundaries.

## Composable Return-Object Sections

Group related returned values so a composable's public API is easy to scan. Inspect nearby composables for meaningful section labels; when following the established `// helpers` pattern, put derived helper values in a separate section after the returned resource functions. This organizes the return object, not declaration order or domain ownership.

With existing state refs, resource functions, and a derived `itemCount`, the returned bindings can be grouped as follows:

```typescript
return {
  items,
  loading,

  fetchItems,
  refresh,

  // helpers
  itemCount,
}
```

Keep the same property names, values, refs, and function identities. Preserve spreads, property precedence, getters, evaluation order, and any order-sensitive consumer behavior; do not mechanically reorder behavior-sensitive entries to obtain the layout. Keep declarations beside their dependencies and direct derived state. Do not add empty or unnecessary sections, move domain logic into a composable, or sweep unrelated modules.

## Record-Scoped Async Ownership

For record/list data-access composables, name the owner of fetched records, policy, loading/error state, pending edits, and save completion. Bind request publication to the record/query context that started it: an obsolete read must not publish data, policy, errors, or `finally` loader completion into a newer context. Check both identity and overlapping request ownership, including success, failure, and completion paths. Reuse the project's supported cancellation and stale-result mechanisms; do not prescribe a new queue, global cache, retry policy, or state library.

Prefer native `AbortController`/`AbortSignal` cancellation for superseded or abandoned reads over standalone request-object tokens or counters. Pass the signal through the existing API client to its transport, and abort the active read when selection clears or the consuming scope disposes. Retain current-controller and record/query ownership checks around data, policy, error, and `finally` publication: cancellation may arrive after completion or be unsupported by intermediate work. Treat an aborted read as cancellation without hiding ordinary failures from the current request. Use existing lifecycle hooks and transport contracts, not a new cancellation abstraction or dependency.

Canceling an obsolete read does not roll back a committed mutation. A save for A finishing while B is displayed must settle A's accepted operation without overwriting B's model or recovery state. If edits/failures/retry must survive navigation, give them explicit record-scoped ownership under the existing editor lifetime/draft contract rather than silently dropping them or creating a parallel canonical model.

Verify controlled completion order: start A, select/query B, finish A last; deliver A's failure and `finally` while B is pending; finish save A after selecting B. Observe the displayed record, policy, loading/error state, and persisted outcome. Add failed-draft retry only when it is part of the accepted contract. A cited risk or a shared-guidance change is not proof of a reproduced or fixed downstream application defect.

## Utility-Style Scoped Presentation

Compose presentation from small utility-style classes inline in the template, including conditional class bindings, rather than semantic component/state classes bundling multiple styling decisions. Reuse suitable framework utilities when they preserve appearance; define missing custom utilities in the component's local `<style scoped>` block. This is Tailwind-like composition, not a request to install Tailwind or introduce global CSS.

Prefer avoiding authored `!important` overrides that fight framework utilities or child layout rules. Resolve conflicting declarations at the owning component; reuse suitable framework utilities and define missing small utility-style classes in the local `<style scoped>` block rather than escalating specificity. Preserve responsive behavior, theme values, and interactions. This is a preference within the affected scope, not a ban on framework-generated important declarations or a reason to remove an explicitly required local exception, install Tailwind, or rewrite unrelated CSS.

Preserve framework/theme values, appearance, interactions, accessibility state, and behavioral, drag, or test-selector hooks. The preference concerns presentation, not every class name. Apply it within the affected scope rather than renaming unrelated classes. The intent is easier Vuetify upgrades without adding another styling framework.

## Loading and Disabled State

For Vue/Vuetify button actions that support a loading binding, prefer loading-only presentation for both in-flight work and unavailable actions, including an empty selection. Combine those conditions in `:loading` rather than retaining `:disabled` solely because empty selection is independent of pending work. Keep submission guards for unavailable actions and duplicate requests: presentation is not protection against form submission, keyboard activation, or direct handler calls. Follow the component's supported contract; do not invent a loading prop on a control that lacks one or rewrite unrelated controls.

This example accepts the existing download operation as a prop. Reuse the project's established error boundary; the `finally` restores pending state on success or failure.

```vue
<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{
  selectedIds: number[]
  download: (ids: number[]) => Promise<void>
}>()

const pending = ref(false)

async function downloadSelected() {
  if (pending.value || props.selectedIds.length === 0) return

  const selectedIds = [...props.selectedIds]
  pending.value = true

  try {
    await props.download(selectedIds)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form @submit.prevent="downloadSelected">
    <v-btn
      type="submit"
      :loading="pending || selectedIds.length === 0"
      >Download</v-btn
    >
  </form>
</template>
```
