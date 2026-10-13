# Browser QA Workflow

Use when validating user-visible behavior in a browser.

## Process

1. Identify the exact user flow, setup state, and expected outcomes.
2. Prefer user-equivalent actions: navigate, click, type, upload, scroll, and wait for visible state.
3. Use backend shortcuts only when the user explicitly approves them or the task is not UI validation.
4. Verify labels and controls from the browser or source before writing QA notes.
5. Record exact scenarios exercised, visible outcomes, screenshots if useful, and blockers.
6. When captured screenshots are intended for a PR, follow [Upload Pull Request Screenshots](upload-pr-screenshots-workflow.md) for authentication/session discovery, installed batch upload, saved-body/rendered-placement checks, and owned-session cleanup. Screenshots remain optional when project-local guidance makes them optional.

## Rules

- Do not print credentials or secrets.
- This package does not install browser automation dependencies. Use OMP's browser tool or the target project's documented browser QA setup; do not add browser automation solely for QA unless requested.
- Do not rely on logs or database state as proof of UI behavior.
- Keep screenshots out of the repository unless explicitly requested.
- If authentication or an external service blocks automation, state the exact blocker and what remains unverified without including local paths or profile/session details.
- Keep personal usernames, absolute home paths, local browser profile/session paths, credentials/tokens, and workstation-specific locations out of all published GitHub QA records, including issue/review/QA comments and screenshot contents, filenames, and metadata. Keep local operational paths and profile/session details in local notes only; legitimate repository-relative source/test paths and reviewer-facing app routes may remain.
- Before publishing a screenshot, inspect its contents and use a neutral filename and reviewer-facing caption. For screenshot upload and public-safe examples, follow [Upload Pull Request Screenshots](upload-pr-screenshots-workflow.md).
