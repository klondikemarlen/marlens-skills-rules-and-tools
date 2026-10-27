# Browser QA Workflow

Use when validating user-visible behavior in a browser.

## Process

1. Identify the exact user flow, setup state, and expected outcomes. Select the requested browser engine and mode before launch; default to an isolated, headless automation instance, not the user's personal browser. Retain ownership of its process/profile for scoped cleanup.
   Before declaring control unavailable or switching engines, use [Browser Control Discovery](../../docs/references/browser-qa-techniques-reference.md#browser-control-discovery): inspect already-installed project tooling and Firefox/Geckodriver where applicable, prefer maintained bindings, and distinguish startup from actual control, authentication, and UI evidence.
2. Prefer user-equivalent actions: navigate, click, type, upload, scroll, and wait for visible state.
3. Use backend shortcuts only when the user explicitly approves them or the task is not UI validation.
4. Verify labels and controls from the browser or source before writing QA notes.
5. Record exact scenarios exercised, visible outcomes, screenshots if useful, and blockers.
6. For PR screenshot capture or upload, follow [Upload Pull Request Screenshots](../../docs/workflows/upload-pr-screenshots-workflow.md), starting with its capture preflight for the requested browser, application access/data, and supported image capture. Then use its separate GitHub authentication, installed batch upload, saved-body/rendered-placement checks, and owned-session cleanup. Screenshots remain optional when project-local guidance makes them optional; do not invent a screenshot merge gate.

## Rules

- Do not print credentials or secrets.
- This package does not install browser automation dependencies. Use OMP's browser tool or the target project's documented browser QA setup; do not add browser automation solely for QA unless requested.
- For browser startup and manual GitHub sign-in, follow the [Default Browser and Login Handoff](../../docs/workflows/upload-pr-screenshots-workflow.md#default-browser-and-login-handoff): headless owned automation, a temporary isolated login/MFA window when needed, then headless continuation. Never restart or terminate the personal browser, kill by browser name, or infer personal-profile reuse from “normal Firefox.” Explicit existing-session requests retain the [Interactive Sign-In Preference](../../docs/workflows/upload-pr-screenshots-workflow.md#interactive-sign-in-preference) exception and project-managed QA requirements.
- A Firefox engine request alone does not authorize a visible window. Before a necessary visible login/MFA handoff, explain the separate window and obtain agreement; denial, cancellation, or an unavailable handoff leaves the affected phase blocked without a visible launch. Leave window switching to the user. Preserve explicitly requested visible QA and return routine automation to headless mode after authentication.
- For an authorized npm sign-in or publication handoff, use [npm Authorization Preview](../../docs/references/npm-authorization-preview-reference.md) to show structured context before an explicit **Continue to npm**. This non-automated handoff uses the normal-browser opener; it is not permission to attach browser automation to a personal profile. The helper does not authenticate, approve, or publish.
- Do not rely on logs or database state as proof of UI behavior.
- When interaction input handling changes, exercise a representative real sensor path for each affected supported input class, including successful release, cancellation, and invalid release. Observe the consumer-visible result and no-save cancel/invalid behavior. Synthetic event-only checks or mouse events renamed as touch are not real touch/fallback evidence; report an unavailable sensor as unverified, not passed. Follow the existing [Interaction-Contract Activation](../outcome-first-planning/workflow.md#interaction-contract-activation); do not expand to an exhaustive device matrix or unrelated input capabilities.
- Before the first screenshot, allocate one private run directory under `/tmp/omp-pr-screenshots/` and keep all captures and image variants there. Follow [Screenshot Staging](../../docs/workflows/upload-pr-screenshots-workflow.md#screenshot-staging) for capture-tool output relocation, the scoped sandbox exception, and owned-directory cleanup. Keep screenshots out of the repository unless explicitly requested.
- If authentication or an external service blocks automation, state the exact blocker and what remains unverified without including local paths or profile/session details.
- Before expanding scenarios that claim real-authenticated coverage, follow the canonical [Real-Authentication E2E Preflight](../testing-instructions/workflow.md#real-authentication-e2e-preflight); report smoke/mock and authenticated coverage separately for each environment.
- Keep personal usernames, absolute home paths, local browser profile/session paths, credentials/tokens, and workstation-specific locations out of all published GitHub QA records, including issue/review/QA comments and screenshot contents, filenames, and metadata. Keep local operational paths and profile/session details in local notes only; legitimate repository-relative source/test paths and reviewer-facing app routes may remain.
- Before publishing a screenshot, inspect its contents and use a neutral filename and reviewer-facing caption. For screenshot upload and public-safe examples, follow [Upload Pull Request Screenshots](../../docs/workflows/upload-pr-screenshots-workflow.md).

## External Protocol Links

- Before clicking a link that may dispatch outside the browser, inspect its resolved `href` and decode encoded destination values for inspection only. Identify `mailto:`, `tel:`, and custom schemes without navigating to discover the destination.
- Treat an external protocol launch as a side effect requiring explicit QA scope. A visible link or headless session does not make launching a desktop application routine UI validation.
- An automated click requires a supported interception/blocking mechanism that the current run has verified prevents the external launch. Installing a page-level override or observing an empty capture alone is not proof of prevention.
- If prevention cannot be verified, stop before clicking and report the blocker and unverified behavior. Non-launching destination inspection is not end-to-end click validation; do not attribute an interception failure to a browser-runtime cause without separate evidence.
