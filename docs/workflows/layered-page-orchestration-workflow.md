# Layered Page Orchestration Workflow

Use when a frontend page combines route dispatch, asynchronous availability data, and multiple concrete user flows.

## Intent

**WHY this workflow exists:** A route that both chooses a flow and renders every flow obscures ownership of loading, error, unavailable-data, and direct-entry behavior.

**WHAT this workflow produces:** A small resolver route when route dispatch is a distinct responsibility, plus concrete pages that remain safe for direct navigation.

**Decision Rules:**

- When the initial route only decides between concrete pathways from asynchronously loaded availability data, make it a small resolver route or page.
- A resolver loads only the data needed to choose a route, then uses route replacement so the transient entry route is not left in history.
- Every concrete page owns its direct-entry loading, error, invalid-parameter, and unavailable-data guards. A resolver is unmounted after redirect and cannot protect later navigation or deep links.
- After its guard succeeds, a concrete page should branch only over its actual UI modes, such as a selection list and selected-item preview.
- Do not add a resolver layer when it does not remove a distinct route-dispatch responsibility.

## Process

1. Identify the asynchronous data that determines the initial path separately from data and state owned by each concrete flow.
2. Make the initial route a resolver only when that decision is its own responsibility; render its loading and error states, then replace the route with the chosen concrete path.
3. Give each concrete path a page or top-level component with independent direct-entry guards for loading, errors, missing resources, invalid route/query input, and empty availability.
4. Keep successful concrete-page rendering to its real UI modes; place reusable presentation and actions below the page layer.
5. Verify resolver entry and direct entry to every concrete path, including loading, error, empty, invalid-query, back, cancel, and alternate-path behavior.

## Routing Example

```text
/create (resolver)
  loading -> render loading
  templates available -> replace /create/from-template
  no templates -> replace /create/manual

/create/from-template
  direct entry -> load templates and own error or zero-template fallback
  ready -> render template selection or selected-template preview
```

## Output Contract

State which route resolves the initial path, which concrete page owns each flow, and how every concrete page handles direct entry and unavailable data.