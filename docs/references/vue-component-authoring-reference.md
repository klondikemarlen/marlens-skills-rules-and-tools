# Vue Component Authoring Reference

Use for Vue authoring and review. Project-local conventions and supported component contracts take precedence.

For coupled interaction corrections, fit-check the whole contract before the next gesture patch using [Interaction-Contract Activation](../workflows/outcome-first-planning-workflow.md#interaction-contract-activation) in the outcome-first planning workflow. Preserve adjacent accepted behavior; component structure and presentation guidance do not define which operations are allowed.

## One Template Root and Existing Components

Keep exactly one top-level template element per component, even where Vue permits fragments. Keep static footer controls and informational content inside the existing root rather than adding sibling roots. For drag containers, use the supported row selector or slot contract so only intended rows are draggable; static content must remain non-draggable. Preserve the existing layout and interaction behavior.

Before writing custom informational UI, inspect shared components and nearby usage. Reuse the stock component when it serves the need; keep specific component names project-local.

Before adding an inline resource picker, inspect neighboring domain inputs and reuse an existing resource-input component when it owns fetching, loading/error state, and autocomplete rendering. Compose the owning-domain input from the dashboard or form; keep model bindings and contextual hints in its parent. Preserve selection behavior, visibility-triggered loading, errors, and authorization. Follow local component contracts and do not add a wrapper for a trivial control.

## Utility-Style Scoped Presentation

Compose presentation from small utility-style classes inline in the template, including conditional class bindings, rather than semantic component/state classes bundling multiple styling decisions. Reuse suitable framework utilities when they preserve appearance; define missing custom utilities in the component's local `<style scoped>` block. This is Tailwind-like composition, not a request to install Tailwind or introduce global CSS.

Preserve framework/theme values, appearance, interactions, accessibility state, and behavioral, drag, or test-selector hooks. The preference concerns presentation, not every class name. Apply it within the affected scope rather than renaming unrelated classes. The intent is easier Vuetify upgrades without adding another styling framework.

## Loading and Disabled State

For Vue/Vuetify controls that support a loading binding, prefer `:loading` to `:disabled` for loading state. Keep `disabled` for independent reasons a control cannot be used; do not automatically add it alongside `loading`. Classify combined predicates by their actual meaning: preserve independent disabled conditions without duplicating loading-only predicates or assuming every missing-data check is a separate disabled reason. Follow the component's supported contract; do not invent a loading prop on a control that lacks one or rewrite unrelated controls.
