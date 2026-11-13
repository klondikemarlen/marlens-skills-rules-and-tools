# Vue Component Authoring Reference

Use for Vue authoring and review. Project-local conventions and supported component contracts take precedence.

For coupled interaction corrections, fit-check the whole contract before the next gesture patch using [Interaction-Contract Activation](../workflows/outcome-first-planning-workflow.md#interaction-contract-activation) in the outcome-first planning workflow. Preserve adjacent accepted behavior; component structure and presentation guidance do not define which operations are allowed.

## Single-File Component Block Order

When creating or materially rewriting an in-scope Vue single-file component, order its top-level blocks as `<template>`, then `<script>` blocks (including normal scripts and `<script setup>`), then `<style>` blocks. Omit absent blocks rather than adding empty sections. A stronger project-local convention takes precedence.

Inspect the existing layout before editing. Move whole blocks without changing script semantics, imports, behavior, or the supported relationship between multiple script blocks. Preserve expanded multiline formatting inside the blocks, including object literals, route targets, and params; a block move is not a formatting sweep. During authoring and review, check every created or materially rewritten component in scope for this order. Script-only and template-only excerpts remain valid; full-component examples below use template-first order.

## Model Bindings Before Props

Within `<script setup>`, prefer `defineModel` bindings before `defineProps` declarations, including props wrapped in `withDefaults`, when dependencies permit. This setup reading order is separate from the [top-level template/script/style order](#single-file-component-block-order); check both during authoring and review of touched components. Expand model options under [Diff-Friendly Configuration Layouts](code-organization-reference.md#diff-friendly-configuration-layouts), with each option on its own line even when there is only one:

```vue
<script setup lang="ts">
const departureDate = defineModel<string>("departureDate", {
  required: true,
})
const departureTime = defineModel<string>("departureTime", {
  required: true,
})
const arrivalDate = defineModel<string>("arrivalDate", {
  required: true,
})
const arrivalTime = defineModel<string>("arrivalTime", {
  required: true,
})

const props = defineProps<{
  workflowId: number
}>()
</script>
```

Preserve the actual model names, types, options, defaults, modifiers, transformers, props contracts, and runtime behavior. Move declarations only when initialization and evaluation dependencies remain valid; do not move an eagerly evaluated setup dependency below its consumer to force the preference. Macro hoisting does not make setup-local values legal in hoisted options: Vue's compiler separates hoisted model prop options from setup-time `get`/`set` transformers ([Vue 3.5.13 compiler source](https://github.com/vuejs/core/blob/6eb29d345aa73746207f80c89ee8b37ff7b949c9/packages/compiler-sfc/src/script/defineModel.ts#L49-L114)). Preserve both hoisted-option restrictions and the timing of transformer reads or captures; verify against the project's installed compiler when dependencies are involved. Do not sweep unrelated components.

## Setup Priority and Breadcrumbs

Extend [Dependency-Local Ordering](code-organization-reference.md#state-names-and-dependency-local-ordering) by keeping domain state and workflow actions prominent, with cosmetic-only setup state lower in the script when dependencies permit. Responsive display state such as `const { smAndDown } = useDisplay()` belongs below workflow logic if it only controls presentation; responsive state used by domain initialization must remain before that consumer.

For in-scope pages that already set breadcrumbs, place breadcrumb setup as the final setup statement, after page declarations and lifecycle registration. For example, this script excerpt retains the page's existing resource, save action, mount refresh, responsive state, and breadcrumb call:

```vue
<script setup lang="ts">
const { workflow, save, refresh } = useWorkflow(workflowId)

async function saveWorkflow() {
  await save()
}

onMounted(refresh)

const { smAndDown } = useDisplay()

useBreadcrumbs("ELCC Home", [])
</script>
```

The composables and bindings illustrate existing page contracts, not APIs to introduce. Preserve breadcrumb values, reactive behavior, initialization dependencies, and composable lifecycle requirements; do not move calls past a required setup phase or top-level suspension. When a page also needs `defineExpose`, put it after its exposed definitions and before final breadcrumb setup, subject to its [exposure lifecycle](#form-owned-submission-and-public-component-apis). Without breadcrumbs, the existing `defineExpose`-last preference remains. During authoring and review, distinguish cosmetic state from domain dependencies before reordering; apply only within the requested edit scope.

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

Check actual type consumers before introducing or retaining an exported props type. If only the component's own `defineProps` consumes it, prefer the multiline inline declaration below. Remove a separate normal script block only if that leaves it empty; retain legitimate public exports and independently shared domain types. Preserve prop names, types, nullability, optionality, defaults, and compiled runtime props when inlining.

## Multiline Prop Object Types

Prefer multiline object types passed to `defineProps`, even for a single property. Put the opening brace, each property, and the closing brace on separate lines:

```typescript
const props = defineProps<{
  administrationCostCategoryId: string
}>()
```

Group required props before optional props, retaining relative order within each group where possible. For a mixed declaration:

```typescript
const props = defineProps<{
  administrationCostCategoryId: string
  requestorDisplayName: string
  isDisabled?: boolean
  loading?: boolean
}>()
```

Keep required nullable members in the required group; a value type containing `undefined` does not by itself make a named member optional. Preserve the contract and defaults rather than changing optionality to satisfy ordering. The same required-first preference applies to comparable named input declarations under [Human Readability](code-organization-reference.md#human-readability), not to reordering positional APIs or runtime evaluation.

Apply an accepted correction to equivalent declarations within the requested authoring or review scope, preserving prop names, types, optionality, defaults, and behavior. Formatter success does not establish this structural preference; inspect the declaration itself rather than treating a compact form accepted by a formatter as sufficient. Do not sweep unrelated files.

Use [Diff-Friendly Configuration Layouts](code-organization-reference.md#diff-friendly-configuration-layouts) for extensible defaults as well as other configuration:

```typescript
const props = withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)
```

Adding another default should add its own line without rewriting `loading` or the delimiters. This is distinct from prop-type, event-map, and class-object formatting; preserve project constraints.

## Multiline Emitted-Event Maps

Prefer multiline object event maps passed to `defineEmits`, including a single-event map: put the opening brace, each event, and the closing brace on separate lines. Separate the event declaration from the following declaration using [Whitespace Matters](../../rules/whitespace-matters.md). Formatter acceptance of compact syntax does not establish this structural preference.

For an existing no-argument `updated` event, replace the compact, crowded declaration:

```typescript
const emit = defineEmits<{ updated: [void] }>()
const selectedId = ref(null)
```

With a multiline declaration and separation:

```typescript
const emit = defineEmits<{
  updated: []
}>()

const selectedId = ref(null)
```

Use one consistent no-payload tuple spelling across the reviewed scope. Preserve a documented project convention such as `[void]`; absent one, prefer `[]`. Preserve accepted caller and framework contracts when choosing or changing the spelling, rather than erasing an accepted argument contract merely for notation.

For an existing map with multiple events, keep each event on its own line and retain payload-bearing types:

```typescript
const emit = defineEmits<{
  updated: []
  selected: [workflowStepId: number]
}>()
```

During authoring and review, inspect equivalent single- and multi-event declarations within the requested PR scope when applying a correction. Preserve event names, payload types, supported emit calls, runtime behavior, and framework-mandated contracts; use the project's actual payload types rather than introducing events from the example. Do not reformat unrelated files or repositories.

## Named Snackbar Composable Instances

In components and test setup, bind the existing snackbar composable's returned instance to a local before invoking its methods, even for a single call. Replace inline acquisition:

```typescript
useSnack().reset()
```

With a named receiver in the same owning scope:

```typescript
const snack = useSnack()

snack.reset()
```

Invoke supported methods through that instance, such as `snack.error(...)` or `snack.success(...)`, not through the factory as `useSnack.error(...)`. Preserve the supported initialization point, branch, dependency order, and component/test lifetime; do not hoist acquisition or relocate unchanged setup solely for grouping. This is a snackbar-composable convention, not a ban on fluent APIs or a requirement to alias every function result.

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

When authoring or rewriting a table, inspect the application's existing table components, including server data tables, and nearby newer usage before retaining or recreating a client-side table. Prefer the application's established newer table pattern when it supports the affected table's contract. For example, an existing server data table may be the appropriate replacement when it preserves the table's filters, refresh behavior, and role-specific visibility and actions. Keep a different implementation when the newer pattern conflicts with those requirements; recency alone does not establish compatibility. This is a component-reuse preference, not a universal server-pagination requirement or authorization to migrate unrelated tables, change backend APIs, or add dependencies.

Prefer component names in `<Model|Parent><Type><TopLevelComponent>` order: model or owning parent first, variant or purpose next when needed, and the actual semantic root element/component type last. A `div` root uses `Div`, a `v-card` root uses `Card`, and a `v-row` root uses `Row`: rename `WorkflowStepRowDiv` to `WorkflowStepRow` when its root is `v-row`. An ordinary workflow-steps edit card follows `WorkflowStepsEditCard`, not a verb-first name. Inspect nearby app conventions for other root types rather than inventing a universal suffix mapping; preserve route-level naming contracts and stronger project-local conventions.

Apply an accepted naming correction to analogous components within the affected change, not just the highlighted filename. Update component names, filenames, imports, template consumers, and affected component refs/callers together, preserving behavior and unrelated existing code.

Prefer camelCase component names for component template refs. For an existing `LiveStepsDiv`, use `liveStepsDiv`; for an existing `EditWorkflowStepsCard`, use `editWorkflowStepsCard`. If the component itself is renamed under the naming convention above, derive its ref from the final component name. For example, with an existing `WorkflowStepsEditCard` exposing `refresh`, pair `<WorkflowStepsEditCard ref="workflowStepsEditCard" />` with the script binding `workflowStepsEditCard` and its existing caller `workflowStepsEditCard.value?.refresh()`. Keep the project's supported Vue ref API; align the template ref string, script binding, and callers without changing the exposed operation or its availability checks. Retain descriptive native-element refs and meaningful distinctions between repeated component instances; do not sweep unrelated refs.

For persisted-record selection, prefer a reusable model-specific searchable input rather than making each form own resource lookup. Inspect neighboring domain inputs first: reuse a suitable input, or implement the owning-model input when it is missing. Small fixed option sets, such as roles, may remain ordinary selects; do not add wrappers for trivial controls.

The model input owns debounced server-side search, bounded pagination, autocomplete rendering, and selected-record hydration so a selected label survives changes to the current results. Avoid duplicate client filtering of server-filtered results. Adapt to the project's supported APIs and component contract; this does not authorize new backend search features, unrelated picker migrations, or dependency installation. Keep contextual filters, model bindings, and contextual hints in the parent; preserve loading, authorization, selection/clearing, and visibility-triggered loading behavior.

For example, with the page's existing bindings and a model input supporting its funding-period filter, a persisted category and a fixed role are different controls:

```vue
<template>
  <CategorySearchableAutocomplete
    v-model="categoryId"
    :funding-period-id="fundingPeriodId"
  />
  <v-select
    v-model="role"
    :items="roles"
    label="Role"
  />
</template>
```

For routine fetch failures, prefer the application's established shared request-error feedback path over adding error flags/messages to every lookup control. The existing UI/application boundary owns toast/snackbar presentation, not low-level HTTP transport; follow [Error Ownership and Local Recovery](code-organization-reference.md#error-ownership-and-local-recovery). Keep loading and selection state in the model input. Preserve component-local validation or accepted contextual recovery when it serves the workflow; removing redundant inline feedback does not authorize replacement feedback infrastructure or hiding failures.

Inside that model input, an existing Vuetify autocomplete can retain its model/results/loading bindings without routine request-error bindings when shared feedback owns those failures:

```vue
<v-autocomplete
  v-model="categoryId"
  :items="categories"
  :loading="isLoadingCategories"
  item-title="title"
  item-value="id"
  no-filter
/>
```

These excerpts illustrate ownership, not a new universal prop or data-access API. Use the input's existing search, hydration, and supported clearing contracts.

When one field's value updates another field within a particular form or card, keep that dependency in a watcher owned by that form or card. Keep a shared picker focused on selection rather than adding form-specific behavior or events to it. Follow local reactive patterns; do not rewrite unrelated shared components.

### Test-Support Components Are Not Fixture Data

A Vue wrapper that renders UI or observes a model binding is an executable test-support component, not fixture data. Keep it in the test tree's established common component location, with a component name rather than a misleading `Fixture` suffix. For example, where the project already uses `web/tests/components/common`, prefer `common/CurrencyInputModel.vue` over `fixtures/CurrencyInputModelFixture.vue`:

```vue
<template>
  <div>
    <CurrencyInput v-model="amount" />
    <output data-testid="amount">{{ amount }}</output>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import CurrencyInput from "@/components/CurrencyInput.vue"

const amount = ref<number | null>(null)
</script>
```

The wrapper lets a test observe the parent model after interaction with the real input. Adapt imports and the model type to the actual input contract. When realigning an existing helper, move/rename it and update its imports and test consumers together; do not promote test-only rendering into production components. Follow the project's existing ownership and directory conventions rather than mandating this example's path. Actual fixture data remains valid, inline test wrappers need not be extracted, and unrelated support files need not move.

## Controls in Existing Action Slots

When an existing actions slot already hosts the controls, render them directly in that slot rather than extracting a component or adding a DOM wrapper solely to apply flex/gap spacing. Reuse the slot's supported layout contract or appropriate spacing on the controls themselves; a spacing-only shell is not a new component responsibility.

For example, with existing action handlers and busy state, keep both controls in the card's actions slot:

```vue
<v-card>
  <template #actions>
    <v-btn
      :disabled="isBusy"
      @click="reviewStep"
      >Review</v-btn
    >
    <v-btn
      :disabled="isBusy"
      @click="sendBackStep"
      >Send Back</v-btn
    >
  </template>
</v-card>
```

Preserve control order, handlers, loading/disabled states, and keyboard/accessibility behavior. Inspect the actual slot contract and verify the rendered spacing, alignment, and relevant responsive layouts; compilation alone does not prove layout, and a successful gap in one product does not prescribe a universal pixel value. Check equivalent occurrences within the affected authoring or review scope, not unrelated components.

Retain wrappers that own evidenced semantics, accessibility, lifecycle, or interaction behavior. This preference removes a spacing-only boundary, not every wrapper or meaningful action component. Genuinely reusable components still follow [One Template Root and Existing Components](#one-template-root-and-existing-components); controls passed into an existing slot do not authorize converting them into fragment-root components.

## Vuetify Form Grid Layout

In Vuetify forms, place fields inside `v-row` and `v-col`, including full-width and read-only fields, rather than leaving some fields directly in the form card while their neighbors use the grid. Preserve meaningful field groups and existing responsive widths; this is not one row per field.

For example, inside an existing form card's content, keep a full-width read-only field and the responsive age group in the grid:

```vue
<v-row>
  <v-col cols="12">
    <v-text-field
      v-model="category.name"
      :rules="nameRules"
      label="Category name"
    />
  </v-col>
  <v-col cols="12">
    <v-text-field
      :model-value="fundingPeriodName"
      label="Funding period"
      readonly
      append-inner-icon="mdi-lock"
    />
  </v-col>
  <v-col cols="12" md="6">
    <v-number-input
      v-model="category.minimumAge"
      label="Minimum age"
    />
  </v-col>
  <v-col cols="12" md="6">
    <v-number-input
      v-model="category.maximumAge"
      label="Maximum age"
    />
  </v-col>
</v-row>
```

Use the installed project's supported inputs and breakpoints; the example does not introduce an input dependency. During scoped authoring and review, preserve field bindings, validation, grouping, and the existing form-card action slots. Do not move actions into the grid or rewrite unrelated forms, and do not add Vuetify to projects using another layout system.

## Readable Locked Value Fields

When users still need to read a value that cannot currently be edited, prefer a readable read-only control with a lock icon over disabled low-contrast styling. Preserve the existing condition that permits editing: when it becomes true, remove the lock and restore the supported editing interactions.

For an existing schedule field using Vuetify's native-input-backed text field:

```vue
<v-row>
  <v-col cols="12">
    <v-text-field
      v-model="rentalCar.pickupAt"
      type="datetime-local"
      label="Pickup date and time"
      :readonly="!canEditSchedule"
      :clearable="canEditSchedule"
      :append-inner-icon="canEditSchedule ? undefined : 'mdi-lock'"
    />
  </v-col>
</v-row>
```

Here `readonly` reaches the [native input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly); it prevents user changes through typing and the native date/time picker, while disabling clear affordances when locked. Keep the existing local-date/time value format and application validation; native read-only inputs do not participate in browser constraint validation, so preserve required domain/backend checks. This is not a timezone conversion. Use the project's configured icon set, and preserve any explanation of why the field is locked.

Inspect the installed component contract before applying this to a custom picker: its `readonly` may protect only the text input, not its menu, picker selection, or clear action. Use its supported read-only/picker controls to block every user edit path, including an already-open picker when the condition changes; preserve any existing guarded update handler. Verify locked typing, opening/selection/clearing, readable contrast, and the transition back to editing. Do not replace disabled controls indiscriminately: unavailable action buttons should remain disabled, as described in [Loading and Disabled State](#loading-and-disabled-state).

## Related-Record Descriptions

In ordinary user-facing descriptions, prefer a related record's readable name over its internal identifier. When a descriptive label is unavailable after the existing loading/error handling, use `Unknown` rather than stringifying the identifier. Preserve available labels and the existing data flow; intentional technical identifier displays remain valid. For example, with an existing description primitive's `label` and `value` props:

```vue
<DescriptionElement label="Fiscal year" :value="fundingPeriod?.fiscalYear ?? 'Unknown'" />
```

When only a stable related-record ID is available and the description needs a lookup, reuse a model-specific description wrapper, or compose the existing description primitive in one. The wrapper accepts that ID, uses the existing model-access composable, and owns the lookup and loading presentation. Keep the contextual label in the consuming page rather than duplicating the lookup there. For example, a page using its project's category-description wrapper:

```vue
<CategoryDescriptionElement :category-id="record.categoryId" label="Category" />
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

## Missing Component Identifiers

Choose missing-ID behavior from the child's actual contract, not from a type mismatch at the caller. When the child requires a present identifier, guard its rendering with the project's existing nil/presence predicate and pass the original narrowed value. For example, replace this caller-side coercion:

```vue
<LocationReadCard :location-id="selectedLocationId ?? undefined" />
```

with an availability guard when `LocationReadCard` requires an ID:

```vue
<LocationReadCard v-if="!isNil(selectedLocationId)" :location-id="selectedLocationId" />
```

Here `isNil` represents the project's existing predicate for `null` and `undefined`; reuse its supported narrowing behavior rather than adding a dependency, casting the prop, or using a truthiness check that rejects valid identifiers such as `0`.

If absence is a legitimate child state, pass the original value directly and make its accepted missing values and behavior explicit in the child's prop and implementation contracts. For example, a selector may render with no location selected while skipping ID-dependent requests. Allowing `undefined` in a prop type alone does not establish that behavior; preserve existing loading, empty, error, and request-skip handling.

During review, inspect the affected parent and child together: required-ID children render only with an available ID, while absence-aware children handle missing and present IDs deliberately. Apply the correction to equivalent in-scope callers without rewriting unrelated components. This is not a general ban on nullish coalescing or intentional API-boundary normalization; reactive query identifiers retain their [existing guidance](#independent-resource-query-setup).

## Page-Owned Current-Resource Initialization

When a store's accepted contract explicitly resets working state on page entry, the routed page owns initialization: pass its ID or slug to the store's existing initialization operation, which resets the prior working state and loads that resource. Initialize again when the page is entered or its resource input changes, even when the same ID or slug is supplied; initialization is an explicit reset, not selection deduplication or ID/slug equivalence matching. Under this reset-on-entry contract, children consume the retained current-resource state rather than initializing it independently. A single-current-resource lifetime alone does not imply this contract; the idempotent alternative below is also valid.

Background notifications are a separate path. Before applying or refreshing a notification, compare its resource identity with the identity of the resource currently loaded; only a match may affect that resource. A matching notification follows the existing editing contract and is not by itself a page initialization or reset. Keep established request-ownership safeguards for stale asynchronous results. This single-current-resource guidance does not reset independent editor trees, prohibit caching under another accepted contract, or require a new cancellation API or state framework.

For example, with an existing page route input and store contract:

```ts
watch(
  () => props.workflowSlug,
  (newWorkflowSlug) => workflowStore.initialize(newWorkflowSlug),
  { immediate: true }
)
```

The names and watcher are illustrative: use the page's actual route input, lifecycle trigger, and store API. `initialize` represents the existing operation that resets working state and loads the requested resource; do not add a new API solely to match this example. Children read the resulting store state, while the existing notification handler filters against the loaded resource identity and applies the established editing behavior.

### Idempotent Shared Active Context

When the accepted design is one shared active context, every consumer requests it through the same existing API, regardless of parent/child hierarchy. Requesting the active identity is a no-op: it preserves working state and does not repeat initialization, fetches, or subscriptions. Requesting a different identity switches shared state. Correct IDs remain the caller's responsibility; do not add parent-only initialization flags or per-caller matching projections solely to defend against incorrect IDs.

For an existing collaborative resource API, these requests illustrate the contract:

```typescript
const collaborativeWorkflow = useCollaborativeWorkflow()

await collaborativeWorkflow.requestContext(42) // Establish A.
await collaborativeWorkflow.requestContext(42) // Another consumer: preserve A and edits.
await collaborativeWorkflow.requestContext(73) // Switch to B.
```

Use the project's real API, not a new `requestContext` wrapper just for this example. Deduplication includes repeated requests while initialization is pending. Retain existing stale-result safeguards: a read for A settling after B is requested must not replace B's data, policy, errors, or loader. Review same-context requests, different-context switches, and out-of-order completion. This conditional contract does not globalize independent drafts, introduce a cache/framework, or remove explicit page-entry reset when that is the accepted model.

## Resource-Bound Component Selection

For saved resource-bound components using the accepted store architecture, pass the resource identifier and let the child select its saved model and related collections through the existing reactive stores. This boundary applies even when the stores are global: do not make parents select and thread saved models or model arrays through props merely to supply resource-bound children. The child owns resource selection. With reset-on-entry state, the routed page owns [initialization](#page-owned-current-resource-initialization); with an [idempotent shared active context](#idempotent-shared-active-context), every consumer uses the same context-request API.

For example, a `WorkflowStepActCard` supplies `<WorkflowStepReadCard :workflow-step-id="workflowStep.id" />` instead of passing the saved step and assignee-model array. With existing saved-collection refs and their established stores, the read card selects what it needs:

```vue
<script setup lang="ts">
import { computed } from "vue"

import workflowStepPlayersStore from "@/stores/workflow-step-players-store"
import workflowStepsStore from "@/stores/workflow-steps-store"

const props = defineProps<{
  workflowStepId: number
}>()

const { workflowSteps } = workflowStepsStore()
const { workflowStepPlayers } = workflowStepPlayersStore()

const workflowStep = computed(() =>
  workflowSteps.value.find((step) => step.id === props.workflowStepId)
)
const selectedWorkflowStepPlayers = computed(() =>
  workflowStepPlayers.value.filter((player) => player.workflowStepId === props.workflowStepId)
)
</script>
```

Use the project's actual identifier types, saved-store APIs, supported selection helpers, and authorized collection scope; the names and array selectors above are illustrative, not new stores or APIs to introduce. Keep selection reactive to identifier changes and replaced/updated store records and collections. Reuse the accepted store instance and model ownership rather than copying records into a parallel local collection. Preserve existing missing-resource, loading, error, authorization, and lifecycle handling.

Internal selection does not by itself authorize duplicate fetches, subscriptions, or another fetching/store framework. Under reset-on-entry ownership, keep page-entry resets and background updates with their existing owners; under an idempotent active-context contract, children may request that context just like other consumers without resetting repeated same-context requests. This preference does not prohibit scalar/presentation props, neutral presentation components that receive already-resolved values, or intentionally owned local editor drafts; it concerns saved resource-bound components, not every component prop.

During review, inspect equivalent resource-bound callers and children within the affected change, migrating the identifier interface and internal selection together. Do not rewrite unrelated components or change accepted edit/Cancel/save contracts merely to apply the boundary.

## Optional Live-Update Composition

Compose optional live-update behavior between the routed page and the existing base component: the page renders the feature wrapper, and the wrapper renders the base component. Reserve the `Page` suffix for route-level components; feature components sit below pages rather than wrapping an existing page.

Keep normal model-backed editors in their established component families. Reuse existing models, resource composables, and API clients rather than relocating or reimplementing them to introduce the capability. The wrapper owns live subscriptions and refresh coordination through the project's existing lifecycle mechanisms; the base component keeps its ordinary editing responsibilities and remains usable without live behavior.

During authoring and review, ask whether introducing the capability unnecessarily moved existing base components or broadened the PR. Preserve existing route contracts, permissions, record/state ownership, and required descendant lifecycle behavior; changing composition is not permission to reset an active editor. This boundary does not mandate feature directories or wrappers for ordinary UI work, override stronger local ownership conventions, or collapse legitimate separate interaction capabilities.

Name collaboration-specific composables for their multi-user live-editing purpose rather than only calling them current resources. For example, a live collaborative editor may use `useCollaborativeWorkflow`, while an independent draft or read-only screen keeps its established `useWorkflow` resource path even though both display workflows. Names are project-local examples, not required API spellings. Do not select collaboration solely because the model matches, ban ordinary current-resource state, require collaboration for normal editors, or prescribe OT/CRDT technology.

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

## Failed Loads and Empty Data

When a table owns a load-error state, prefer its supported error/empty-data slot for standard error presentation and Retry rather than replacing the entire table. Keep failure explicitly distinguishable from a successful empty result, and prevent stale successful rows from appearing as current results. Inspect the installed table contract: an empty-data slot may run only when there are no displayed items and loading has finished.

For example, with existing record, error, loading, and retry bindings, Vuetify's `no-data` slot can own the error branch:

```vue
<template>
  <v-data-table
    :items="tableRecords"
    :loading="isLoading"
  >
    <template
      v-if="isErrored"
      #no-data
    >
      <v-empty-state title="Unable to load records">
        <template #actions>
          <v-btn
            :loading="isLoading"
            @click="reloadRecords"
          >
            Retry
          </v-btn>
        </template>
      </v-empty-state>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
const tableRecords = computed(() => {
  if (isErrored.value) return []

  return records.value
})
</script>
```

The conditional slot leaves the table's normal successful-empty presentation unchanged. The explicit error branch makes the empty displayed collection an error presentation, not a claim that loading succeeded; do not reduce this to an empty-items binding without error feedback and recovery. Reuse the application's actual standard error UI, imports, data owner, and retry operation. The load owner must publish failure and end loading so the slot is reachable, and clear the error on a successful retry, including a successful empty response. Preserve existing pending/retry guards and stale-request ownership. Keep totals, selection, and row-dependent actions consistent with unavailable current results, especially for server tables; hiding rows alone must not leave stale records actionable.

For components without an appropriate supported slot, retain a dedicated error `v-if` branch with normal content in `v-else`. Preserve recovery actions and required descendant state/lifecycle when changing mounted branches. This is not a mandate to use Vuetify, a requirement for local error flags on every lookup, or permission to replace established shared request-error feedback; retain [Error Ownership and Local Recovery](code-organization-reference.md#error-ownership-and-local-recovery).

### Record-Availability Branches

For a record-bound form, guard record-dependent rendering with the project's supported nil predicate, not a request-loading flag. Loading describes pending work, not whether the editor has a usable record. Use one missing-record branch followed by available-record permission branches without repeating record truthiness:

```vue
<template>
  <section>
    <template v-if="isNil(category)">
      <CategoryLoadError
        v-if="isErrored"
        @retry="reloadCategory"
      />
      <CategoryLoading v-else-if="isLoading" />
      <CategoryNotFound v-else />
    </template>
    <CategoryEditForm
      v-else-if="policy?.update"
      :category="category"
    />
    <CategoryReadCard
      v-else
      :category="category"
    />
  </section>
</template>
```

Use existing components, request/recovery bindings, and the actual record policy; the read-only branch illustrates an accepted record-specific permission alternative, not a new access-denial requirement. Here `isNil` checks `null` and `undefined` and must retain the project's supported template type narrowing; pass the original narrowed record without casts or changing its model/source nil types. A nil record alone does not justify an indefinite skeleton: retain distinct pending, failed/retry, and settled-absent states. If a refresh keeps an available record, preserve its existing pending/error feedback and stale-data policy rather than dropping that feedback because the example's missing branch is bypassed. During review, check missing and available records separately from loading, including failure/recovery and permitted/restricted record actions. Access presentation still follows the [existing owning boundary](#permission-restricted-navigation-and-access-presentation).

## Task-Focused Help and Supplemental Table Information

Before adding or polishing explanatory UI, identify the end-user task or decision it supports. Keep QA-only ranking mechanics, count explanations, and verification notes in testing instructions or reviewer evidence, not the product. When feedback questions a panel's value or existence, reconsider removing it before improving its layout. Preserve administrative counts and help that serve an evidenced user need.

Write help in plain language using recognizable actions and outcomes, not unexplained implementation geometry. If the supported interaction is dragging a step outside its group, explain that action rather than saying "The left gutter ungroups a step in place." Verify the actual behavior and visible labels before choosing wording; this example does not prescribe a gesture or ordering policy.

For editing choices, make the selected content/version and persistence effect clear before activation. Label the content choice or operation rather than relying on ambiguous storage terms. If a choice only updates a local draft, explain that near the controls and identify the actual Save action required to persist it; if it saves immediately, communicate that different effect accurately.

For example, when both conflict choices only update the draft, use "Merge with mine" and "Use their version" with one shared explanation: "These choices only update your draft. Select Save to save your changes." Check the copy against the actual selected source, merge/replacement behavior, and persistence boundary; do not turn a wording correction into autosave or another behavior change.

During authoring and review, verify that the user can distinguish the chosen content and draft-only versus persisted effects before acting. Reuse the project's actual labels and controls; the example is not mandatory wording across products. Ordinary self-explanatory controls do not need redundant explanatory text.

Review nearby page-level help before adding another blurb. Consolidate overlapping explanations for the same reader need into one coherent guide using the existing informational component, preserving necessary assignment, saving, and other task instructions. Keep distinct contextual help separate when it serves different tasks; this is not a one-card quota.

Place useful supplemental table explanations below the complete table, including pagination, following stronger project-local conventions. Match nearby pages' vertical gaps, edge alignment, and surrounding padding, not only their component choice. Warnings, required controls, and task-critical instructions may need a different position.

Verify settled desktop and narrow-screen layouts: pagination remains usable, help wraps without overflow, and spacing/alignment match the page's conventions. Component names and spacing values stay project-local. Guidance review does not establish rendered application behavior; changes to a consuming UI still require actual-surface verification.

## Creation Drafts and Named Ref Inputs

For model-backed creation forms, inspect the user-designated or nearby new-page precedent before choosing state, types, and initial values. Prefer one descriptively named attributes draft typed from the existing API/model creation contract, such as `Partial<CategoryCreationAttributes>` when that API accepts a validated partial payload. Bind ordinary inputs directly to its fields and submit the validated draft through the existing API client instead of rebuilding it from parallel field refs. Use the required validated shape when the accepted API does not support a partial payload; do not submit server-owned response metadata or weaken backend validation.

For example, with the existing `CategoryCreationAttributes`, API client, form ref, and title-validation rules:

```ts
const categoryAttributes = ref<Partial<CategoryCreationAttributes>>({
  title: "",
})

async function createCategory() {
  const validation = await categoryForm.value?.validate()
  if (!validation?.valid) {
    return
  }

  await categoriesApi.create(categoryAttributes.value)
}
```

```vue
<v-form ref="categoryForm" @submit.prevent="createCategory">
  <v-text-field
    v-model="categoryAttributes.title"
    :rules="titleRules"
    label="Title"
  />
  <v-btn type="submit">Create</v-btn>
</v-form>
```

Keep independent UI state separate from model attributes. Retain form-owned dependent-field resets and established edit/save/reset lifecycles; this creation-form preference is not a storage rewrite for existing editors. During authoring and review, preserve the consuming contract's omitted/undefined/null distinctions, numeric values, and exact decimal strings rather than normalizing them for the draft. These excerpts assume the existing API's validated partial-payload contract; adapt their names and required fields to the designated source.

Declare caller-owned ref inputs in a descriptive `const` before passing the same ref to a composable or other consumer. Do not hide its construction inside the call, such as `useFundingPeriods(ref({ perPage: 1 }))`. With the existing bindings, make the query state visible:

```ts
const fundingPeriodsQuery = ref({
  perPage: 1,
})

const { fundingPeriods } = useFundingPeriods(fundingPeriodsQuery)
```

Keep the existing ref type, initializer, identity, and query lifecycle. This preference concerns caller-owned ref definitions, not ordinary inline literals, default parameter expressions, or established reactive-state return patterns; do not add state-management helpers or sweep unrelated code.

## Nullable Numeric Input Boundaries

When a reusable numeric input accepts values for a nullable numeric model, normalize the cleared value at that input boundary before emitting the parent update. Keep the contract explicit as `number | null`: an empty input emits `null`, while numeric values—including `0`—remain numbers. Vue's [`v-model.number` modifier](https://vuejs.org/guide/essentials/forms.html#number) parses numeric input, but preserves an empty string when the field is cleared; it does not supply this nullable contract on its own.

Reuse a suitable supported input first; add a small wrapper only when needed. For an input contract that accepts valid numeric text, the conversion can remain visible:

```vue
<template>
  <input
    type="number"
    :value="props.modelValue ?? ''"
    @input="updateValue"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits<{
  "update:modelValue": [value: number | null]
}>()

function updateValue(event: Event) {
  const input = event.target as HTMLInputElement
  emit("update:modelValue", input.value === "" ? null : Number(input.value))
}
</script>
```

The conversion is representation handling, not business validation. Keep accepted-value rules, authorization, and persisted constraints with their existing owners. Define the component's accepted input contract rather than prescribing malformed or intermediate input behavior; preserve precision, and retain financial decimal-string representations. During authoring and review, check that clearing emits `null`, accepted numeric values remain numbers, and zero remains `0`. Remove duplicated empty-string-to-null repair only from affected downstream save or model-access paths once the input owns that conversion; do not broaden the cleanup.

## Explicit Derived-Field Bindings

Prefer a readonly `computed` → `:model-value` → named `@update:model-value` handler pipeline for derived form fields. Keep writes visible in the handler rather than a computed setter or watcher-mirrored copy of derived state. Separate state declarations, computed blocks, and handlers with blank lines. Preserve the form's accepted edit/save lifecycle and genuine form-owned dependent-field watchers; this preference does not mandate a draft-storage design.

For an already-available record whose established edit contract permits this field assignment:

```vue
<template>
  <v-select
    :model-value="selectedTagIds"
    @update:model-value="updateSelectedTagIds"
  />
</template>

<script setup lang="ts">
const selectedTagIds = computed(() => record.value.tagIds)

function updateSelectedTagIds(tagIds: string[]) {
  record.value.tagIds = tagIds
}
</script>
```

The example shows binding and ownership only; reuse the project's actual record availability, types, and write/save operation rather than copying an assignment into an incompatible contract.

For a directly editable field that also triggers update effects, prefer `:model-value` and one named `@update:model-value` handler instead of combining `v-model` with an additional update listener. Assignment and dependent effects belong in that handler in their intended order; a readonly computed wrapper is not needed for a direct field.

For example, replace `v-model="rentalCar.matchFlightTimes"` plus `@update:model-value="requestFlightScheduleMatch"` with:

```vue
<template>
  <v-switch
    :model-value="rentalCar.matchFlightTimes"
    :disabled="!canUpdateFlightMatching || isMatchingFlightTimes"
    @update:model-value="updateMatchFlightTimes"
  />
</template>

<script setup lang="ts">
function updateMatchFlightTimes(matchFlightTimes: boolean | null) {
  if (!canUpdateFlightMatching.value || isMatchingFlightTimes.value) return

  rentalCar.value.matchFlightTimes = matchFlightTimes === true
  requestFlightScheduleMatch()
}
</script>
```

This excerpt assumes an available record with a boolean field and a Vuetify switch that can emit `null`; use the actual control's payload and the existing domain operation. The matching operation reads the newly assigned flag and preserves its existing on/off behavior, availability guards, and pending-update policy; do not drop accepted queued/latest-update behavior in favor of the example's reject-while-pending guard. Avoid a second implicit assignment or duplicate matching listener. Ordinary `v-model` without an extra update listener remains appropriate, as do legitimate form-owned dependent-field watchers. Apply this correction only to affected bindings, not unrelated forms.

## State-Driven Dialogs and Recovery

Application error handlers/plugins update shared recovery/error state, through its ordinary writable refs or meaningful state operations, rather than imperative dialog `show`/`hide` commands. The presentation component derives visibility from error presence and owns display lifecycle. Preserve genuine close/recovery policies and the [transport/UI error boundary](code-organization-reference.md#error-ownership-and-local-recovery); do not add a new store or trivial setter layer.

When a dialog already has a supported visibility model, do not add an outer `v-if` solely to duplicate show/hide state. Keep conditional inner content for transient availability, and retain an outer mount guard when an independent lifecycle requirement actually needs it. Verify observable closure/hidden content, not mandatory DOM removal from a dialog whose supported contract keeps hidden nodes mounted.

If a URL reflects runtime-only recovery, make state ownership and synchronization direction explicit instead of maintaining competing URL/runtime truth through paired reconciliation watchers. Preserve actual route, navigation, and dismissal contracts; do not impose a universal URL mirror or hide a legitimate close policy.

### URL-Owned Dialog Selection

Where the URL already owns dialog selection and the project has a supported query-state pattern, use one query-backed ref rather than a local selected-ID ref plus custom query watchers/router writes. Declare it immediately below emitted events. For a project with `useRouteQuery` and its existing `integerTransformer`, an illustrative setup excerpt is:

```typescript
const emit = defineEmits<{
  updated: []
}>()

const workflowStepId = useRouteQuery("showReAssign", null, {
  transform: integerTransformer,
})

function open(workflowStepIdToOpen: number) {
  workflowStepId.value = workflowStepIdToOpen
}

function close() {
  workflowStepId.value = null
}
```

Reuse the project's supported imports, converter signature, nullable type, and query removal behavior; this excerpt assumes its existing transformer accepts the nullable query contract, not a new helper or dependency. Presentation, validation, draft lifecycle, and meaningful lifecycle watchers remain separate. Review direct URL entry, changed selection, close/removal, preservation of unrelated query parameters, and accepted draft/Cancel behavior. Do not make every dialog URL-driven.

## Component-Tree State Sharing

Choose the state owner, consumers, and lifetime from the actual component tree before selecting a sharing mechanism. Prefer `provide`/`inject` for simple shared values, such as a display-density setting. For shared object collections, such as an editable array of records, prefer an appropriate existing composable or store rather than making injection the default collection API.

Keep component-tree state scoped to its owning tree when that is its lifetime; choosing a composable or store does not make the state application-global. Independent editor trees must retain their intended isolation, while consumers within one tree share the intended instance. Use application-wide ownership only when the actual contract calls for it. Preserve model-access and editor ownership described below rather than creating another canonical collection.

This is a maintainability preference, not a universal prohibition on providing collections, a requirement to use Pinia, or permission to add a dependency or migrate unrelated state. Respect stronger project-local contracts and genuine existing injection boundaries.

### Store Definitions and Instances

For application-owned public store functions, use a lower-camel resource noun such as `<resource>Store`, a matching kebab-case `<resource>-store.ts` module, and default imports. The callable's name describes the resource, without a `build` prefix; its returned refs and actions are the values consumers use:

```typescript
import workflowStepsStore from "@/stores/workflow-steps-store"

const { commit } = workflowStepsStore()
```

Expose state and getters as reactive refs alongside callable, correctly bound actions so consumers can destructure directly without a separate consumer-side `storeToRefs` step. Preserve each field's accepted writable or read-only contract and its connection to the existing model owner when values are replaced or updated. Returning one-time property values, unbound methods, or a new underlying store per call does not satisfy that interface. Reuse the project's supported reactive/framework mechanisms internally; this contract does not prescribe a new wrapper, state library, or implementation algorithm.

When correcting this pattern, align the affected public functions, modules, default exports/imports, consumers, tests, and examples together. During review, flag superseded build-prefixed public callables/modules, PascalCase factory aliases, named-only imports for this pattern, or abbreviations such as `stepsStore` that discard resource context. Preserve store identity, lifetime, reactivity, action binding, and component-tree sharing; naming and ref returns do not create another store or change state ownership.

This preference concerns application-owned public APIs in the requested authoring/review scope. Do not rename third-party APIs such as Pinia's `defineStore`, replace genuine `use` composables, sweep unrelated code, or infer a required internal definition name or universal ban on `current`. Follow stronger project-local naming contracts.

### Model-Owned Stores and Form-Facing Editing

Within model-store refactors, keep application stores aligned with model boundaries rather than individual dialogs or editor screens. Improve the existing workflow-step model store's editing interface instead of introducing a `WorkflowStepEditorStore` merely to shorten a dialog. Keep route selection, form presentation, validation, and dialog lifecycle with the UI; model state and persistence belong to the existing model owner under its accepted editing contract. This does not prohibit component-local form state or genuine shared composables, require a new store/library, or authorize unrelated migrations.

Expose a straightforward editable resource model so ordinary fields retain direct `v-model` bindings. Keep accepted snapshots, change tracking, and live reconciliation behind that model store's form-facing editing interface rather than requiring every field to read `effectiveWorkflow` and call `queueChange`. Preserve explicit actions for meaningful domain operations and the existing model-access composable/editor ownership boundary below; do not move all UI workflows into generic data access.

For example, when the existing store exposes the editable workflow:

```vue
<template>
  <v-text-field
    v-if="workflow"
    v-model="workflow.title"
    label="Title"
  />
</template>

<script setup lang="ts">
import workflowStore from "@/stores/workflow-store"

const { workflow } = workflowStore()
</script>
```

Use the project's actual resource availability, store API, and form controls. Simpler bindings must preserve Cancel isolation, unsaved local edits during remote refresh, and the accepted lifetime and completion behavior of in-flight saves, including navigation. Keep one canonical model owner; do not introduce a separately reconciled model copy or discard pending work merely to simplify the interface. An accepted local editable view or snapshot needs explicit ownership, not a prescribed watcher, proxy, or draft/reconciliation algorithm.

## Model-Mirror Composables and Editor Ownership

Inspect established sibling composables and any user-designated architecture before extending a `use` module. When singular/plural data-access composables mirror the model layer, retain those mirrors while the underlying model exists, even with zero current callers. An editor-specific wrapper does not replace the model mirror. Remove obsolete mirrors when their model is deleted; do not use this exception to preserve arbitrary dead code or invent speculative wrappers.

Keep component-specific editing workflows—drafts, queued writes, reconciliation, editor errors, and retry feedback—with the owning editor component, rather than accumulating them in a model-access composable. Preserve genuine shared reactive/lifecycle composables and explicit project ownership contracts; a function starting with `use` is not evidence that it owns every editing operation.

Consumers use the composable's returned reactive record/collection refs as the model source. Do not copy them into a parallel record map and watch fetches to merge fields or revision counters. Keep genuine pending commands and failure feedback with the editor. If accepted edits must survive navigation, inspect editor lifetime and supported framework retention before adding parallel model ownership; preserve the accepted save/navigation guarantee. An explicitly contracted detached draft remains valid; neither `KeepAlive` nor a particular draft-storage design is mandatory.

### Form-Owned Submission and Public Component APIs

Keep validation, saving state, persistence, and save feedback inside the owning form. Do not expose its raw form ref merely so a parent can validate and save it. Keep page loading, permission gating, and navigation with the parent, and communicate successful completion through the established event or component contract. Reuse the existing model and persistence owner; internal submission does not require another draft, store, or API layer.

For an existing workflow form with `workflow`, `titleRules`, `saveWorkflow`, and `reportSaveError` bindings, the form can own submission and emit its existing `saved` event:

```vue
<template>
  <v-form
    ref="form"
    @submit.prevent="submit"
  >
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="workflow.title"
          :rules="titleRules"
          label="Title"
        />
      </v-col>
    </v-row>
    <v-btn
      type="submit"
      :loading="isSaving"
      :disabled="isSaving"
      >Save</v-btn
    >
  </v-form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ saved: [] }>()
const form = useTemplateRef("form")
const isSaving = ref(false)

async function submit() {
  if (isSaving.value || !form.value) return

  isSaving.value = true
  try {
    const { valid } = await form.value.validate()
    if (!valid) return

    await saveWorkflow()
    emit("saved")
  } catch (error) {
    reportSaveError(error)
  } finally {
    isSaving.value = false
  }
}
</script>
```

Use the project's supported imports, ref inference, validation result, save/error handling, and completion payload. Preserve existing action-slot placement, authorization, Cancel isolation, pending-update policy, and save lifetime; the parent may navigate on successful completion, not on an attempted or failed save. This example assumes saving resolves only after persistence succeeds and rejects on failure. It does not replace a deliberately different submission contract.

Decide whether a public API is needed separately from its placement. Preserve legitimate component APIs, such as an input's imperative focus operation. Place a necessary `defineExpose` last in `<script setup>`, after the definitions it exposes, except that existing page [breadcrumb setup](#setup-priority-and-breadcrumbs) follows it when dependencies and lifecycle permit. For an existing native input with `ref="input"`:

```vue
<script setup lang="ts">
const input = useTemplateRef("input")

function focus() {
  input.value?.focus()
}

defineExpose({ focus })
</script>
```

Respect Vue's [exposure lifecycle](https://vuejs.org/guide/essentials/template-refs.html#ref-on-component): `defineExpose` must execute before the first top-level `await`. If setup awaits, keep exposure and its required definitions before that suspension rather than moving it past `await` to satisfy the last-declaration preference. An `await` inside a later-invoked handler is not a top-level setup suspension. Do not remove an accepted public API or change initialization order merely to apply this convention.

### Singular Invocation State and Shared Collections

When `useWorkflowStep(workflowStepId)` has a component-scoped single-record contract, each invocation owns one selected step and its local lifecycle, not a hidden shared `steps: Record<number, StepState>` registry. Two independent callers retain isolated local state; changing one caller's selection or disposing it must not switch or tear down the other's lifecycle. Keep collection-wide saved records/subscriptions with their explicit collection owner and review selection changes and teardown against that contract.

Singular naming alone is not a ban on shared resources: explicitly shared collections/caches and the accepted [single active context](#idempotent-shared-active-context) have different ownership. Do not infer universal discard-on-navigation behavior or require every singular resource to own an editing draft.

### Loaded-Resource Projections

Expose reusable reactive projections of loaded records as named computed helpers on the owning resource composable, following neighboring helper names and return sections. With existing saved player refs:

```typescript
// Inside useWorkflowStepPlayers:
const asPlayerAttributes = computed(() =>
  workflowStepPlayers.value.map(({ userId, role }) => ({ userId, role }))
)

return {
  workflowStepPlayers,

  // helpers
  asPlayerAttributes,
}
```

The component consumes `const { asPlayerAttributes } = useWorkflowStepPlayers(query)` rather than repeating a component-local `playerAttributesFromSavedPlayers` conversion; ref changes recompute the projection. The fields are illustrative, not creation-payload semantics. Keep component-specific editable drafts, unsaved-state transformations, and editing workflows with their actual owners; not every transformation belongs in data access.

## Reactive Identifier Roles

Give composable inputs plain domain names and computed unwrapped values a `normalized` prefix. Keep normalization reactive rather than capturing an input once:

```typescript
import { computed, toValue } from "vue"
import type { MaybeRefOrGetter } from "vue"

function useWorkflow(workflowId: MaybeRefOrGetter<number | null>) {
  const normalizedWorkflowId = computed(() => toValue(workflowId))
  return { normalizedWorkflowId }
}
```

Normalization is not user selection; genuine selection projections retain meaningful selected-state names. In `watch` callbacks prefer `new<DomainName>` for newly observed values, including tuples, and accurate previous-value names:

```typescript
watch(
  [normalizedWorkflowId, normalizedWorkflowStepId],
  ([newWorkflowId, newWorkflowStepId], [previousWorkflowId, previousWorkflowStepId]) => {
    handleSelectionChange(
      newWorkflowId,
      newWorkflowStepId,
      previousWorkflowId,
      previousWorkflowStepId
    )
  },
  { flush: "post" }
)
```

The watcher excerpt assumes existing sources and handler; preserve sources, logic, options, and the actual previous-value availability contract when applying a naming correction across analogous in-scope watchers.

For an existing async operation's fixed captured identifier, use `static<DomainIdentifier>`:

```typescript
const staticCategoryId = unref(categoryId)
if (staticCategoryId == null) return

await categoriesApi.update(staticCategoryId, attributes)
```

This is an operation-start snapshot for narrowing, not a class static member or live input. Match the captured domain: `state.workflowId` becomes `staticWorkflowId`, not `staticWorkflowStepId`. Preserve the capture point, nil guard, and operation behavior; do not add unnecessary snapshots, replace live inputs, rename meaningful request objects, or introduce coordination mechanisms solely for naming.

### Watcher-Local Hydration

Prefer an inline callback for hydration owned only by that watcher, using its observed `new<DomainName>` value rather than rereading the outer ref. Keep meaningful shared or independently owned operations named, as in the selection-handler example above.

For example, replace a watcher-local function that rereads the resource:

```typescript
function populateScheduleFromRentalCar() {
  if (isNil(travelDeskRentalCar.value)) return

  schedule.startDate = travelDeskRentalCar.value.startDate
  schedule.endDate = travelDeskRentalCar.value.endDate
}

watch(
  [
    travelDeskRentalCar,
    () => travelDeskRentalCar.value?.startDate,
    () => travelDeskRentalCar.value?.endDate,
  ],
  populateScheduleFromRentalCar,
  { immediate: true }
)
```

With hydration beside only the saved-field sources it consumes:

```typescript
watch(
  [() => travelDeskRentalCar.value?.startDate, () => travelDeskRentalCar.value?.endDate],
  ([newStartDate, newEndDate]) => {
    if (newStartDate === undefined || newEndDate === undefined) return

    schedule.startDate = newStartDate
    schedule.endDate = newEndDate
  },
  { immediate: true }
)
```

This example assumes a loaded record's saved dates are `string | null`; `undefined` comes from an absent record. It hydrates immediately when loaded and when either saved value changes, including transitions to `null`. An absent record leaves the local schedule unchanged. Preserve the actual model's nil types, supported narrowing, field conversions, initialization, and watch options; a workflow that clears on absence must retain that behavior instead.

The source list is the trigger contract. Watch only values that independently require hydration, and consume those observed values rather than rereading the record. Replacing the record with equal saved dates does not reset local schedule bookkeeping in this field-driven contract. Retain a whole-record or identity source when replacement independently requires work; this is not a ban on record watching. During review, justify each source and check initial loading, relevant field changes, equal-value replacement, absence, and unrelated edits. Do not add universal `deep: true` or broaden hydration so unrelated edits overwrite local state.

## Independent Resource Query Setup

Give independent resources separate domain-named query definitions beside their composable calls, with one blank line between groups, even when query shapes currently match:

```typescript
const workflowStepsQueryOptions = computed(() => ({
  where: { workflowId: normalizedWorkflowId.value },
}))
const { workflowSteps } = useWorkflowSteps(workflowStepsQueryOptions)

const workflowStepPlayersQueryOptions = computed(() => ({
  where: { workflowId: normalizedWorkflowId.value },
}))
const { workflowStepPlayers } = useWorkflowStepPlayers(workflowStepPlayersQueryOptions)
```

These excerpts assume the existing query contracts support the shown ID type; preserve actual values and reactivity. Do not deduplicate solely because shapes match, invent a state abstraction, or split intentionally shared configuration.

Avoid `value ?? undefined` for reactive query identifiers. Pass the nullable ID directly when the existing query accepts it. If a present ID is required, guard missing selection before constructing the query and retain the existing request-skip mechanism:

```typescript
const workflowStepPlayersQueryOptions = computed(() => {
  const workflowStepId = selectedWorkflowStepId.value
  if (workflowStepId == null) return null

  return { where: { workflowStepId } }
})

const { workflowStepPlayers } = useWorkflowStepPlayers(workflowStepPlayersQueryOptions, {
  skipWatchIf: () => workflowStepPlayersQueryOptions.value === null,
})
```

Here `null` must be the project's supported absent-query sentinel and the existing caller must skip the request; never turn missing selection into an unfiltered request. Use the actual project's sentinel and guard instead of adding another query abstraction. This is not a general ban on nullish coalescing or intentional boundary transformations.

## Direct Prop Refs

When exposing an unchanged prop as a ref, prefer `toRefs(props)` over a `computed` getter that only returns that prop. For existing component props:

```typescript
import { toRefs } from "vue"

const { workflowStepId } = toRefs(props)
```

This replaces `computed(() => props.workflowStepId)` without capturing a one-time value: the ref continues to read current prop updates. Preserve prop types, defaults, optionality, and readonly ownership. Keep `computed` for actual derivation, such as combining parent and request loading flags; this preference does not ban computed values or objects containing refs.

For parsing or another transformation, read `props.<name>` directly inside the computed getter instead of creating an intermediate prop ref solely for that derivation. With an existing string `travelAuthorizationId` prop and an established `parseInt` conversion:

```typescript
import { computed } from "vue"

const travelAuthorizationId = computed(() => parseInt(props.travelAuthorizationId))
```

The getter tracks prop updates, so a change from `"5"` to `"9"` updates the derived value from `5` to `9`; do not move the prop read or conversion outside the getter into a one-time snapshot. Keep the accepted conversion function, radix, invalid-input behavior, and prop contract unchanged rather than introducing a new parser or fallback during this cleanup.

During authoring and review, distinguish derivation-only refs from refs with independent consumers. Remove the intermediate binding and an unused `toRefs` import only when no other use remains. Preserve `toRefs(props)` for unchanged reactive inputs, such as a composable accepting the original string ref, and retain refs needed by other consumers. This is a scoped removal of redundant indirection, not a ban on combining legitimate refs and derived values in one component.

## Established Watcher Guards

Before adding a watcher-control option to a composable, inspect the project's existing suppression convention. Where `useWorkflowStep` already supports a `skipWatchIf` predicate, reuse it rather than adding a parallel `watchId` switch. With existing `props`, the `toRefs` import, and that composable, ordinary automatic fetching retains its default:

```typescript
const { workflowStepId } = toRefs(props)
const { workflowStep, isLoading, refresh } = useWorkflowStep(workflowStepId)
```

When the accepted caller already owns the refresh trigger, the alternative suppresses automatic watching through the established predicate:

```typescript
const { workflowStepId } = toRefs(props)
const { workflowStep, isLoading, refresh } = useWorkflowStep(workflowStepId, {
  skipWatchIf: () => true,
})
```

Keep explicit `refresh()` available and invoke it from the caller's existing refresh trigger; suppression of automatic fetching must not silently disable manual refresh. Preserve ordinary immediate/ID-change fetching for default callers and the existing response to a reactive predicate becoming false. These are alternative caller examples, not declarations to combine or an instruction to suppress every watcher.

Retain the composable's accepted cancellation, request-ownership, and loading-state contracts when the ID changes or clears, the guard suppresses watching, the scope disposes, or an obsolete request settles. An older request must not publish into a newer context or clear its loader; follow [Record-Scoped Async Ownership](#record-scoped-async-ownership). Do not introduce `skipWatchIf` in projects lacking it or redesign an adequate watcher API merely to match this example.

## Mutable Component Workflow Snapshots

Prefer `ref` or an appropriate `reactive` object for mutable component-owned workflow state, including nullable saved snapshots. A snapshot that is replaced and reset to `null` fits a nullable ref. For example, this component script excerpt uses the existing nullable `departureDate` and `departureTime` refs to save the manual schedule before flight matching first replaces it:

```typescript
const scheduleBeforeFlightMatching = ref<{
  departureDate: string | null
  departureTime: string | null
} | null>(null)

function captureManualSchedule() {
  if (scheduleBeforeFlightMatching.value !== null) return

  scheduleBeforeFlightMatching.value = {
    departureDate: departureDate.value,
    departureTime: departureTime.value,
  }
}

function restoreManualSchedule() {
  const savedSchedule = scheduleBeforeFlightMatching.value

  if (savedSchedule === null) return

  departureDate.value = savedSchedule.departureDate
  departureTime.value = savedSchedule.departureTime
  scheduleBeforeFlightMatching.value = null
}

function resetManualScheduleSnapshot() {
  scheduleBeforeFlightMatching.value = null
}
```

Keep capture at the existing transition before the first matching overwrite, not on every refresh; repeated captures must retain the original manual values until restore/reset. Restore the saved fields before clearing the snapshot, and preserve the existing no-snapshot behavior and reset trigger. In script, update every snapshot guard, read, replacement, and reset to use `.value`; a `reactive` container instead uses its supported property access consistently. Preserve the real field types, nullable contents, copy depth, capture timing, restore behavior, and object-identity requirements rather than adopting this illustrative schedule shape.

Constants and function-local temporary values such as `savedSchedule` stay plain. This component-owned state preference does not require rewriting private composable bookkeeping such as `savedWorkflow` in [Writable State and Reset Operations](#writable-state-and-reset-operations), exposing private state, or making every local reactive. Adding a reactive binding does not authorize extra watchers or new side effects. During authoring and review, inspect all accesses and the capture-once, restore, and reset paths within the requested scope.

## Writable State and Reset Operations

Follow the established reactive-state plus `...toRefs(state)` return pattern for ordinary writable composable state. Prefer caller-side `error.value = capturedError` over `readonly(error)` plus a trivial `setError` wrapper when no accepted invariant requires the action. Keep meaningful operations, including reset and actions that actually protect invariants; this is not a blanket removal of store actions or permission to rewrite unrelated composables.

Internally, read and assign `state.workflow` or `state.isLoading` directly instead of destructuring `toRefs(state)` into internal aliases. Keep ref conversion at public return or genuine ref-consuming boundaries:

```typescript
const state = reactive<{
  workflow: Workflow | null
  isLoading: boolean
}>({
  workflow: null,
  isLoading: false,
})
let savedWorkflow: Workflow | null = null

function reset() {
  state.workflow = savedWorkflow
  state.isLoading = false
}

return { ...toRefs(state), reset }
```

The private saved value stays private and the public refs remain writable/reactive, not plain snapshots. Preserve actual reset/copy semantics. Inspect analogous in-scope composables when correcting this pattern. This does not ban `toRefs(props)`, consuming another composable's public refs, or refs required at real boundaries; do not expose private state just to spread it.

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

  fetch,
  refresh: fetch,

  // helpers
  itemCount,
}
```

Keep the same property names, values, refs, and function identities. Preserve spreads, property precedence, getters, evaluation order, and any order-sensitive consumer behavior; do not mechanically reorder behavior-sensitive entries to obtain the layout. Keep declarations beside their dependencies and direct derived state. Do not add empty or unnecessary sections, move domain logic into a composable, or sweep unrelated modules.

### Resource Read Implementation and Alias

For application-owned resource-read composables, name the implementation `fetch`, call `fetch` internally, and return `refresh: fetch` as the same function, not another request path:

```typescript
async function fetch() {
  // Existing ID guards, read, publication, and completion ownership stay here.
  const { workflow, policy } = await workflowsApi.get(normalizedWorkflowId.value)
  publishCurrentResult(workflow, policy)
}

watch(normalizedWorkflowId, fetch, existingWatchOptions)

return { fetch, refresh: fetch }
```

This is a naming/alias excerpt using existing API, watcher, and ownership helpers, not a complete lifecycle implementation. Preserve existing read behavior, manual refresh, caching, and initialization semantics; the naming does not authorize lifecycle changes or renaming component methods/third-party APIs.

## Record-Scoped Async Ownership

For record/list data-access composables, name the owner of fetched records, policy, loading/error state, pending edits, and save completion. Bind request publication to the record/query context that started it: an obsolete read must not publish data, policy, errors, or `finally` loader completion into a newer context. Check both identity and overlapping request ownership, including success, failure, and completion paths. Reuse the project's supported cancellation and stale-result mechanisms; do not prescribe a new queue, global cache, retry policy, or state library.

When cancellation is needed for the requested interaction and the existing transport supports it, prefer native `AbortController`/`AbortSignal` over a new cancellation abstraction or dependency. Do not add signal parameters or replace an adequate stale-result mechanism merely to gain cancellation; apply [Solve Real User Needs](../../rules/solve-real-user-needs.md). For reads that use cancellation, pass the signal through the existing API client and abort when selection clears or the consuming scope disposes. Retain current-controller and record/query ownership checks around data, policy, error, and `finally` publication: cancellation may arrive after completion or be unsupported by intermediate work. Treat an aborted read as cancellation without hiding ordinary failures from the current request.

Canceling an obsolete read does not roll back a committed mutation. A save for A finishing while B is displayed must settle A's accepted operation without overwriting B's model or recovery state. If edits/failures/retry must survive navigation, give them explicit record-scoped ownership under the existing editor lifetime/draft contract rather than silently dropping them or creating a parallel canonical model.

Verify controlled completion order: start A, select/query B, finish A last; deliver A's failure and `finally` while B is pending; finish save A after selecting B. Observe the displayed record, policy, loading/error state, and persisted outcome. Add failed-draft retry only when it is part of the accepted contract. A cited risk or a shared-guidance change is not proof of a reproduced or fixed downstream application defect.

### Per-Record UI Pending Flags

When IDs in a Set represent only row-pending booleans, prefer a descriptive ID-keyed boolean record and direct indexed UI reads instead of membership checks:

```typescript
const isReorderingByWorkflowStepId = reactive<Record<number, boolean>>({})

async function reorder(sourceId: number, destinationId: number) {
  isReorderingByWorkflowStepId[sourceId] = true
  isReorderingByWorkflowStepId[destinationId] = true
  try {
    await reorderWorkflowSteps(sourceId, destinationId)
  } finally {
    delete isReorderingByWorkflowStepId[sourceId]
    delete isReorderingByWorkflowStepId[destinationId]
  }
}
```

Bind the row's loader directly, for example `:loading="isReorderingByWorkflowStepId[workflowStep.id]"`; absent entries are not pending. Keep the existing operation ownership/concurrency contract and release both affected flags on success or failure. The example assumes the existing contract prevents overlapping owners for those rows; do not change that contract or introduce concurrency mechanisms solely for this representation. Sets remain appropriate for genuine collection membership and deduplication; no entries are required for every row.

## Utility-Style Scoped Presentation

Compose presentation from small utility-style classes inline in the template, including conditional class bindings, rather than semantic component/state classes bundling multiple styling decisions. Reuse suitable framework utilities when they preserve appearance; define missing custom utilities in the component's local `<style scoped>` block. This is Tailwind-like composition, not a request to install Tailwind or introduce global CSS.

Prefer avoiding authored `!important` overrides that fight framework utilities or child layout rules. Resolve conflicting declarations at the owning component; reuse suitable framework utilities and define missing small utility-style classes in the local `<style scoped>` block rather than escalating specificity. Preserve responsive behavior, theme values, and interactions. This is a preference within the affected scope, not a ban on framework-generated important declarations or a reason to remove an explicitly required local exception, install Tailwind, or rewrite unrelated CSS.

Preserve framework/theme values, appearance, interactions, accessibility state, and behavioral, drag, or test-selector hooks. The preference concerns presentation, not every class name. Apply it within the affected scope rather than renaming unrelated classes. The intent is easier Vuetify upgrades without adding another styling framework.

### Multiline Reactive Class Objects

Format class-object entries on separate lines, including single-entry objects: keep the opening brace, each entry, and the closing brace on separate lines. This readability preference is distinct from caching; a formatter accepting a compact expression does not establish the requested structure.

For a reactive derived class object, consider a named `computed` binding consumed directly by `:class`. With existing reactive `workflowStep` and `activeGroupStartOrder` refs:

```typescript
const revertButtonClasses = computed(() => {
  return {
    "mr-2": workflowStep.value.order < activeGroupStartOrder.value,
  }
})
```

```vue
<button type="button" :class="revertButtonClasses">Send Back</button>
```

Vue's [computed caching](https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods) reuses the result while its reactive dependencies remain unchanged, so an unrelated component render can reuse the object instead of constructing the inline map again. Changes to the step order or active-group boundary still update the classes. This is cached derivation, not prevention of all component renders or evidence that a render loop was reproduced or fixed. Keep getters free of side effects.

Static class strings, simple boolean conditions, and legitimate inline expressions remain available; do not turn every template expression into a computed value. The named map still composes individual utility classes at the existing control's direct binding, not a semantic styling wrapper. Preserve caller-owned outer spacing, control behavior, and stronger local conventions. Apply an accepted formatting or caching correction to equivalent bindings within the requested authoring/review scope, not unrelated templates or repositories.

### Static Template Separators

Prefer ordinary template text over a space-only interpolation when compiled rendering preserves the required separator.

Before:

```vue
<strong>{{ row.label }}:</strong>
{{ " " }}
<span class="white-space-pre-wrap">{{ row.value }}</span>
```

After:

```vue
<strong>{{ row.label }}: </strong>
<span class="white-space-pre-wrap">{{ row.value }}</span>
```

Check actual rendered separation and intentional multiline value formatting; source whitespace alone may be condensed or removed by compilation. Keep dynamic interpolations and intentional whitespace-sensitive rendering. Do not substitute layout margins for meaningful text whitespace or sweep unrelated templates.

### Caller-Owned Outer Layout

Keep outer spacing and parent-layout placement on a reusable component's invocation at the caller, rather than embedding context-specific margins or placement classes in the child's root. The child still owns intrinsic appearance and internal content layout, including appropriate root classes. Preserve its supported class/attribute forwarding, semantic root, accessibility, and interactions; this is not a ban on root styling.

For example, a reusable `WorkflowConcurrentEditAlert.vue` keeps its internal padding but does not embed `mt-7 mb-2`:

```vue
<template>
  <v-alert
    class="py-2"
    type="warning"
    >The workflow changed. Review the latest version before saving.</v-alert
  >
</template>
```

Each parent supplies spacing appropriate to its own title, neighboring fields, and layout. These are invocations in two different parent contexts, not sibling roots to add to the reusable child:

```vue
<WorkflowConcurrentEditAlert class="mt-2 mb-4" />
```

```vue
<WorkflowConcurrentEditAlert class="mb-2" />
```

During authoring and review, inspect equivalent callers within the affected change and preserve each context's appropriate spacing. Check the actual rendered title-to-component gap, space before following fields, and relevant responsive layouts; compilation or class names alone do not prove the spacing is correct. Reuse the project's supported utilities and stronger layout conventions. The example classes are illustrative, not universal pixel requirements or permission to move intrinsic child styling, add dependencies, or sweep unrelated components.

## Loading and Disabled State

Keep idle unavailability distinct from work in progress. For Vue/Vuetify button actions, use the supported disabled presentation when prerequisites such as a selection are missing, keeping the action labeled without a spinner. Reserve `:loading` for actual pending work rather than combining missing selection with busy state. Selecting an item enables an idle action; clearing it restores the idle unavailable state. Keep submission guards for both unavailable actions and duplicate requests: presentation is not protection against form submission, keyboard activation, or direct handler calls. Preserve genuine preparation/loading states and the component's supported contract; do not invent props or rewrite unrelated controls.

This example accepts the existing download operation as a prop. Reuse the project's established error boundary; the `finally` restores pending state on success or failure.

```vue
<template>
  <form @submit.prevent="downloadSelected">
    <v-btn
      type="submit"
      :loading="pending"
      :disabled="pending || selectedIds.length === 0"
      >Download</v-btn
    >
  </form>
</template>

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
```

## Workflow-Entry Gating on Known Prerequisites

When a creation or navigation action opens a workflow that cannot succeed without an already-known data prerequisite, gate the entry action instead of relying on a warning inside the destination. A late unavailable-data complaint is a dead end the user could have avoided; hide the entry action when hiding is the accepted UX, and keep the availability decision with the page that owns the entry action.

Evaluate the actual prerequisite, not an incidental selection or filtered search result. A New action that requires a parent record exists only when that record exists, independently of the current list filter or selection state:

```vue
<template>
  <v-btn
    v-if="props.fundingPeriodExists"
    :to="{ name: 'category-new' }"
    >New</v-btn
  >
</template>

<script setup lang="ts">
const props = defineProps<{
  fundingPeriodExists: boolean
}>()
</script>
```

Preserve required backend validation and legitimate direct-entry safety; UI gating is not authorization, and an empty state remains appropriate for optional or user-created data. During review, check both the unavailable and available prerequisite states without conflating entry gating with backend validation.

### Permission-Restricted Navigation and Access Presentation

Hide permission-restricted links from users without the required permission, using the existing permission owner. Keep three responsibilities distinct: navigation visibility avoids unavailable entry points; the accepted parent, route, or administration boundary owns access presentation and direct-entry handling; server authorization enforces access regardless of the UI. An admin-only navigation menu is not evidence that direct URL entry is protected.

For example, an existing navigation owner can gate its administration link:

```vue
<template>
  <v-list-item
    v-if="canAdministerCategories"
    :to="{ name: 'category-admin' }"
    title="Categories"
  />
</template>
```

When the accepted administration boundary already handles restricted access, its authorized child renders the existing editor directly:

```vue
<CategoryEditForm :category="category" />
```

Do not add another editor-level “Editing Not Allowed” panel solely to repeat that boundary's decision. Verify the actual boundary before removing a duplicate; retain necessary direct-entry protection, genuine record-specific checks and their accepted presentation, and server-side authorization. Keep [record availability](#record-availability-branches) separate from access ownership. During review, check permitted and restricted navigation, direct URL entry, and record-specific permissions; hidden links alone never prove authorization.
