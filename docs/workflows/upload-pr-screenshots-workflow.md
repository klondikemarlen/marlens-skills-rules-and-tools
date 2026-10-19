# Upload Pull Request Screenshots Workflow

Use when a pull request needs GitHub-uploaded screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body. Follow project-local guidance on whether screenshots are required or optional, and use **Capture Preflight** before opening a browser or preparing data.
2. Before capturing, allocate the run directory in **Screenshot Staging** below. Capture the actual application in the requested browser at stable states; avoid transient spinners, snackbars, or partially loaded screens.
3. Keep every image for the run in that directory, use it as the default upload source, and verify the exact selected upload files are readable. Use only the scoped sandbox exception below when necessary; do not scatter working copies.
4. Check GitHub browser authentication before declaring screenshots upload-ready; a signed-in `gh` CLI does not authenticate the browser. For manual sign-in, follow **Interactive Sign-In Preference** below. Use **Authenticated Session Bootstrap** only as an explicit fallback when the preferred authorized route is unavailable.
5. Add one stable HTML-comment placeholder per screenshot to the existing PR body, immediately after its caption and reviewer-facing app route. Preserve surrounding text and existing images.
6. Obtain the exact PR-body `#issue-…` fragment from the page. Do not substitute a new-comment composer or an `#issuecomment-…` reply. Inspect the existing PR body editor—not the temporary new-comment composer—and identify its textarea selector and scoped file input selector.
7. Call `github_pr_screenshot_upload_path` and use the complete **Browser Helper** invocation below. The batch uploader opens that target editor, replaces every exact placeholder, submits once, reloads, and verifies persisted attachment URLs. Use `addImageToGitHubMarkdownEditor` only for individual uploads or deferred submission.
8. Require a new `user-attachments/assets/...` URL for every screenshot. Read the saved PR body through `gh pr view --json body`, confirm each placeholder was replaced in its intended slot, and compare surrounding text and existing image URLs with the pre-upload body.
9. In the rendered target, confirm each image appears directly after its reviewer-facing caption and route. Persisted URLs alone do not prove rendered placement.
10. If GitHub appended an attachment elsewhere, use `gh api` only after the web upload has produced its URL to move the generated Markdown into the intended slot; reload and repeat the rendered-order check.
11. After the web upload has produced a URL, API text edits may update PR/comment Markdown when that is safer than saving through the browser.
12. Release the owned tab and stop the owned session process even after failure, as described below.

REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL.

## Capture Preflight

Before capture, establish these prerequisites from the task and project-local QA/setup guidance:

1. **Evidence target:** name the changed state, app route, required role/data, and visible result each image will demonstrate. Use the running application; fixture/component previews may support separately labeled evidence but do not prove authenticated application behavior.
2. **Capture browser:** distinguish an explicit request for the user's normal/existing Firefox session from a separate Firefox automation session or Chromium. Confirm the available tooling supports the requested browser and an actual screenshot destination. Chromium/CDP upload support does not establish Firefox capture/control support.
3. **Application access:** verify the app route and required data are reachable through the project's documented login/QA path. Use [Real-Authentication E2E Preflight](testing-instructions-workflow.md#real-authentication-e2e-preflight) for authenticated coverage. Application sign-in and GitHub attachment sign-in are separate prerequisites.
4. **Control and capture:** use a supported authorized browser connection or desktop/window capture. A launched browser or a desktop portal request is not proof of control or capture: require a returned, readable image, then inspect it for the intended state and sensitive content. Do not silently substitute a different browser, restart or terminate the user's browser, copy profiles/cookies, or install a new driver to work around missing access. When the requested surface is inaccessible, report that precise blocker and ask only for the missing user action or a materially different capture route.

Keep project-specific browser commands, login/data setup, and desktop permissions in the project's QA documentation; do not invent a universal Firefox command. If its local workflow is missing, use the packaged browser-QA and upload procedures rather than guessing a local filename or requiring the user to copy shared docs. Local policy still wins when it deliberately differs; report stale/conflicting instructions to their owner rather than silently overriding them.

## Progress and Blockers

Record the actual stage reached; do not collapse these into a generic “screenshots blocked”:

- **Capture:** requested browser, application access/data, or screenshot output is unavailable. Name the missing prerequisite; GitHub sign-in cannot produce a missing application capture.
- **GitHub authentication:** valid captures exist but the authorized GitHub browser is signed out. Discover the existing session/bootstrap route below before handing upload back to the user. If the relaunched session is still signed out, stop and report that observed result; do not repeatedly relaunch or infer successful sign-in from caller confirmation alone.
- **Upload/file transfer:** the target editor or browser file input cannot accept the selected images. Inspect the scoped editor error and browser-visible file transfer; use the staging sandbox exception only with evidence. Host readability does not establish browser readability. Do not diagnose an empty/unsupported upload as an authentication failure without evidence.
- **Publication verification:** an upload URL exists but saved-body preservation or loaded-image placement is unverified. Keep that distinction; neither local files nor app-route links are published attachments.

