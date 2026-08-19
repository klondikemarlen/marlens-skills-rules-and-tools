# GitHub Tooling Reference

Use when you need source-of-truth issue or pull request data from GitHub.

## Rules

- Query GitHub directly instead of guessing issue or PR numbers from branch names, commit messages, or chat memory.
- Prefer structured output with `--json`/`--jq` when using the GitHub CLI.
- Prefer higher-level `gh issue edit` / `gh pr edit` commands for body and title changes; use raw `gh api` only when the higher-level command cannot express the field safely.
- Verify authentication before assuming GitHub data is unavailable.
- For non-UI GitHub administration—issue, pull request, and release reconciliation—prefer an authenticated `gh`/GitHub API path when available. A signed-out browser session does not make API-backed work `BLOCKED`.
- After an API mutation, perform a fresh API read that confirms the intended remote state before reporting success. Reserve browser authentication blockers for explicit browser UI validation.
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

## REST Fallback for Pull Request Metadata

`gh pr edit` may fail while querying the deprecated `repository.pullRequest.projectCards` GraphQL field. Keep Markdown in a file, build a JSON request body from that file, and use the REST endpoint instead:

```bash
jq -n --rawfile body /tmp/pr-body.md '{body: $body}' >/tmp/pr-patch.json
gh api -X PATCH repos/OWNER/REPOSITORY/pulls/NUMBER --input /tmp/pr-patch.json
gh api repos/OWNER/REPOSITORY/pulls/NUMBER --jq '{title,body}'
```

Use the same `gh api -X PATCH` endpoint with `{title: "New Title"}` for title updates. After every mutation, perform a fresh API-backed read and verify the intended title or body before reporting success. Do not pass shell-sensitive Markdown inline.

## Review Comment Thread Actions

For this repository, use local script helpers before touching write-sensitive GitHub APIs:

```bash
github-review-thread upvote   --repo OWNER/REPOSITORY --comment-id COMMENT_ID
github-review-thread downvote --repo OWNER/REPOSITORY --comment-id COMMENT_ID
github-review-thread reply    --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --body-file PATH

# accepted/addressed inline comment
github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction +1
# rejected/not-applicable inline comment
github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction -1

```

The gated `resolve --reaction +1|-1` action maps the comment to its review thread, establishes and verifies the actor’s expected reaction before resolving, and performs a final check of both the reaction and `reviewThread.isResolved`. A resolved thread without that reaction is incomplete.

Never pass Markdown through inline `--body`; the shell evaluates backticks and `$()` before the CLI receives the argument. Write the exact text to a file and pass `--body-file`:

```bash
cat >/tmp/review-reply.md <<'EOF'
Addressed in <commit-hash>: <specific fix>.
EOF
github-review-thread reply --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --body-file /tmp/review-reply.md
```

The helper rejects inline `--body` for replies. Use the same file-based pattern for `gh issue` and `gh pr` body/comment writes.

Use `--dry-run` for a JSON plan preview.

## Review Helper Package Boundary

The review helper is part of this repository's OMP plugin/package artifact. Its GitHub API calls are grouped behind the exported `GitHubReviewIntegration`; the CLI remains the user-facing surface. Do not create a separate gem/npm package or add Octokit/`gh api` transport until a second consumer needs the integration or it must be versioned independently.

## Screenshot Attachments

GitHub user-attachment URLs are created through a logged-in browser session. `gh api` can edit issue/PR Markdown after a durable image URL exists, but it does not provide a public upload endpoint that hosts a local screenshot as a `user-attachments/assets/...` URL. Use the project workflow for screenshot capture, browser upload, and attachment formatting.
