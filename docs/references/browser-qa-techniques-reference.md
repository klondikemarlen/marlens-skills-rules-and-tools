# Browser QA Techniques Reference

Use this reference with browser QA workflows.

For local scenario-data setup, use [Reusable Preview Data](../workflows/worktree-creation-workflow.md#reusable-preview-data). That workflow owns source preparation, safe copying, feature-only schema changes, and isolated fallbacks; the techniques below verify the browser surface afterward.

## Visible Behavior First

Validate behavior with user-equivalent browser actions when the claim is user-facing. Click, type, navigate, upload, scroll, and inspect visible state before falling back to internal evidence.

## Browser Control Discovery

Before declaring browser automation unavailable or substituting an engine:

1. Read the project's QA/setup wrapper and installed automation dependencies. Select the engine and launch purpose under [Browser Opening Modes](../workflows/browser-qa-workflow.md#browser-opening-modes), then prefer the project's maintained binding or helper. Where compatible Playwright and its supported Firefox build are already installed, prefer that Firefox route. [Playwright's Firefox requires patches](https://playwright.dev/docs/browsers#firefox): the ordinary branded/system Firefox is not a supported substitute for its browser build. Do not install another browser/runtime merely to satisfy the preference; retain a working installed Firefox binding such as Geckodriver when appropriate. OMP's managed Chromium/CDP failure does not establish Firefox availability or controllability; remembered tool names are discovery leads, not proof that a runtime exists.
2. For requested Firefox, check the already-installed executables without installing anything:

   ```bash
   command -v firefox
   firefox --version
   command -v geckodriver
   geckodriver --version
   ```

   Also inspect the project's installed binding/helper support. A Firefox executable proves only browser availability; require an actual control session and user-equivalent interaction before claiming automation works. If no installed route is available, name the missing executable, compatible binding, or control connection instead of reporting a generic Chromium-only blocker.

3. Prefer a maintained installed Firefox binding/helper. If Geckodriver is installed but language bindings are absent, a bounded disposable probe using standard WebDriver HTTP commands is valid; do not install Selenium bindings, create a persistent runner, or add a second automation runtime solely for QA.

### Installed Puppeteer Firefox Probe

From the project's existing Node package, inspect `npm ls puppeteer puppeteer-core --depth=0`, the installed Node version, and that binding's Firefox support and launch options. Use an already-installed compatible binding; do not install another runtime or change the project's browser defaults. The example below uses `puppeteer`; an existing `puppeteer-core` installation may supply the same supported API. Check its actual installed version rather than assuming either package exists.

Select `browser: "firefox"` and `protocol: "webDriverBiDi"` explicitly, with an observed installed Firefox `executablePath`. A default Chrome configuration, skipped Firefox downloads, or an empty downloaded-Firefox cache does not rule out this route. An arbitrary system Firefox is not guaranteed compatible: prove startup and interaction with the installed pair. See Puppeteer's [launch options](https://pptr.dev/api/puppeteer.launchoptions) and [connection options](https://pptr.dev/api/puppeteer.connectoptions); the installed version's API remains authoritative.

Before running this disposable snippet, supply the observed `firefoxExecutable`, a private browser-visible `profileParent` outside the repository, and the screenshot workflow's owned `screenshotDirectory`. Supply the authorized `qaUrl`, actual control selectors, `inputText`, and exact `expectedText` from the QA scenario. Use a disposable loopback fixture for control-only smoke, not as proof of authenticated application coverage.

```js
import { once } from "node:events"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"

import puppeteer from "puppeteer"

const profileRoot = await mkdtemp(join(profileParent, "firefox-qa-"))
let browser

try {
  browser = await puppeteer.launch({
    browser: "firefox",
    protocol: "webDriverBiDi",
    executablePath: firefoxExecutable,
    headless: true,
    userDataDir: profileRoot,
    args: ["--no-remote"],
  })
  const page = (await browser.pages())[0] ?? (await browser.newPage())
  await page.goto(qaUrl)
  await page.type(inputSelector, inputText)
  await page.click(submitSelector)
  await page.waitForFunction(
    (selector, text) => document.querySelector(selector)?.textContent === text,
    {},
    resultSelector,
    expectedText
  )
  await page.screenshot({
    path: join(screenshotDirectory, "firefox-result.png"),
  })
} finally {
  const ownedProcess = browser?.process()
  let exited
  if (ownedProcess && ownedProcess.exitCode === null && ownedProcess.signalCode === null) {
    exited = once(ownedProcess, "exit")
  }

  await browser?.close()
  await exited
  await rm(profileRoot, { recursive: true, force: true })
}
```

Honor an explicitly requested visible mode instead of `headless: true`. For sandboxed Firefox, use an owned profile parent the browser can read, such as a private directory under Downloads; host `/tmp` may not be shared. Retain the returned browser/process handle, confirm process exit before deleting its profile, and inspect the PNG for the expected visible state and sensitive content. If close or exit confirmation fails, retain the profile and diagnose only the owned process; never kill browsers by name or adopt personal profiles, cookies, or sessions.

Report startup, native control/interaction, application authentication, and UI/screenshot inspection separately. A fixture PASS does not establish sign-in or application readiness. If package resolution fails, the binding lacks compatible Firefox/BiDi support, or launch cannot control the observed binary, name that exact prerequisite and stop this route without downloads or relaxed authentication protections. Retain the raw WebDriver fallback below when no suitable maintained binding is installed.

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

### Page-Realm Diagnostics

Do not infer broken application authentication from an imported module in an automation sandbox alone. In Firefox 158.0 with Geckodriver 0.37.1, a WebDriver script's direct Vite-module import produced a different singleton from the page's installed authentication plugin. This is a version-bound observation, not a guarantee about every Firefox/binding pair; Mozilla documents separate [script sandboxes](https://firefox-source-docs.mozilla.org/python/marionette_driver.html#marionette_driver.marionette.Marionette.execute_script).

When internal diagnosis is necessary in an owned disposable browser, compare against the page's actual installed instance. A bounded page-owned `<script type="module">` can import the existing same-origin module and transfer only sanitized JSON through a temporary hidden DOM result element for WebDriver to read. Remove both probe elements afterward. Respect CSP, same-origin restrictions, and authentication; do not expose tokens, substitute authentication state, enable privileged browser access, or treat this internal probe as user-visible QA.

## Authentication

- Use existing safe test accounts or visible sessions.
- Never print credentials in summaries, PR comments, screenshots, or logs.
- If SSO or an external auth provider blocks automation, ask for user assistance or report the blocker.

### Public Origins and Auth0 Allowlists

Behind a reverse proxy, derive the browser origin from the opened page's scheme, hostname, and port, not an upstream listener. An API listening on `localhost:3000` does not make that a browser origin; `localhost:8080` applies only when the frontend is actually opened there. Preserve existing direct-localhost entries still used by other development routes.

Use the configured application's actual flow and [Auth0 Application Settings](https://auth0.com/docs/get-started/applications/application-settings), rather than duplicating URLs across all four fields:

- **Allowed Callback URLs:** the actual post-authentication redirect URLs, including required paths.
- **Allowed Logout URLs:** the actual allowed post-logout return URLs for the selected logout flow.
- **Allowed Web Origins:** browser origins required by the selected authorization flow, without callback paths, queries, or fragments.
- **Allowed Origins (CORS):** origins requiring cross-origin requests to Auth0. Auth0's [Configure CORS](https://auth0.com/docs/get-started/applications/set-up-cors) says an origin already approved through Allowed Callback URLs need not also be added here.

Keep entries minimal and flow-specific; reserve wildcard subdomains for development, not production. Diagnosing an allowlist mismatch does not authorize changing provider settings or weakening authentication protections.

## Flaky UI Controls

- Wait for loading states to settle before retrying.
- Confirm whether controls are buttons, links, or custom widgets before deciding an action failed.
- For async search inputs, type a specific search term, wait for options, select an option, and commit the selection before saving.
- For transient select/autocomplete menus, open the visible picker, take a fresh accessibility snapshot while the menu is open, and select its clickable parent option row/card from that snapshot, not a child paragraph. Refresh references after rerenders; avoid generated input IDs and stale ARIA references. Custom-rendered options may be generic clickable containers rather than semantic `option` nodes; Vuetify's [autocomplete source](https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/components/VAutocomplete/VAutocomplete.tsx) also filters selected values when `hide-selected` applies. Confirm the committed selection and resulting saved value; typed display text or a page-JavaScript value assignment is not selection proof.

### Binding-Specific Locators

Check the installed binding's API rather than translating locator syntax by name. Puppeteer's [`Locator.filter(predicate)`](https://pptr.dev/api/puppeteer.locator.filter) adds a retrying expectation on the located value; it is not Playwright's [collection filtering](https://playwright.dev/docs/locators#filtering-locators). In inspected Puppeteer Core 25.3.0 source (`NodeLocator._wait` and `FilteredLocator._wait`), a CSS locator delegates to `waitForSelector` and filters that returned handle, not every CSS match. A broad dialog-button selector can repeatedly find Cancel and time out while OK is present. Use a unique supported CSS/text/role selector or enumerate handles and select explicitly; verify this behavior against the version in use. Distinguish an actual navigation control from a similarly linked or disabled breadcrumb, then observe the resulting route/state.

## Screenshots

- Capture stable reviewer-facing states.
- For a required capture size, measure the page's actual `innerWidth`/`innerHeight` and the saved image's pixel dimensions, not only WebDriver's outer window rectangle. The [layout viewport](https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight) differs from the whole browser window; screenshot mode and device scale can also affect output. Adjust using the active runtime's measured difference and remeasure; never hard-code a browser-chrome offset or claim Full HD from launch dimensions alone.
- Store temporary files outside the repository.
- Redact sensitive data.

- When screenshots go in a PR body, use `Description`, the local app URL when applicable, then the GitHub `<img ...>` tag or an exact-path manual-upload placeholder.