Retain valid captures when publication is blocked, separate from disposable authentication profiles, so session cleanup does not delete the only evidence. After a UI revision, inspect whether existing images still represent the changed state; recapture affected states and preserve unrelated images. A prior successful upload is not proof of replacement-image delivery.

Screenshot publication is a merge/readiness gate only when the user or project policy requires it. Do not turn optional images or explicitly permitted captioned placeholders into a new gate. An explicit screenshot request remains an outstanding deliverable until completed or truthfully reported blocked, even when the PR may otherwise proceed. Keep required behavioral QA and review gates separate.

## Screenshot Staging

Before the first capture, allocate one private, unique directory under `/tmp/omp-pr-screenshots/`. Use it for all screenshots and cropped/redacted variants from that QA run, including rendered-PR verification screenshots. Keep the same directory throughout retries; separate concurrent runs. Configure the capture tool's destination where supported. If it assigns its own output location, relocate only the newly created, agent-owned image into this directory immediately and update the local reference; do not leave duplicate working copies scattered elsewhere.

For example, run this once in the agent's persistent JavaScript runtime and retain the returned paths for the capture and upload steps:

```js
const { mkdir, mkdtemp } = await import("node:fs/promises")
const path = await import("node:path")
const screenshotRoot = "/tmp/omp-pr-screenshots"
await mkdir(screenshotRoot, { recursive: true, mode: 0o700 })
const screenshotDirectory = await mkdtemp(path.join(screenshotRoot, "run-"))
let uploadDirectory = screenshotDirectory
```

Upload directly from that directory by default. Only when the selected browser has an evidenced sandbox/file-access limitation that hides host `/tmp`, create a matching private run directory at `~/Downloads/omp-pr-screenshots/<same-run-name>/`, copy only the intended upload images there without overwriting existing files, and set `uploadDirectory` to that directory. Do not copy to loose `~/Downloads` filenames or probe unrelated directories. Host-side readability alone does not prove browser access; verify the exact files reach the browser's file input. This exception concerns image transfer, not browser profile storage or authentication.

Keep filenames neutral and local directory paths out of published GitHub records. After QA (and saved/rendered verification for uploaded evidence), remove only the owned run directories once the evidence is no longer needed; see the cleanup procedure below for blocked uploads.

## Interactive Sign-In Preference

For manual interactive sign-in, prefer an existing browser/profile that the user has explicitly authorized for this repository and that has the user's password-manager extension available. Use Firefox where the available browser tooling supports it. If the task requires Chromium/CDP, prefer a compatible, explicitly authorized existing profile with the extension rather than defaulting immediately to an extension-free disposable profile. Do not assume the current CLI can load arbitrary browser profiles or promise Firefox support in a Chromium/CDP-only route.

Do not silently reuse an unrelated personal session, export or transfer cookies or credentials, or bypass MFA. This preference applies to interactive sign-in only; it does not change a project's managed headless application-QA contract. If the preferred authorized route is unavailable, the owned disposable bootstrap below remains the explicit fallback and retains its sign-in, process, profile, and cleanup requirements.

When an authorized existing browser/profile is reused, release only the owned tab; do not terminate the user's browser or delete its profile.

## Authenticated Session Bootstrap

Discover the existing `github-headless-session` command with `command -v github-headless-session`; it is packaged by this plugin, not a separate screenshot-uploader binary. If unavailable, inspect the installed package and its `bin/README.md` before declaring the route unavailable.

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

## Browser Helper

Call `github_pr_screenshot_upload_path` first and retain its returned installed `file:` URL. The batch uploader takes a PR URL with an exact `#issue-…` body or `#issuecomment-…` reply fragment, scopes controls and verification to that target, opens its `<details>` menu when needed, uploads every placeholder, submits, and verifies persisted attachment URLs. For PR evidence use the body fragment, not a reply.

Persisted verification reopens the saved editor, checks the original generated attachment URLs in its Markdown, then cancels that read-only edit. GitHub may render images through signed proxy URLs; comparing original attachment URLs with rendered HTML can falsely report failure. Verify loaded images and caption placement separately, and never publish signed proxy URLs instead of the generated attachment URLs.

Use the `uploadDirectory` selected in **Screenshot Staging** above, not unrelated capture locations or loose Downloads files. For a bootstrap session, use the emitted `cdpUrl` and `pullRequestUrl`. For an explicitly authorized existing session, reuse its tab instead of opening a second bootstrap session. Verify the live selectors; the uploader scopes the supplied `textarea` and `input[type="file"]` to the exact fragment. The `access`/`stat` checks in this example verify the agent's filesystem view, not the browser sandbox's view.

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
