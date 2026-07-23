# Backward Reasoning Plan Template

Use this template for design-heavy requests before implementation. Keep the completed plan short enough to review in one pass.

## User Story

As a `<user or maintainer>`, I want `<capability>`, so that `<user-visible outcome>`.

## Gold

`<observable end state or invariant that proves success>`

## Non-Goals

- `<excluded behavior or integration>`
- `<excluded abstraction or future flexibility>`

## Constraints and Boundaries

- Compatibility: `<supported versions and migration boundary>`
- Security: `<authorization, secret, or data boundary>`
- Ownership: `<repository, package, or component owner>`
- Release: `<issue, branch, PR, version, and install requirements>`
- Local patterns: `<guidance and sibling assets that win>`

## Example Fit Matrix

| Example | Expected result | Rule exercised | Fit |
|---|---|---|---|
| Good: `<representative success>` | `<what must happen>` | `<rule>` | `<pass/fail>` |
| Bad / counter-example: `<representative failure>` | `<what must be rejected or preserved>` | `<boundary>` | `<pass/fail>` |
| Missing: `<ambiguous case>` | `<decision needed>` | `<risk>` | `<resolved/open>` |

## Project-Pattern Alignment

- [ ] Read project and package guidance.
- [ ] Read setup, test, contribution, and release instructions.
- [ ] Checked existing workflows, skills, references, templates, and rules.
- [ ] Checked callers, exports, and verifiers before changing a contract.
- Reused pattern: `<path and reason>`
- New asset required because: `<specific gap>`

## Decision Matrix

| Option | Gold fit | Complexity | Existing pattern | Decision |
|---|---|---|---|---|
| `<option A>` | `<fit>` | `<low/medium/high>` | `<reuse or gap>` | `<choose/reject>` |
| `<option B>` | `<fit>` | `<low/medium/high>` | `<reuse or gap>` | `<choose/reject>` |

## Chosen Tools and Rules

- Skills: `<entrypoints>`
- Workflows: `<authoritative procedures>`
- References: `<durable guardrails>`
- Templates: `<copyable output shapes>`
- Rules: `<always-on constraints>`

## Minimality and External Interface Policy

- Public inputs: `<bounded inputs>`
- Public outputs: `<bounded outputs>`
- Complexity ceiling: `<what this must not grow into>`
- Rejected flexibility: `<options intentionally not added>`

## Verification Gate

`<smallest runnable command or scenario>`

Proof artifact: `<test output, fixture, rendered result, or API state>`

## Residual Risk

`<named remaining risk, required experiment, or none>`

## Convergence Check

- [ ] Gold is observable.
- [ ] Good, bad, and missing examples have expected outcomes.
- [ ] Existing patterns and constraints are recorded.
- [ ] The chosen interface is bounded.
- [ ] Verification can fail on a plausible mistake.
- [ ] Residual risk is named.
