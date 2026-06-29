# Browser QA Workflow

Use when validating user-visible behavior in a browser.

## Process

1. Identify the exact user flow, setup state, and expected outcomes.
2. Prefer user-equivalent actions: navigate, click, type, upload, scroll, and wait for visible state.
3. Use backend shortcuts only when the user explicitly approves them or the task is not UI validation.
4. Verify labels and controls from the browser or source before writing QA notes.
5. Record exact scenarios exercised, visible outcomes, screenshots if useful, and blockers.

## Rules

- Do not print credentials or secrets.
- This package does not install Playwright. Use OMP's browser tool or the target project's documented Playwright setup; do not add Playwright solely for QA unless requested.
- Do not rely on logs or database state as proof of UI behavior.
- Keep screenshots out of the repository unless explicitly requested.
- If authentication or an external service blocks automation, state the blocker and what remains unverified.
