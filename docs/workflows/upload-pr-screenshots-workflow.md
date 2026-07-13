# Upload Pull Request Screenshots Workflow

Use when a pull request needs GitHub-uploaded screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body.
2. Capture stable states only; avoid transient spinners, snackbars, or partially loaded screens.
3. Store temporary screenshots outside the repository unless the user explicitly wants files committed.
4. Put screenshots somewhere the headed browser can read. If Snap Chromium reports `/tmp/...png` as `This file is empty.`, copy the same image under `/home/marlen/` and upload that copy.
5. If the image is already hosted at a durable URL, prefer the GitHub REST API to edit the PR body/comment Markdown with that URL; the REST issue/comment endpoints accept text bodies.
6. If the image is only local, use the logged-in GitHub web editor. GitHub's documented attachment flow is drag/drop, paste, or file browse in the web UI; no official REST endpoint is documented for creating `user-attachments/assets/...` uploads.
7. Use `addImageToGitHubMarkdownEditor` below with the PR body editor selector, scoped file input selector, local file path, and exact placeholder text.
8. Verify the returned Markdown contains a new `user-attachments/assets/...` URL before saving.
9. Add screenshot blocks using the pattern below.

## Browser Helper

The package ships a Puppeteer/browser-run helper at `lib/github-markdown-image-upload-helper.mjs`.

Top priority: editing an existing PR body with lots of text. Put explicit screenshot placeholders in the PR body first, then pass that exact placeholder as `insertAt` so the helper replaces only the target screenshot slot and leaves surrounding PR text unchanged.


```js
import { addImageToGitHubMarkdownEditor } from 'marlens-skills-rules-and-tools/lib/github-markdown-image-upload-helper.mjs';

const result = await addImageToGitHubMarkdownEditor({
  page,
  editorSelector: '#issue-4385398821-body',
  fileInputSelector: 'input[type=file]#fc-issue-4385398821-body',
  filePath: '/home/marlen/pr350-profile-notification-preferences.png',
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
<!-- Upload blocked: drag /home/marlen/01-description.png into GitHub and paste the generated <img ...> tag here. -->
```
