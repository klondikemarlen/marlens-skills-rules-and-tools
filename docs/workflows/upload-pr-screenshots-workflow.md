# Upload Pull Request Screenshots Workflow

Use when a pull request needs GitHub-uploaded screenshots or visual evidence.

For an authorized Firefox upload to a PR description, prepare the captures in steps 1–3, then use [Firefox GitHub Login and Upload](#firefox-github-login-and-upload). That command owns the remaining publication steps. Other supported targets or browsers can use [Browser Helper](#browser-helper).

## Process

1. Identify reviewer-relevant UI states from the diff or PR body. Follow project-local guidance on whether screenshots are required or optional, and use **Capture Preflight** before opening a browser or preparing data.
2. Before capturing, allocate the run directory in **Screenshot Staging** below. Capture the actual application in the requested browser at stable states; avoid transient spinners, snackbars, or partially loaded screens.
3. Keep every image for the run in that directory, use it as the default upload source, and verify the exact selected upload files are readable. Use only the scoped sandbox exception below when necessary; do not scatter working copies.
4. Check GitHub browser authentication before declaring screenshots upload-ready; a signed-in `gh` CLI does not authenticate the browser. Follow **Default Browser and Login Handoff** below; selected Firefox uses **Firefox GitHub Login and Upload**, never the Chromium-only bootstrap. Use **Interactive Sign-In Preference** only for explicitly requested existing-session reuse.
5. Add one stable HTML-comment placeholder per screenshot to the existing PR body, immediately after its caption and reviewer-facing app route. Preserve surrounding text and existing images, and keep the exact placeholder-bearing target Markdown available locally for read-only recovery; do not publish the snapshot or QA logs.
6. Obtain the exact PR-body `#issue-…` fragment from the page. Do not substitute a new-comment composer or an `#issuecomment-…` reply. Inspect the existing PR body editor—not the temporary new-comment composer—and identify its textarea selector and scoped file input selector.
7. Call `github_pr_screenshot_upload_path` and use **Browser Helper** below. The batch uploader opens the exact target editor, replaces every exact placeholder, and submits once.
8. Treat a successful helper return as persisted-body verification only. If it throws, inspect its phase evidence and follow **Read-Only Recovery After Save** before deciding whether publication failed or retrying any upload.
9. Require a new `user-attachments/assets/...` URL for every screenshot. Read the exact saved target body/comment, confirm each placeholder was replaced in its intended slot, and compare all non-screenshot Markdown and existing image URLs with the local pre-upload body.
10. In the rendered target, separately confirm each image is loaded directly after its reviewer-facing caption and route. Persisted URLs alone do not prove rendered placement.
11. If GitHub appended an attachment elsewhere, use `gh api` only after the web upload has produced its URL to move the generated Markdown into the intended slot; reload and repeat the rendered-order check.
12. After the web upload has produced a URL, API text edits may update PR/comment Markdown when that is safer than saving through the browser.
13. Release the owned tab and stop the owned session process even after failure, as described below.

REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL.

## Default Browser and Login Handoff

For browser automation and screenshot capture, select the engine under [Browser Opening Modes](browser-qa-workflow.md#browser-opening-modes) and use an agent-owned browser with a unique disposable profile. Keep automation headless unless the user explicitly requests visible QA or agrees to a necessary manual login/MFA handoff before launch; a Firefox engine request alone does not authorize a visible automation window or automatic window switching. A request only to open an app for the user's own review instead follows that section's ordinary Firefox launch, without automation or profile overrides. Application QA and GitHub publication may use separate browsers: honor a required application browser without forcing GitHub's Chromium/CDP helper onto that application.

For GitHub attachments, use an already-authorized owned session only when it meets the selected engine requirement. When signed out, the default user-facing Firefox handoff uses **Firefox GitHub Login and Upload**. The Chromium-only `github-headless-session` in **Authenticated Session Bootstrap** is not a headless-only fallback: it opens a temporary visible sign-in window, so use it only for a separately requested Chromium handoff with agreement before launch. Its caller signals continuation only after the user's confirmation and verifies actual signed-in state after headless relaunch. Do not restart or terminate the personal browser at any stage.

Retain the owned process handle/PID, profile ownership, and any returned endpoint through upload and cleanup. Never use `pkill`, `killall`, or browser-name process selection to free a profile, port, or debugging connection. Cancel only the owned process; an uncertain owner is a reason to stop, not to widen cleanup.

Manual login occurs in that isolated window, not automatically in the user's regular browser. GitHub device authorization and personal access tokens authenticate API clients, not this browser session; do not request pasted credentials or promise a PR-scoped browser token. A disposable profile isolates browser state but does not reduce the signed-in account's GitHub permissions. See [Screenshot Attachments](../references/github-tooling-reference.md#screenshot-attachments) for the API boundary. Existing personal-session reuse is the explicit exception below, not the default.

## Firefox GitHub Login and Upload

Run `command -v github-pr-screenshots` and `github-pr-screenshots --help` to discover the command installed with MSSRT; update it through the same package installation. Use Linux with `flock`, GitHub CLI (`gh` signed in as the same authorized GitHub account), an installed Firefox and a compatible installed Node/Puppeteer WebDriver BiDi binding. The command discovers `puppeteer-core` or `puppeteer` from the current project or the installed package; use `--binding /absolute/path/to/puppeteer-core/package.json` if installed elsewhere, and `--firefox /absolute/path/to/firefox` if it is not on `PATH`. See [Installed Puppeteer Firefox Probe](../references/browser-qa-techniques-reference.md#installed-puppeteer-firefox-probe) for binding and engine compatibility. No binding or browser downloads, Chromium fallback, tokens passed as browser credentials, or personal-profile attachment.

Keep the manifest and vetted captures in the private run directory. Use this shape; relative file paths are resolved next to the manifest. Supply a one-line caption and a relative app route starting with `/`, without credentials, secrets, or private customer data:

```json
{
  "prUrl": "https://github.com/owner/repository/pull/123",
  "screenshots": [
    { "filePath": "./overview.png", "caption": "Billing Overview", "route": "/billing" },
    { "filePath": "./settings.png", "caption": "Billing Settings", "route": "/billing/settings" }
  ]
}
```

```bash
github-pr-screenshots preview --manifest /path/to/private/run/screenshots.json
github-pr-screenshots publish --manifest /path/to/private/run/screenshots.json
```

`preview` does not access GitHub or launch Firefox. `publish` shows the target and ordered files, captions, and routes before asking for confirmation in the terminal. It appends the batch to the existing description; it never asks for a fragment, editor selector, pre-published placeholder, or drag-and-drop. If the default PR view has no classic body target, the command tries `?overview=false` on that same PR without changing a GitHub preference.

### Sign-In, Reuse, and Revocation

The managed headless Firefox profile is private and scoped to the repository named in the manifest. It is stored outside the checkout at `mssrt-pr-screenshots` under `$XDG_STATE_HOME` (default `~/.local/state`). If the installed browser is sandboxed, supply `--profile-root /absolute/path/to/private/browser-visible/state` outside the repository, such as a dedicated subdirectory of the user's Firefox Snap common directory. Use the same root for every action on that profile. The root must be owned by the current user with mode `0700`. This applies to login state, not [capture files](#screenshot-staging).

On first use or when signed out, confirm separately before the command opens a visible owned window, switch to it yourself, and complete GitHub login/MFA before confirming continuation. Decline either prompt or cancel to stop; if the browser cannot prove sign-in in the reopened headless profile, publication stops. Routine runs check the account but do not ask for login while it remains valid. Application QA login is separate. The profile does not grant or reduce GitHub permissions; use an authorized account with only the needed access and publish private captures only to the approved target.

Run `github-pr-screenshots revoke --manifest /path/to/private/run/screenshots.json` with the same profile root to confirm removal of only the managed login profile. This neither signs out a different browser nor revokes the GitHub account's other sessions; use GitHub's own session controls for server-side revocation. It leaves captures and recovery receipts separate. If the owned process might still be running, do not delete the profile or terminate other browsers.

### Save, History, and Recovery

The action returns an ordered list of GitHub attachment URLs only after exact saved-body readback, edit-history reconciliation, and Firefox sees each loaded image under its own caption and app route. It never returns signed image proxy URLs or logs PR Markdown, edits, credentials, or raw browser/API diagnostics.

Concurrency protection is **best effort, not atomic**. The command hashes the current description with only CRLF normalized to LF, requires the browser editor to match, and checks the PR body hash and latest edit ID again immediately before Save. It stops before the write on drift. GitHub can still accept a stale edit between the final check and Save. The command checks its own saved revision and intervening edits against the baseline in GitHub history. If it can identify a single independent append to a complete prior snapshot, it restores that append alongside the approved screenshot batch and repeats the fresh comparison and readback. It will not guess how to merge replacements, multiple intervening edits, missing or redacted history, or histories whose records do not match the independently fetched body. If necessary, compare **edited** revisions in the PR description manually and preserve unrelated text before updating it.

Run `github-pr-screenshots resume --manifest /path/to/private/run/screenshots.json` using the same captures and profile root after interruption. The private receipt tracks each confirmed attachment and possible Save; resuming can finish known unstarted uploads or verify the already saved batch without re-uploading. If an upload began but no URL was recorded, or Save remains ambiguous, stop and inspect the PR/history. Do not delete the receipt or change the filename or contents to evade that stop. Delete private receipts only when no longer needed for recovery; they contain target/attachment references and hashes, not full PR text or browser credentials. Revoking a profile does not remove attachments already published to GitHub.

Compared with calling the low-level uploader, first use needs one manifest, the preview confirmation, and manual sign-in only if needed. Repeat use needs a manifest and preview confirmation, with no new controller or selector setup. Existing low-level helper contracts for page-driven uploads remain available under [Browser Helper](#browser-helper).

## Capture Preflight

Before capture, establish these prerequisites from the task and project-local QA/setup guidance:

1. **Evidence target:** name the changed state, app route, required role/data, and visible result each image will demonstrate. Use the running application; fixture/component previews may support separately labeled evidence but do not prove authenticated application behavior.
2. **Capture browser:** select the engine under [Browser Opening Modes](browser-qa-workflow.md#browser-opening-modes) and honor the requested headless/visible mode. A bare Firefox engine request does not authorize the user's existing profile/tabs or a visible automation window: use a separate owned instance, headless by default unless visibility is explicitly required by the task or project. Merely opening ordinary Firefox for user-led review is not capture or UI-verification evidence. Follow [Browser Control Discovery](../references/browser-qa-techniques-reference.md#browser-control-discovery) before treating Chromium-only OMP tooling as a Firefox blocker. Chromium/CDP upload support does not establish Firefox capture/control support.
3. **Application access:** verify the app route and required data are reachable through the project's documented login/QA path. Use [Real-Authentication E2E Preflight](testing-instructions-workflow.md#real-authentication-e2e-preflight) for authenticated coverage. Application sign-in and GitHub attachment sign-in are separate prerequisites.
4. **Control and capture:** use a supported authorized browser connection or desktop/window capture. A launched browser or a desktop portal request is not proof of control or capture: require a returned, readable image, then inspect it for the intended state and sensitive content. Do not silently substitute a different browser, restart or terminate the user's browser, copy profiles/cookies, or install a new driver to work around missing access. When the requested surface is inaccessible, report that precise blocker and ask only for the missing user action or a materially different capture route.

Keep project-specific browser commands, login/data setup, and desktop permissions in the project's QA documentation; do not invent a universal Firefox command. If its local workflow is missing, use the packaged browser-QA and upload procedures rather than guessing a local filename or requiring the user to copy shared docs. Local policy still wins when it deliberately differs; report stale/conflicting instructions to their owner rather than silently overriding them.

## Progress and Blockers

Record the actual stage reached; do not collapse these into a generic “screenshots blocked”:

- **Capture:** requested browser, application access/data, or screenshot output is unavailable. Name the missing prerequisite; GitHub sign-in cannot produce a missing application capture.
- **GitHub authentication:** valid captures exist but the authorized GitHub browser is signed out. Discover the existing session/bootstrap route below before handing upload back to the user. If the relaunched session is still signed out, stop and report that observed result; do not repeatedly relaunch or infer successful sign-in from caller confirmation alone.
- **File readability:** the selected local screenshot is missing, empty, or unreadable. Report the local staging failure; do not label it a browser transfer or authentication failure.
- **Upload/file transfer:** a readable staged file cannot reach the exact target's browser file input, or GitHub rejects the upload. Use the scoped sandbox exception only with evidence; host readability alone does not establish browser readability.
- **Save:** the form submit action did not run or returned without an independently read saved target. A generated attachment URL or submit click alone does not prove persistence.
- **Verification:** the exact target read-back is unavailable, partial, or differs from the submitted body, or the saved images' rendered placement/loading is unverified. Keep body persistence and rendered placement as separate results.

Retain valid captures when publication is blocked, separate from disposable authentication profiles, so session cleanup does not delete the only evidence. After a UI revision, inspect whether existing images still represent the changed state; recapture affected states and preserve unrelated images. A prior successful upload is not proof of replacement-image delivery.

Screenshot publication is a merge/readiness gate only when the user or project policy requires it. Do not turn optional images or explicitly permitted captioned placeholders into a new gate. An explicit screenshot request remains an outstanding deliverable until completed or truthfully reported blocked, even when the PR may otherwise proceed. Keep required behavioral QA and review gates separate.

## Screenshot Staging

Before the first capture, select storage for the actual browser and allocate one private, unique run directory. Use ordinary `/tmp/omp-pr-screenshots/` when the selected browser can access host `/tmp`; use the verified Firefox Snap runtime route below when host `/tmp` is hidden. Use that run directory for all screenshots and cropped/redacted variants, including rendered-PR verification captures. Keep it throughout retries and separate concurrent runs. Configure the capture tool's destination where supported. If it assigns its own output location, relocate only the newly created, agent-owned image into the run directory immediately and update the local reference; do not scatter duplicate working copies.

For example, run this once in the agent's persistent JavaScript runtime and retain the returned paths for the capture and upload steps:

```js
const { mkdir, mkdtemp } = await import("node:fs/promises")
const path = await import("node:path")
const screenshotRoot = "/tmp/omp-pr-screenshots"
await mkdir(screenshotRoot, { recursive: true, mode: 0o700 })
const screenshotDirectory = await mkdtemp(path.join(screenshotRoot, "run-"))
let uploadDirectory = screenshotDirectory
```

For selected Firefox Snap, use its OS-managed user-runtime directory instead of a Downloads fallback. Confirm the selected executable is the installed Firefox Snap, then resolve `XDG_RUNTIME_DIR` inside that Snap rather than assuming the host value or hard-coding a UID. The following is an alternative to the host `/tmp` allocation above; run only the allocation for the selected browser:

```js
const { execFileSync } = await import("node:child_process")
const { mkdir, mkdtemp, stat } = await import("node:fs/promises")
const path = await import("node:path")
const firefoxRuntimeDirectory = execFileSync(
  "snap",
  ["run", "--shell", "firefox", "-c", 'printf "%s" "$XDG_RUNTIME_DIR"'],
  { encoding: "utf8" }
).trim()
if (!path.isAbsolute(firefoxRuntimeDirectory)) {
  throw new Error("Firefox Snap did not provide an absolute runtime directory.")
}

const runtimeDetails = await stat(firefoxRuntimeDirectory)
if (
  !runtimeDetails.isDirectory() ||
  runtimeDetails.uid !== process.getuid() ||
  (runtimeDetails.mode & 0o777) !== 0o700
) {
  throw new Error("Firefox Snap runtime storage is not a private user directory.")
}

const screenshotRoot = path.join(firefoxRuntimeDirectory, "omp-pr-screenshots")
await mkdir(screenshotRoot, { recursive: true, mode: 0o700 })
const screenshotDirectory = await mkdtemp(path.join(screenshotRoot, "run-"))
let uploadDirectory = screenshotDirectory
```

The resolved directory may look like `/run/user/<uid>/snap.firefox`; the active Snap's output, not that illustration, selects the path. Verify its OS-managed cleanup lifecycle and local runtime policy, for example with `findmnt -T <resolved-directory>` and the session manager's runtime/linger settings. [XDG runtime storage](https://specifications.freedesktop.org/basedir/latest/#variables) is private, disposable user-runtime data and must not survive reboot or a full logout/login cycle; user-runtime teardown can be extended by local service/linger policy. Do not promise a fixed expiry time or cleanup merely because a path contains `tmp`. Runtime storage may be memory-backed: keep screenshot runs bounded, not an unbounded cache or durable archive.

Capture and upload directly from the same chosen run directory where supported. Host-side `stat` or `access` is not browser-access proof: select a harmless staged image through the actual Firefox file input and verify the browser can read/decode it before using this route for the run. A successful file-input check does not establish GitHub authentication, attachment publication, or saved/rendered placement. Keep filenames neutral, local paths out of published GitHub records, and concurrent runs isolated.

Missing, relative, inaccessible, non-private, or lifecycle-unverified runtime storage, or a failed browser file-input check, leaves the affected staging/transfer phase `BLOCKED` with the exact prerequisite. Do not silently fall back to Downloads, `~/snap/firefox/common`, another persistent home directory, or a hard-coded `/run/user/1000` path. For another sandbox that cannot read host `/tmp`, require a separately verified browser-accessible, OS-managed temporary route or report that prerequisite; do not assume the Firefox route works for it. If capture tooling forces a separate output location, transfer only the newly created owned images into the chosen run directory without overwriting existing files and update the local references. This changes screenshot staging only, not browser profiles, authentication, personal-browser adoption, or existing Downloads contents.

Remove owned run directories promptly after QA and saved/rendered verification when evidence is no longer needed. OS-managed cleanup is a backstop, not a substitute for scoped cleanup and not a new cleanup daemon. When publication is blocked, retain valid captures separately from disposable profiles while work remains, but disclose the runtime lifetime; temporary retention is not durable archival. Any longer-lived evidence destination needs explicit authorization rather than an automatic persistent fallback.

## Interactive Sign-In Preference

The default is the isolated headed-to-headless handoff above, not adoption of a personal browser. Only when the user explicitly requests reuse of an existing browser/profile for sign-in, prefer an authorized profile with the user's password-manager extension and use Firefox where the available tooling supports it. If that requested route is unsupported, state the limitation and offer the isolated handoff; do not restart the personal browser to enable debugging or assume Chromium/CDP can control Firefox.

This exception applies to interactive sign-in only; it does not change a project's managed headless application-QA contract. Do not export or transfer cookies/credentials, bypass MFA, or promise that the disposable helper profile includes personal extensions.

When an authorized existing browser/profile is reused, release only the owned tab; do not terminate the user's browser or delete its profile.

## Authenticated Session Bootstrap

Use this Chromium/CDP bootstrap only for a separately requested Chromium handoff with agreement to its temporary visible login window. Default or explicitly selected Firefox uses **Firefox GitHub Login and Upload** instead; do not invoke this adapter as a headless-only fallback. Discover the existing `github-headless-session` command with `command -v github-headless-session`; it is packaged by this plugin, not a separate screenshot-uploader binary. If unavailable, inspect the installed package and its `bin/README.md` before declaring the route unavailable.

Use only a browser session the user explicitly authorized for this repository. Do not adopt an unrelated signed-in tab, transfer cookies or credentials, use `gh` tokens as browser authentication, or automate passwords/2FA.

When genuinely signed out:

1. Create an owned temporary directory outside the repository; choose a continuation filename inside it that does not exist yet. Keep the directory, session/profile locations, and CDP endpoint local.
2. Start this command as an owned long-lived process and retain its PID or tool-process handle:

   ```bash
   github-headless-session --repo OWNER/REPOSITORY --pr NUMBER --continue-file "<local absent continuation file>"
   ```

   It opens headed Chromium on the existing PR with a disposable profile. **The user must perform the initial interactive GitHub sign-in.** Use a dedicated test account with repository-only access. The loopback CDP endpoint is not an authorization boundary: its consumer has the signed-in account’s normal GitHub permissions.

   Manual sign-in waits for caller continuation, browser exit, or cancellation; it has no fixed five-minute deadline. Keep ownership of the process and cancel it explicitly when the user cannot proceed.

   The CLI allocates and owns a disposable profile under `~/Downloads`, which is shared with sandboxed Chromium. Do not assume this profile includes the user's password-manager extension or can load an arbitrary existing profile. The profile remains local and is removed on session exit.

3. After the user confirms sign-in, the caller—not the user—signals continuation:

   ```bash
   touch "<same local continuation file>"
   ```

   The CLI closes headed Chromium, relaunches headless with the same disposable profile, and prints one JSON object containing `cdpUrl` and `pullRequestUrl`. Read those values from that owned process; do not guess a port or publish them.

4. Attach OMP Browser with `browser.open({ name: "pr-screenshots", app: { cdp_url: cdpUrl } })`, using the emitted `cdpUrl` as the variable value. Navigate to `pullRequestUrl` and check the browser session again for a sign-in link. If it is still signed out, stop and report that precise blocker.
5. After authentication, the agent performs the uploads and saved/rendered checks below; do not ask the user to drag files or paste attachment Markdown.

Close the owned OMP tab after QA. For a bootstrap session, then send `SIGTERM` to only the owned CLI process and wait for exit; the CLI stops Chromium and removes its disposable profile. Remove the owned continuation directory and both screenshot run directories, if a browser staging copy was needed, after saved-body and rendered-image verification and once local evidence is no longer needed. On a blocked upload, retain only the needed owned run directory, report its path and reason locally, and clean it up when resolved. Never delete a staging root, another run's files, or existing user screenshots. For a reused browser, release the tab without terminating the user's browser or deleting its profile. Do not persist authentication, secrets, or session files in tracked files.

Manual upload is a last resort only when the explicitly authorized browser/session route is unavailable. State the exact missing prerequisite, keep the public blocked placeholder neutral, and give the actual file location only to the user locally. Do not describe manual upload as the normal signed-out path.

## Read-Only Recovery After Save

If the batch helper rejects, inspect `error.uploadEvidence` before taking another action. It records the current `phase`, the exact target selector, known `attachmentUrls` and `attachmentResults`, `saveStatus`, any `persistedAttachmentUrls`/`missingAttachmentUrls`, and whether the read-back exactly matched the submitted Markdown. `attachmentUrls` are upload results, not persistence proof. `saveStatus: "attempting"` means the submit action failed or did not return; `"submitted"` means the click returned but the saved target is still unverified; `"read-back-mismatch"` means the exact target editor was read and the generated URLs or submitted Markdown did not match; `"verified"` means all URLs and the submitted Markdown were read back. A `null` URL reconciliation means no saved body was read.

After a save attempt, do not rerun the batch or submit another edit just because reopening the editor failed. Read the exact remote target using a read-only command:

```bash
# PR body selected by its existing #issue-… fragment:
gh pr view https://github.com/owner/repository/pull/123 --json body --jq .body

# Reply selected by its existing #issuecomment-… ID:
gh api repos/owner/repository/issues/comments/456 --jq .body
```

Compare that body with the pre-upload Markdown and `error.uploadEvidence.attachmentUrls`: identify every present and missing generated URL, confirm each placeholder/slot and all non-screenshot Markdown and prior image URLs are unchanged, and report inaccessible reads as unknown rather than failed or successful publication. If all expected URLs and surrounding text are present, persisted-body verification succeeded even if the editor could not reopen. If only part of the batch is present, report the exact partial state; never automatically repeat the whole batch or create duplicate attachments.

This read-back proves only the saved Markdown. Separately inspect the rendered target and confirm every intended image is loaded beneath its matching caption and route in order. GitHub may use signed proxy URLs in rendered HTML, so do not compare the rendered `src` with the original generated URL or publish a proxy URL.

## Browser Helper

Call `github_pr_screenshot_upload_path` first and retain its returned installed `file:` URL. The batch uploader takes a PR URL with an exact `#issue-…` body or `#issuecomment-…` reply fragment, scopes controls and verification to that target, opens its `<details>` menu when needed, uploads every placeholder, submits once, and verifies the exact submitted Markdown and every generated URL after read-back. For PR evidence use the body fragment, not a reply.

On success, the existing result contract remains an ordered array of `{ markdown, attachmentUrl }`. On failure, inspect `error.uploadEvidence` for the phase, known URLs, save status, read-back URLs, and body-match result; a generated URL or returned submit click alone is not proof of persistence. Follow **Read-Only Recovery After Save** instead of repeating the batch after a post-save failure.

This `browser.open`/`tab.run` example is the unattended headless Chromium/CDP route. For an authorized Firefox PR-body upload, use **Firefox GitHub Login and Upload**; do not attach OMP Browser to a Firefox process or silently switch to Chromium.

The read-back opens the saved editor for the exact target and cancels that read-only edit after inspection. GitHub may render images through signed proxy URLs; comparing original attachment URLs with rendered HTML can falsely report failure. Verify loaded images and caption placement separately, and never publish signed proxy URLs instead of the generated attachment URLs.

Use the `uploadDirectory` selected in **Screenshot Staging** above, not unrelated capture locations or loose Downloads files. For a Chromium bootstrap session, use its emitted `cdpUrl` and `pullRequestUrl`. For an explicitly authorized existing session, reuse its tab instead of opening a second bootstrap session. Verify the live selectors; the uploader scopes the supplied `textarea` and `input[type="file"]` to the exact fragment. The `access`/`stat` checks in the example verify the agent's filesystem view, not the browser sandbox's view.

```js
const tab = await browser.open({
  name: "pr-screenshots",
  url: pullRequestUrl,
  app: { cdp_url: cdpUrl },
})

try {
  if (await tab.count('a[href^="/login"]')) {
    throw new Error("GitHub browser session is still signed out after manual sign-in.")
  }

  const results = await tab.run(
    async ({ page }, { uploaderUrl, prUrl, uploadDirectory }) => {
      const { access, stat } = await import("node:fs/promises")
      const { constants } = await import("node:fs")
      const path = await import("node:path")
      const { uploadPullRequestCommentScreenshots } = await import(uploaderUrl)
      const screenshots = [
        {
          filePath: path.join(uploadDirectory, "billing-overview.png"),
          placeholder: "<!-- screenshot: billing-overview -->",
        },
        {
          filePath: path.join(uploadDirectory, "billing-settings.png"),
          placeholder: "<!-- screenshot: billing-settings -->",
        },
      ]

      for (const { filePath } of screenshots) {
        await access(filePath, constants.R_OK)
        const image = await stat(filePath)

        if (!image.isFile() || image.size === 0) {
          throw new Error("A staged screenshot is missing or empty.")
        }
      }

      return uploadPullRequestCommentScreenshots({
        page,
        prUrl,
        editorSelector: "textarea",
        fileInputSelector: 'input[type="file"]',
        screenshots,
      })
    },
    {
      args: [
        {
          uploadDirectory,
          uploaderUrl: "<file: URL returned by github_pr_screenshot_upload_path>",
          prUrl: "https://github.com/owner/repository/pull/123#issue-456",
        },
      ],
    }
  )

  console.log(results.map(({ attachmentUrl }) => attachmentUrl))
  await tab.observe({ selector: "#issue-456", includeAll: true })
  await tab.run(
    async ({ page }, { screenshotDirectory }) => {
      const path = await import("node:path")
      await page.screenshot({
        path: path.join(screenshotDirectory, "pr-rendered.png"),
        fullPage: true,
      })
    },
    { args: [{ screenshotDirectory }] }
  )
} finally {
  await tab.close()
}
```

Replace the sample PR URL/body fragment, captions, and neutral filenames with the observed target and actual staged images. The exact placeholders passed to the uploader must already appear under their corresponding headings in the existing body. `tab.run` supplies its own Puppeteer `page`; outer variables are passed through `args`, not captured.

Compare the browser observation/screenshot with the intended caption/heading order; obtaining a screenshot alone is not a placement assertion. Use the observed fragment in all selectors. Keep the returned URLs as local operational results until the saved body and rendered placement are verified.

Use the installed `file:` URL, not a `raw.githubusercontent.com` URL. It is version-matched to the installed plugin, requires no remote-code fetch, and keeps the browser-runtime API local. Use the lower-level helper below only when the caller needs to control an individual upload or defer PR-body submission.

For individual uploads, call `github_markdown_image_upload_helper_path` and import its returned installed `file:` URL inside `tab.run`, where `page` is supplied. Put explicit screenshot placeholders in the PR body first, then pass the exact placeholder as `insertAt` so the helper replaces only the target slot and leaves surrounding text unchanged.

```js
const { addImageToGitHubMarkdownEditor } =
  await import("<file: URL returned by github_markdown_image_upload_helper_path>")

const result = await addImageToGitHubMarkdownEditor({
  page,
  editorSelector: "<PR body editor selector>",
  fileInputSelector: "<scoped file input selector>",
  filePath: "<local screenshot path>",
  insertAt: "<!-- screenshot placeholder -->",
})

// result.markdown: '<img ... src="https://github.com/user-attachments/assets/..." />'
// result.attachmentUrl: 'https://github.com/user-attachments/assets/...'
```

Helper behavior:

- Requires a Puppeteer-compatible `page`, a target `editorSelector`, and a readable non-empty local `filePath`.
- Scopes `fileInputSelector` to the target editor's form/container instead of uploading to the first page-level file input.
- Focuses the target editor and selects `insertAt` when provided so GitHub replaces that placeholder with the generated Markdown; this is the preferred path for long PR bodies with multiple screenshot slots.
- Waits for a new attachment Markdown/HTML snippet that was not already present before upload.
- Preserves surrounding editor text; verify the returned Markdown landed at the intended placeholder before saving.
- Returns the generated Markdown and attachment URL without saving the PR/comment.
- Does not duplicate GitHub's supported-file-type policy. Let GitHub validate the upload, then surface the editor-scoped error text such as unsupported type, empty file, hidden file, permission denial, or unchanged editor value.

## Rules

- Keep captures, cropped/redacted variants, and upload inputs in the owned run directories described in **Screenshot Staging**. Do not scatter images in the checkout, current working directory, Desktop, or loose `~/Downloads` files. Do not commit temporary screenshots by default.
- Redact secrets, credentials, personal data, and tokens.
- Do not save the PR/comment until the helper returns a generated `user-attachments/assets/...` URL and you have reviewed the body.
- Keep QA logs and internal verification evidence out of GitHub content.
- Keep personal usernames, absolute home paths, local browser profile/session paths, credentials/tokens, and workstation-specific locations out of every published GitHub record, including PR bodies and issue/review/QA comments, as well as screenshot contents, filenames, and metadata. Keep operational local paths in local notes only; legitimate repository-relative source/test paths and reviewer-facing app routes are useful and may remain.
- Before uploading a new screenshot, inspect its contents and use a neutral filename and reviewer-facing caption. When correcting metadata on an existing GitHub record, preserve its generated attachment URLs, captions, surrounding text, and existing/user-uploaded images; change only the affected metadata.
- If screenshot upload is blocked, replace the hidden editor placeholder with visible reviewer-facing text that uses a neutral filename and caption and states the exact blocker and what remains unverified; never put a local path in the public text.

## PR Body Pattern

Use this shape for each screenshot:

1. short reviewer-facing description
2. reviewer-facing app route when applicable
3. GitHub-generated `<img ... user-attachments/assets/...>` tag, or a visible captioned placeholder with a neutral filename and the exact blocker when upload is blocked

```markdown
# Screenshots

Billing settings (`billing-settings.png`)
http://localhost:8080/some-route
<img width="..." height="..." alt="Billing settings" src="https://github.com/user-attachments/assets/<generated-attachment-id>" />

Billing settings screenshot (`billing-settings.png`)
http://localhost:8080/some-route

> **Upload blocked:** GitHub requires an authenticated browser session; the screenshot is not attached, so its rendering in the PR remains unverified. Upload `billing-settings.png` after authentication.
```
