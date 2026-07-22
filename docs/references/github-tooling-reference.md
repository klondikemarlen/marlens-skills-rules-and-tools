# GitHub Tooling Reference

Use when you need source-of-truth issue or pull request data from GitHub.

## Rules

- Query GitHub directly instead of guessing issue or PR numbers from branch names, commit messages, or chat memory.
- Prefer structured output with `--json`/`--jq` when using the GitHub CLI.
- Prefer higher-level `gh issue edit` / `gh pr edit` commands for body and title changes; use raw `gh api` only when the higher-level command cannot express the field safely.
- Verify authentication before assuming GitHub data is unavailable.
- Do not print credentials, tokens, or private URLs in issue/PR bodies or final summaries.

## Common Reads

```bash
gh issue list --search "topic words" --json number,title --limit 10
gh issue view 123 --json title,body,state,url
gh pr list --json number,title,headRefName,state,isDraft
gh pr view 456 --json title,body,state,isDraft,mergeStateStatus,url
```

## Metadata Updates
For issue or pull request body/title changes, prefer the high-level commands and verify with `gh issue view` or `gh pr view`:

```bash
gh issue edit <number> --body-file /tmp/body.md
gh issue edit <number> --title "New Title"
gh pr edit <number> --body-file /tmp/body.md
gh pr edit <number> --title "New Title"
gh pr view <number> --json title,body,state,isDraft,url
```

## Review Comment Thread Actions

For this repository, use local script helpers before touching write-sensitive GitHub APIs:

```bash
github-review-thread upvote   --repo OWNER/REPOSITORY --comment-id COMMENT_ID
github-review-thread downvote --repo OWNER/REPOSITORY --comment-id COMMENT_ID
github-review-thread reply    --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --body "..."
github-review-thread resolve  --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID
```

Use `--dry-run` for a JSON plan preview.

## Screenshot Attachments
GitHub user-attachment URLs are created through a logged-in browser session. `gh api` can edit issue/PR Markdown after a durable image URL exists, but it does not provide a public upload endpoint that hosts a local screenshot as a `user-attachments/assets/...` URL. Use the project workflow for screenshot capture, browser upload, and attachment formatting.
