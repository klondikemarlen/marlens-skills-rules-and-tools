# Upload Pull Request Screenshots Workflow

Use when a pull request needs GitHub-uploaded screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body.
2. Capture stable states only; avoid transient spinners, snackbars, or partially loaded screens.
3. Store temporary screenshots outside the repository, then copy each upload image to a browser-readable directory such as `~/Downloads`. If the browser cannot read a temporary path, do not rely on `/tmp`; use that browser-readable copy.
4. Add one stable HTML-comment placeholder per screenshot to the existing PR body.
5. Open the existing PR body editor—not the temporary new-comment composer—and identify its textarea selector and scoped file input selector.
6. Call `github_markdown_image_upload_helper_path`, then dynamically import its returned `file:` URL in OMP Browser `run` code.
7. Call `addImageToGitHubMarkdownEditor` once per screenshot with `page`, the PR-body textarea selector, its browser-readable file path, and that screenshot's exact placeholder as `insertAt`.
8. Require each result to contain a new `user-attachments/assets/...` URL and confirm it replaced the intended placeholder.
9. Submit the PR body form, then read the persisted PR body and confirm every expected attachment URL is present.
10. After the web upload has produced a URL, API text edits may update PR/comment Markdown if that is safer than saving through the browser.

REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL.

## Browser Helper

The package exposes `github_markdown_image_upload_helper_path` to OMP. Call the tool first; then use its returned `file:` URL in OMP Browser `run` code. This avoids browser-run package resolution and keeps the Puppeteer `page` handle in its own runtime.

For repeatable PR-body uploads, call `github_pr_screenshot_upload_path` and import its returned `file:` URL. The uploader navigates to the PR, rejects an unauthenticated browser session, opens the PR-body `<details>` container selected by `bodyControlsSelector` when the editor is closed, rejects temporary comment editors, uploads every placeholder, submits the body, and verifies each persisted attachment URL.

```js
const { uploadPullRequestBodyScreenshots } = await import(
  '<file: URL returned by github_pr_screenshot_upload_path>',
);

const results = await uploadPullRequestBodyScreenshots({
  page,
  prUrl: 'https://github.com/owner/repository/pull/123',
  editorSelector: '<PR body textarea selector>',
  fileInputSelector: '<scoped file input selector>',
  bodyControlsSelector: '<PR body details container selector>',
  screenshots: [
    {
      filePath: '<browser-readable screenshot path>',
      placeholder: '<!-- screenshot: overview -->',
    },
  ],
});
```

Use the installed `file:` URL, not a `raw.githubusercontent.com` URL. It is version-matched to the installed plugin, requires no remote-code fetch, and keeps the browser-runtime API local. Use the lower-level helper below only when the caller needs to control an individual upload or defer PR-body submission.

Top priority: editing an existing PR body with lots of text. Put explicit screenshot placeholders in the PR body first, then pass that exact placeholder as `insertAt` so the helper replaces only the target screenshot slot and leaves surrounding PR text unchanged.

```js
const { addImageToGitHubMarkdownEditor } = await import(
  '<file: URL returned by github_markdown_image_upload_helper_path>',
);

const result = await addImageToGitHubMarkdownEditor({
  page,
  editorSelector: '<PR body editor selector>',
  fileInputSelector: '<scoped file input selector>',
  filePath: '<local screenshot path>',
  insertAt: '<!-- screenshot placeholder -->',
});

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

- Do not commit temporary screenshots by default.
- Redact secrets, credentials, personal data, and tokens.
- Do not save the PR/comment until the helper returns a generated `user-attachments/assets/...` URL and you have reviewed the body.
- Keep QA logs, local file paths, and internal verification evidence out of the PR body.
- If screenshot upload is blocked, leave a captioned placeholder that names the exact local screenshot file and explains the blocker.

## PR Body Pattern

Use this shape for each screenshot:

1. short reviewer-facing description
2. local app URL when applicable
3. GitHub-generated `<img ... user-attachments/assets/...>` tag, or a captioned manual-upload placeholder naming the exact local screenshot file when upload is blocked

```markdown
# Screenshots

Description
http://localhost:8080/some-route
<img width="..." height="..." alt="Description" src="https://github.com/user-attachments/assets/..." />

Description
http://localhost:8080/some-route
<!-- Upload blocked: upload <local screenshot path> in GitHub and paste the generated <img ...> tag here. -->
```
