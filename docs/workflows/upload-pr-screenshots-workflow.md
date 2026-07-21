# Upload Pull Request Screenshots Workflow

Use when a pull request needs GitHub-uploaded screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body.
2. Capture stable states only; avoid transient spinners, snackbars, or partially loaded screens.
3. Store temporary screenshots outside the repository unless the user explicitly wants files committed.
4. Put screenshots somewhere the headed browser can read. If the browser cannot read a temporary path, move the image to a browser-readable directory and retry.
5. Open the PR body editor in a headed, logged-in GitHub browser session. For local screenshots, this web-editor upload is the primary path because REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL.
6. Use `addImageToGitHubMarkdownEditor` below with the PR body editor selector, scoped file input selector, local file path, and exact placeholder text.
7. Verify the returned Markdown contains a new `user-attachments/assets/...` URL before saving.
8. After the web upload has produced a URL, API text edits may update PR/comment Markdown if that is safer than saving through the browser.
9. Add screenshot blocks using the pattern below.

## Browser Helper

The package exposes `github_markdown_image_upload_helper_path` to OMP. Call the tool first; then use its returned `file:` URL in OMP Browser `run` code. This avoids browser-run package resolution and keeps the Puppeteer `page` handle in its own runtime.

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
