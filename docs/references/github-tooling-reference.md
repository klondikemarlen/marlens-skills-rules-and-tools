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
- Keep ordinary project issue/PR comments brief, natural, and human, not just upstream comments. Include the useful response, question, new evidence, link, or limitation; omit repetitive audit narration and boilerplate. Preserve requested detail and required facts without turning the comment into a large process report.

## Common Reads

```bash
gh issue list --search "topic words" --json number,title --limit 10
gh issue view 123 --json title,body,state,url
gh pr list --json number,title,headRefName,state,isDraft
gh pr view 456 --json title,body,state,isDraft,mergeStateStatus,url
```

## Requested Codex Reviews

Use this only when a maintainer specifically requests a Codex review; it is not a universal merge gate. Follow OpenAI's [Codex GitHub review setup and troubleshooting guidance](https://learn.chatgpt.com/docs/third-party/github#troubleshoot-code-review). Before requesting, read the current PR head and draft/ready state. Check the configured review trigger: if it requires a ready PR, preserve draft status unless the maintainer authorizes making it ready. A manual `@codex review` request is distinct from automatic-review preferences.

Treat these as separate prerequisites:

- The ChatGPT Codex Connector GitHub App must have access to the target repository. Success on a sibling repository does not prove target access.
- Codex must have code review enabled/configured for the target repository in [Codex review settings](https://chatgpt.com/settings/code-review); automatic-review preferences and their trigger govern automatic reviews.

When settings are inaccessible, report exactly which prerequisite is unverified. Do not infer that access is absent from lack of `admin:org` visibility, claim a service-wide outage from one repository, alter access/settings, or treat an unverified required review as complete.

For a requested review, publish the exact `@codex review` comment on the PR. Publication is not acknowledgement. Check for Codex's eyes reaction or other clear acknowledgement before describing it as queued/running. If there is no acknowledgement after a bounded, context-appropriate wait, diagnose the exact trigger, target repository access, review enablement, and draft/ready eligibility before any further wait or fresh request. Do not repeat long waits or repost without new evidence. Choose bounded waits to fit the context; there is no universal timeout.

### Establish Current-Head Completion

After acknowledgement, observe in bounded intervals. Read the actual current PR head and fully paginate formal reviews, PR issue comments, and inline review comments; inspect unresolved review threads as well. An empty formal Reviews API response alone means neither running nor failed: the connector can publish its terminal result in issue comments.

Verify the result's author is the target repository's trusted Codex connector bot (normally `chatgpt-codex-connector[bot]`), not a human quoting a marker or an account with a similar display name. Compare the full reviewed commit SHA with the actual current PR head. Use the current canonical summary and corroborating receipts, not an older favorable comment; conflicting states, unknown marker versions, missing fields, inaccessible pages, or an unclear association with the intended request leave completion unverified.

Recognize these observed comment forms conservatively:

- A `codex-pull-request-review-summary` comment with a `codex-review-state:v1` payload identifies each review separately. For code review, inspect `code_review.commit_sha`, `status`, `has_any_findings`, and `has_unresolved_findings`. A current-head `status: "completed"` with both finding flags `false` establishes a terminal no-findings result, subject to the author and consistency checks above.
- A `codex-review-receipt:v1` comment can corroborate completion when it explicitly identifies the reviewed commit and terminal outcome, such as no major issues. The marker alone, an abbreviated or missing commit, or reassuring prose without a terminal result is insufficient. Do not guess a receipt schema or let a receipt override a conflicting canonical summary.

For example, this sanitized summary payload reports only code-review completion; it is not a live response:

```html
<!-- codex-pull-request-review-summary -->
<!-- codex-review-state:v1 {"code_review":{"commit_sha":"1111111111111111111111111111111111111111","has_any_findings":false,"has_unresolved_findings":false,"status":"completed"},"security_review":{"commit_sha":null,"has_any_findings":null,"has_unresolved_findings":null,"status":null}} -->
```

Inspect finding flags and actionable inline comments before declaring the requested review satisfied. A terminal review with findings is not a no-findings pass: resolve actionable findings and any explicit re-review requirement through the existing review workflow. An unresolved finding remains a gate even if another comment sounds favorable. Formal reviews also need author, current-head, and finding checks. Re-read the PR head before relying on the result; a changed head makes the old result stale and requires a fresh result when review is required.

Keep review scopes separate: code-review completion does not prove security-review completion, approving GitHub review, CI success, or permission to merge. Follow the existing authorized merge path only after its other gates pass.

### Recover From Acknowledged Reviews That Remain Running

After repeated context-appropriate observation windows without progress, inspect the intended head, current canonical summary/receipts, formal reviews, and inline findings before choosing another action. Distinguish a trusted current-head summary still reporting `running` from acknowledgement alone, terminal completion, stale-head results, and unavailable or ambiguous evidence. Do not restart the same long wait without a new decision.

- **Continue waiting** when there is useful progress or the maintainer chooses to wait; preserve that choice and use another bounded observation window. There is no fixed global deadline.
- **Make one fresh request** when inspection establishes persistent nonterminal current-head state without progress, eligibility remains satisfied, and the maintainer has not directed waiting only. Publish one exact `@codex review` request under the existing review authorization, verify its acknowledgement, and then observe for a current-head terminal result. Record the prior state and new request so this does not become a repeated-request loop. A later completion does not prove the fresh request caused recovery.
- **Report the unfulfilled gate for maintainer direction** when evidence is inaccessible/ambiguous, the fresh request is unacknowledged or remains nonterminal after bounded observation, or no justified next action remains. Name the missing evidence and attempted path; do not diagnose a service defect from elapsed time alone.

Waiving a separately required external approval does not waive a requested Codex review unless the maintainer explicitly says so. A pending review has not passed. Do not change model/provider defaults as recovery.

### Representative Decisions

Assume the intended head is unchanged unless noted; all comment-based completion cases require the trusted-author and complete-evidence checks above.

| Observed Evidence                                                                                                        | Decision                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Formal reviews `[]`; current-head v1 summary says completed with both finding flags false; no actionable inline findings | Code review completed with no findings; do not keep waiting on the empty Reviews API.                          |
| Eyes acknowledgement only                                                                                                | Acknowledged, not completed; observe in bounded intervals.                                                     |
| Repeated windows; trusted current-head summary still running; no new findings or progress                                | Apply the recovery decision, not an automatic retry loop or guessed pass; preserve a maintainer's wait choice. |
| Completed result names an older head                                                                                     | Stale; obtain the required current-head review.                                                                |
| Current-head completed summary reports unresolved findings, or actionable inline findings remain                         | Terminal result, but review gate unresolved; address findings and required re-review.                          |
| Human copies a valid-looking completed marker                                                                            | Untrusted result; completion unverified.                                                                       |
| Current-head code review completed; security review fields are null                                                      | Code review only; security review remains unverified.                                                          |
| Unknown marker version, missing commit, conflicting summary/receipt, or an API page cannot be read                       | Completion unverified; obtain the missing evidence or report the unfulfilled gate.                             |

## GitHub Actions Matrix Fail-Fast

Keep GitHub Actions matrix jobs fail-fast, using the default behavior. Do not set `fail-fast: false` as a routine diagnostic convenience: continuing sibling jobs after one matrix job fails consumes additional runner credits. Change this only when a specific, accepted requirement calls for the remaining matrix jobs to complete; do not treat that exception as a blanket policy change.

## Upstream Issue Participation

Read the main issue and current discussion before commenting. Keep upstream issue comments brief and human: add only new evidence or useful context, such as a distinct reproduction or an observed constraint, rather than restating the report. Link supporting detail when needed instead of repeating a long report.

Defect ownership and permission to write are separate prerequisites. Before proposing an upstream bug report or recurrence comment, establish with a focused reproduction, source trace, or equivalent evidence that the defect is in the third-party project rather than our application, configuration, prompts, plugins, or integration. A similar issue upstream is not proof that a new symptom is caused by upstream code. Route a confirmed local defect to its owning project or user-controlled tracker; keep an unisolated integration finding user-owned until attribution is established. Only participate upstream when the defect is attributable to that project and the write is authorized. If repository-write authorization or the boundary is unclear, confirm it once before writing; a blocked or unclear write is not permission to retry.

Examples:

- An application, configuration, custom-prompt, or plugin defect stays with that code's owning repository, even if a related upstream issue exists.
- An integration symptom with no focused reproduction or source trace stays user-owned; do not report it upstream merely because a similar issue exists there.
- A focused reproduction or source trace isolates a defect in third-party code: an upstream report or useful recurrence comment is appropriate only when writing to that repository is authorized.

For agreement without additional information, use a `+1` reaction on the main issue rather than a comment. If the same actor has already reacted, do not add a duplicate reaction. Existing repository-write authorization still applies to comments and reactions; agreement is not permission to write to an external repository.

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

GitHub's [device flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) lets a user approve a headless API client in their regular browser, but returns an API access token, not a signed-in session for a separate upload browser. [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) can restrict repository access, permissions, and expiration, not a specific PR. Neither supplies a documented token-only attachment-upload route. Use the isolated manual-login-to-headless browser handoff for these attachments; never promise that its account permissions are limited by the target PR URL or disposable profile.
