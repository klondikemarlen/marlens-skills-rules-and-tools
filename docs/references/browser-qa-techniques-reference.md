# Browser QA Techniques Reference

Use this reference with browser QA workflows.

## Visible Behavior First

Validate behavior with user-equivalent browser actions when the claim is user-facing. Click, type, navigate, upload, scroll, and inspect visible state before falling back to internal evidence.

## Browser Control Discovery

Before declaring browser automation unavailable or substituting an engine:

1. Read the project's QA/setup wrapper and installed automation dependencies. Prefer its maintained binding or helper with the requested engine. OMP's managed Chromium/CDP failure does not establish Firefox availability or controllability; remembered tool names are discovery leads, not proof that a runtime exists.
2. For requested Firefox, check the already-installed executables without installing anything:

   ```bash
   command -v firefox
   firefox --version
   command -v geckodriver
   geckodriver --version
   ```

   Also inspect the project's installed binding/helper support. A Firefox executable proves only browser availability; require an actual control session and user-equivalent interaction before claiming automation works. If no installed route is available, name the missing executable, compatible binding, or control connection instead of reporting a generic Chromium-only blocker.

3. Prefer a maintained installed Firefox binding/helper. If Geckodriver is installed but language bindings are absent, a bounded disposable probe using standard WebDriver HTTP commands is valid; do not install Selenium bindings, create a persistent runner, or add a second automation runtime solely for QA.

### Disposable Firefox WebDriver Probe

Use this only for the authorized QA surface. Allocate a unique private, agent-owned profile root outside the repository, retain the driver process handle/PID, and keep screenshots in the screenshot workflow's separate owned run directory. For sandboxed Firefox, choose a browser-visible owned profile root such as a unique directory under Downloads; do not copy an existing personal profile or guess a Snap revision.

Start the installed driver on loopback with an allocated port:

```bash
geckodriver --host 127.0.0.1 --port 0 --profile-root "<owned browser-visible profile root>"
```

Read the actual listening address from that owned process's output; do not guess a port or adopt an unrelated server. Keep the endpoint local. Loopback limits exposure but is not a permission boundary: the driver controls its browser with the signed-in account's normal permissions. Do not enable broad origins, system access, or `--connect-existing` as a workaround.

Use a standard-library HTTP client to check `GET /status`, then create a session with `POST /session`:

```json
{
  "capabilities": {
    "alwaysMatch": {
      "browserName": "firefox",
      "moz:firefoxOptions": {
        "args": ["-headless"]
      }
    }
  }
}
```

Honor an explicit visible-browser requirement instead of adding `-headless`. Let the driver discover Firefox or supply only an observed compatible installed binary if discovery fails. Verify the returned Firefox capabilities and retain the exact session ID and owned profile; readiness of the HTTP server alone is not browser control.

Navigate through `POST /session/<id>/url`, locate controls through `POST /session/<id>/element`, and use the returned element's standard click/send-keys commands for user-equivalent actions. Read an expected visible state or value afterward. For image evidence, decode `GET /session/<id>/screenshot` into the owned screenshot directory and inspect the image. Do not replace user actions with DOM mutation or confuse a fixture smoke with authenticated application coverage.

In `finally`, delete only the owned session with `DELETE /session/<id>`, stop and await only the owned driver/browser processes, then remove only their owned profile root. Preserve valid screenshots separately when later upload is blocked. Never kill browsers by name, restart the personal browser to add debugging, reuse personal profiles implicitly, or copy cookies/sessions.

Keep four outcomes separate: executable startup, control/interaction, application authentication, and visible UI/screenshot evidence. Load only task-authorized test-account credentials through the documented project setup without printing values or dumping environment/configuration. CAPTCHA, MFA, and provider protections remain real boundaries: ask for supported user assistance or report the exact blocker; do not bypass or weaken them. A successful Firefox run does not guarantee a later authentication challenge will be absent.

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
