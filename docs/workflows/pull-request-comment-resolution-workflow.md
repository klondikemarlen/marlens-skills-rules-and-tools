# Pull Request Comment Resolution Workflow

Use when addressing pull request review comments, especially line-level review threads that need direct replies.

## Intent

**WHY this workflow exists:** Review feedback can live in review threads, top-level comments, or body edits. Threaded concerns need direct replies and explicit outcomes so reviewers can see what happened without reconstructing commits.

**WHAT this workflow produces:** Each addressed review thread has one direct reply that states the outcome, each resolved thread is true in the current PR state, and a PR made draft temporarily from ready status for follow-up work is returned to ready-for-review only after every applicable review, thread, QA, and required-check gate passes.

**Decision Rules:**

- Reply on the review thread for line comments. Do not use a top-level PR comment or PR body edit as a substitute.
- For every actionable inline review comment, react with `+1` after accepting or addressing it; react with `-1` when rejecting it as not applicable.
- Before writing a reaction, check the authenticated user’s existing reactions so the same reaction is never duplicated; verify the expected reaction exists afterward.
- Use the repository helper’s gated `resolve --reaction +1|-1` action after the direct reply. It establishes and verifies the expected reaction before calling GraphQL `resolveReviewThread`, then performs a final reaction and `reviewThread.isResolved` check; a resolved thread without the expected reaction is incomplete.
- The reaction endpoint is `POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions`.
- Start replies with one outcome phrase:
  - `Addressed in <commit-hash>: <specific fix>.`
  - `Not relevant because <specific reason>.`
  - `Deferred until later because <specific reason>.`
- Resolve the thread only after the direct reply exists and the fix, non-applicability, or deferral is true.
- Keep PR body and thread replies separate. The PR body explains overall scope; a thread reply explains one concern.
- If a comment identifies follow-up outside the PR scope, create or link the appropriate issue before using the deferral reply.
- Fix every actionable review finding or comment before the PR is marked ready or merged.
- Before correcting accepted feedback, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit whose body records the concern, corrective outcome, and PR scope checked when that context is not obvious from the subject.
- After a fixup, re-review the complete PR diff and repeat targeted QA and relevant checks before recording the updated evidence.
- After every fixup commit, repeat the assessment, reaction, resolution, and remote verification protocol for each actionable inline review comment.
- Keep the PR `BLOCKED` and do not mark it ready or merge while actionable feedback, QA, or required checks are unresolved.
- Distinguish an agent-temporary draft transition from existing or intentionally draft status. Restore ready-for-review only for a temporary conversion from ready or an explicit user request to return to review, after all review, thread, QA, and required-check gates pass.
- Preserve draft status when the user asks to keep it draft or it is intentionally still being built; do not automatically undo that intent. Record explicit contrary user directions separately from the default pre-fixup draft gate.

## Steps

1. Inspect unresolved PR review threads and each actionable inline review comment. This and other read-only investigation may happen before checking draft status.
2. For each comment, assess whether the concern is addressed, rejected as not applicable, or deferred.
3. Before the first fixup mutation for an existing open PR, inspect its live remote state and record current draft/ready status separately from explicit user intent about keeping draft or returning to review. Leave an already-draft PR in draft. Unless the user explicitly asks to keep it ready, convert a ready PR to draft and re-read the remote state before the first fixup edit or commit. If required state or conversion cannot be verified, stop before fixup mutations. Record an explicit user override rather than silently skipping the gate; do not defer the default transition until push.
4. Before correcting an accepted concern, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit before resolving the thread.
5. Check the authenticated user’s reactions and add exactly one `+1` for accepted/addressed feedback or `-1` for rejected/not-applicable feedback.
6. Reply directly on the thread with the matching outcome phrase.
7. Resolve with the expected reaction in the same completion gate:
   ```bash
   # accepted/addressed
   github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction +1
   # rejected/not applicable
   github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction -1
   ```
8. Re-check GitHub: the expected reaction exists and `reviewThread.isResolved` is `true`.
9. After each fixup, repeat the assessment, reaction, resolution, and verification protocol before marking the PR ready.
10. After all review, thread, QA, and required-check gates pass, restore ready-for-review only for an agent-temporary conversion from ready or an explicit user request to return to review. Otherwise preserve existing or intentionally draft status. Re-check the remote PR state before reporting it ready.

## Output Contract

```text
Resolved threads: <count>
Deferred threads: <count and linked issues>
Verification: <command/API/UI check used to confirm thread and PR draft/ready state>
```
