# Vue Component Authoring Reference

Use for Vue authoring and review. Project-local conventions and supported component contracts take precedence.

For coupled interaction corrections, fit-check the whole contract before the next gesture patch using [Interaction-Contract Activation](../workflows/outcome-first-planning-workflow.md#interaction-contract-activation) in the outcome-first planning workflow. Preserve adjacent accepted behavior; component structure and presentation guidance do not define which operations are allowed.

## One Template Root and Existing Components

Keep exactly one top-level template element per component, even where Vue permits fragments. Keep static footer controls and informational content inside the existing root rather than adding sibling roots. For drag containers, use the supported row selector or slot contract so only intended rows are draggable; static content must remain non-draggable. Preserve the existing layout and interaction behavior.

Before writing custom informational UI, inspect shared components and nearby usage. Reuse the stock component when it serves the need; keep specific component names project-local.

Name a component with a suffix that matches its semantic root element or component type: for example, a `div` root uses `Div`, and a `v-card` root uses `Card`. Inspect nearby app conventions for other root types rather than inventing a universal suffix mapping. When applying this convention to an affected component, update its name, file name, imports, and template consumers together; avoid unrelated renames or behavior changes.

Before adding an inline resource picker, inspect neighboring domain inputs and reuse an existing resource-input component when it owns fetching, loading/error state, and autocomplete rendering. Compose the owning-domain input from the dashboard or form; keep model bindings and contextual hints in its parent. Preserve selection behavior, visibility-triggered loading, errors, and authorization. Follow local component contracts and do not add a wrapper for a trivial control.

When one field's value updates another field within a particular form or card, keep that dependency in a watcher owned by that form or card. Keep a shared picker focused on selection rather than adding form-specific behavior or events to it. Follow local reactive patterns; do not rewrite unrelated shared components.

## Model-Mirror Composables and Editor Ownership

Inspect established sibling composables and any user-designated architecture before extending a `use` module. When singular/plural data-access composables mirror the model layer, retain those mirrors while the underlying model exists, even with zero current callers. An editor-specific wrapper does not replace the model mirror. Remove obsolete mirrors when their model is deleted; do not use this exception to preserve arbitrary dead code or invent speculative wrappers.

Keep component-specific editing workflows—drafts, queued writes, reconciliation, editor errors, and retry feedback—with the owning editor component, rather than accumulating them in a model-access composable. Preserve genuine shared reactive/lifecycle composables and explicit project ownership contracts; a function starting with `use` is not evidence that it owns every editing operation.

Consumers use the composable's returned reactive record/collection refs as the model source. Do not copy them into a parallel record map and watch fetches to merge fields or revision counters. Keep genuine pending commands and failure feedback with the editor. If accepted edits must survive navigation, inspect editor lifetime and supported framework retention before adding parallel model ownership; preserve the accepted save/navigation guarantee. An explicitly contracted detached draft remains valid; neither `KeepAlive` nor a particular draft-storage design is mandatory.

## Writable State and Reset Operations

Follow the established reactive-state plus `...toRefs(state)` return pattern for ordinary writable composable state. Prefer caller-side `error.value = capturedError` over `readonly(error)` plus a trivial `setError` wrapper when no accepted invariant requires the action. Keep meaningful operations, including reset and actions that actually protect invariants; this is not a blanket removal of store actions or permission to rewrite unrelated composables.

When an operation restores initial/empty state and siblings call that operation `reset`, use `reset` rather than a specialized synonym such as `clearError`. Inspect sibling contracts first and retain names for genuinely different operations. Apply accepted API changes to affected callers and tests together, preserving behavior and required invariant boundaries.

## Record-Scoped Async Ownership

For record/list data-access composables, name the owner of fetched records, policy, loading/error state, pending edits, and save completion. Bind request publication to the record/query context that started it: an obsolete read must not publish data, policy, errors, or `finally` loader completion into a newer context. Check both identity and overlapping request ownership, including success, failure, and completion paths. Reuse the project's supported cancellation and stale-result mechanisms; do not prescribe a new queue, global cache, retry policy, or state library.

Canceling an obsolete read does not roll back a committed mutation. A save for A finishing while B is displayed must settle A's accepted operation without overwriting B's model or recovery state. If edits/failures/retry must survive navigation, give them explicit record-scoped ownership under the existing editor lifetime/draft contract rather than silently dropping them or creating a parallel canonical model.

Verify controlled completion order: start A, select/query B, finish A last; deliver A's failure and `finally` while B is pending; finish save A after selecting B. Observe the displayed record, policy, loading/error state, and persisted outcome. Add failed-draft retry only when it is part of the accepted contract. A cited risk or a shared-guidance change is not proof of a reproduced or fixed downstream application defect.

## Utility-Style Scoped Presentation

Compose presentation from small utility-style classes inline in the template, including conditional class bindings, rather than semantic component/state classes bundling multiple styling decisions. Reuse suitable framework utilities when they preserve appearance; define missing custom utilities in the component's local `<style scoped>` block. This is Tailwind-like composition, not a request to install Tailwind or introduce global CSS.

Preserve framework/theme values, appearance, interactions, accessibility state, and behavioral, drag, or test-selector hooks. The preference concerns presentation, not every class name. Apply it within the affected scope rather than renaming unrelated classes. The intent is easier Vuetify upgrades without adding another styling framework.

## Loading and Disabled State

For Vue/Vuetify controls that support a loading binding, prefer `:loading` to `:disabled` for loading state. Keep `disabled` for independent reasons a control cannot be used; do not automatically add it alongside `loading`. Classify combined predicates by their actual meaning: preserve independent disabled conditions without duplicating loading-only predicates or assuming every missing-data check is a separate disabled reason. Follow the component's supported contract; do not invent a loading prop on a control that lacks one or rewrite unrelated controls.
