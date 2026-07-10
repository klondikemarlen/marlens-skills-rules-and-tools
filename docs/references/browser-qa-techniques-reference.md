# Browser QA Techniques Reference

Use this reference with browser QA workflows.

## Visible Behavior First

Validate behavior with user-equivalent browser actions when the claim is user-facing. Click, type, navigate, upload, scroll, and inspect visible state before falling back to internal evidence.

## Authentication

- Use existing safe test accounts or visible sessions.
- Never print credentials in summaries, PR comments, screenshots, or logs.
- If SSO or an external auth provider blocks automation, ask for user assistance or report the blocker.

## Flaky UI Controls

- Wait for loading states to settle before retrying.
- Confirm whether controls are buttons, links, or custom widgets before deciding an action failed.
- For async search inputs, type a specific search term, wait for options, select an option, and commit the selection before saving.

## Screenshots

- Capture stable reviewer-facing states.
- Store temporary files outside the repository.
- Redact sensitive data.

- When screenshots go in a PR body, use `Description`, the local app URL when applicable, then the GitHub `<img ...>` tag or an exact-path manual-upload placeholder.