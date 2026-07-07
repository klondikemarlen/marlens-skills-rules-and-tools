# Upload Pull Request Screenshots Workflow

Use when a pull request needs screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body.
2. Capture stable states only; avoid transient spinners, snackbars, or partially loaded screens.
3. Store temporary screenshots outside the repository unless the user explicitly wants files committed.
4. Upload through a logged-in GitHub browser session; API-only upload is not enough for `user-attachments/assets/...` links.
5. Prefer dragging the real PNG into the active PR body textarea; hidden attachment inputs may accept files without inserting Markdown.
6. Verify the textarea or saved PR body contains `user-attachments/assets/...` links before saving.
7. Add screenshot blocks using the pattern below.

## Rules

- Do not commit temporary screenshots by default.
- Redact secrets, credentials, personal data, and tokens.
- If screenshots are expected but blocked, leave placeholders that name the exact local screenshot file and explain the blocker.

## PR Body Pattern

Use this shape for each screenshot:

1. `Description`
2. local app URL when applicable
3. GitHub-generated `<img ...>` tag, or a manual-upload placeholder naming the exact local screenshot file

```markdown
# Screenshots

Description
http://localhost:8080/some-route
<img width="..." height="..." alt="Description" src="https://github.com/user-attachments/assets/..." />

Description
http://localhost:8080/some-route
<!-- Drag /tmp/opencode/pr-123-screenshots/01-description.png into GitHub and paste the generated <img ...> tag here. -->
```
