# Browser QA Workflow

Use when validating user-visible behavior in a browser.

## Browser Opening Modes

Distinguish a user-led opening from automated QA before choosing a browser or profile. Unless the task or project explicitly requires another engine, use ordinary Firefox for pages and handoffs involving the user. Prefer compatible, already-installed Playwright with Firefox for automation; Chrome/Chromium is acceptable for unattended headless agent-only work, not as a substitute user-facing window. This preference does not change OS browser associations or authorize dependency installation.

- **User-led review:** open the requested URL through regular Firefox, for example `firefox --new-window '<url>'` on Linux, without a profile override or private-window flag. Do not substitute a disposable WebDriver session, attach automation, copy cookies/profiles, or restart the personal browser. Report opening the URL separately from verifying authentication or application UI.
- **Automated QA/capture:** use an owned isolated profile, headless by default, with the project's maintained tooling. Discover a compatible installed Firefox route before declaring it unavailable; the Playwright preference does not require replacing a working project binding or installing another runtime. A visible login/MFA handoff remains separately agreed and isolated.

## Process

1. For automated QA, identify the exact user flow, setup state, and expected outcomes. Select the engine under [Browser Opening Modes](#browser-opening-modes); default to an isolated, headless automation instance, not the user's personal browser. Retain ownership of its process/profile for scoped cleanup.
   Before declaring control unavailable or switching engines, use [Browser Control Discovery](../references/browser-qa-techniques-reference.md#browser-control-discovery): inspect already-installed project tooling and Firefox/Geckodriver where applicable, prefer maintained bindings, and distinguish startup from actual control, authentication, and UI evidence.
   For local feature-worktree data preparation, follow [Reusable Preview Data](worktree-creation-workflow.md#reusable-preview-data) before browser interaction. A copied dataset or ready server is setup evidence, not UI verification.
2. Prefer user-equivalent actions: navigate, click, type, upload, scroll, and wait for visible state.
3. Use backend shortcuts only when the user explicitly approves them or the task is not UI validation.
4. Verify labels and controls from the browser or source before writing QA notes.
5. Record exact scenarios exercised, visible outcomes, screenshots if useful, and blockers.
6. For PR screenshot capture or upload, follow [Upload Pull Request Screenshots](upload-pr-screenshots-workflow.md), starting with its capture preflight for the requested browser, application access/data, and supported image capture. Then use its separate GitHub authentication, installed batch upload, saved-body/rendered-placement checks, and owned-session cleanup. Screenshots remain optional when project-local guidance makes them optional; do not invent a screenshot merge gate.

## Rules

- Do not print credentials or secrets.
- This package does not install browser automation dependencies. Use OMP's browser tool or the target project's documented browser QA setup; do not add browser automation solely for QA unless requested.
- A disposable Firefox profile does not inherit profile-local add-ons. Before a user handoff that expects OMP Send Context, disclose whether that integration is available; a Firefox executable or native-host install is not add-on-to-OMP delivery proof. The supported noninterfering native-host consent/start path remains an open dependency in [#860](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/issues/860), not a solved setup recipe. This guidance does not authorize extension installation, personal-profile reuse, shared-manifest redirection, or consent bypass; the current GNOME companion is not a Firefox fallback.
- For automated QA/capture startup and manual GitHub sign-in, follow the [Default Browser and Login Handoff](upload-pr-screenshots-workflow.md#default-browser-and-login-handoff): headless owned automation, a temporary isolated login/MFA window when needed, then headless continuation. Never restart or terminate the personal browser, kill by browser name, or infer authorization to control it from “normal Firefox.” Explicit existing-session requests retain the [Interactive Sign-In Preference](upload-pr-screenshots-workflow.md#interactive-sign-in-preference) exception and project-managed QA requirements.
- A Firefox engine request alone does not authorize a visible automation window. Before a necessary visible login/MFA handoff, explain the separate window and obtain agreement; denial, cancellation, or an unavailable handoff leaves the affected phase blocked without a visible launch. Leave window switching to the user. Preserve explicitly requested visible QA and return routine automation to headless mode after authentication.
- For a browser handoff, use [Authorization Preview](../references/authorization-preview-reference.md) to show structured context before an explicit **Continue** opens the supplied HTTPS destination. The page explains the redirect; it does not certify destination safety or authorize the described operation. Select its user-facing browser under [Browser Opening Modes](#browser-opening-modes); the OS-default opener may select another browser. This is not permission to attach automation to a personal profile. Use `--demo` to inspect the experience with sample data and no external redirect.
- Do not rely on logs or database state as proof of UI behavior.
- When interaction input handling changes, exercise a representative real sensor path for each affected supported input class, including successful release, cancellation, and invalid release. Observe the consumer-visible result and no-save cancel/invalid behavior. Synthetic event-only checks or mouse events renamed as touch are not real touch/fallback evidence; report an unavailable sensor as unverified, not passed. Follow the existing [Interaction-Contract Activation](outcome-first-planning-workflow.md#interaction-contract-activation); do not expand to an exhaustive device matrix or unrelated input capabilities.
- Before the first screenshot, select one private run directory through [Screenshot Staging](upload-pr-screenshots-workflow.md#screenshot-staging): ordinary accessible host `/tmp` or the verified, OS-managed Firefox Snap runtime route. Keep all captures and variants together, verify browser file access, and follow owned-directory cleanup; do not silently use persistent Downloads staging. Keep screenshots out of the repository unless explicitly requested.
- If authentication or an external service blocks automation, state the exact blocker and what remains unverified without including local paths or profile/session details.
- Before expanding scenarios that claim real-authenticated coverage, follow the canonical [Real-Authentication E2E Preflight](testing-instructions-workflow.md#real-authentication-e2e-preflight); report smoke/mock and authenticated coverage separately for each environment.
- Keep personal usernames, absolute home paths, local browser profile/session paths, credentials/tokens, and workstation-specific locations out of all published GitHub QA records, including issue/review/QA comments and screenshot contents, filenames, and metadata. Keep local operational paths and profile/session details in local notes only; legitimate repository-relative source/test paths and reviewer-facing app routes may remain.
- Before publishing a screenshot, inspect its contents and use a neutral filename and reviewer-facing caption. For screenshot upload and public-safe examples, follow [Upload Pull Request Screenshots](upload-pr-screenshots-workflow.md).

## Disputed Interaction Behavior

When an interaction claim is disputed, prefer a focused experiment in the running interface using the relevant input before asserting library behavior or recommending a dependency upgrade. Reuse the project's ready UI harness when available; do not require unrelated end-to-end infrastructure or promise that runtime investigation is always faster. Preserve the task's browser-control authorization and setup boundaries.

Observe the actual outcome for the claimed path: pointer click, keyboard activation, and form submission are different paths. For a loading button, test the disputed gesture while work is pending and observe whether the action, navigation, or submission occurs. A CSS pointer restriction can affect clicks without establishing keyboard or form behavior; a programmatic handler call does not prove a browser interaction.

Use source inspection alongside or after the experiment to explain the result, including component logic, CSS, browser semantics, and the installed version. Report observed paths separately from source-derived conclusions and untested paths. If the interface or relevant input is unavailable, state that limit and keep the behavioral claim unverified rather than recommending an upgrade from incomplete evidence. This does not require removing submission guards or changing dependencies.

## External Protocol Links

- Before clicking a link that may dispatch outside the browser, inspect its resolved `href` and decode encoded destination values for inspection only. Identify `mailto:`, `tel:`, and custom schemes without navigating to discover the destination.
- Treat an external protocol launch as a side effect requiring explicit QA scope. A visible link or headless session does not make launching a desktop application routine UI validation.
- An automated click requires a supported interception/blocking mechanism that the current run has verified prevents the external launch. Installing a page-level override or observing an empty capture alone is not proof of prevention.
- If prevention cannot be verified, stop before clicking and report the blocker and unverified behavior. Non-launching destination inspection is not end-to-end click validation; do not attribute an interception failure to a browser-runtime cause without separate evidence.
