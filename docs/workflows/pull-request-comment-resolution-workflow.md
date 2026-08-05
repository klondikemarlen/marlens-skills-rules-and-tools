# Pull Request Comment Resolution Workflow

Use when addressing pull request review comments, especially line-level review threads that need direct replies.

## Intent

**WHY this workflow exists:** Review feedback can live in review threads, top-level comments, or body edits. Threaded concerns need direct replies and explicit outcomes so reviewers can see what happened without reconstructing commits.

**WHAT this workflow produces:** Each addressed review thread has one direct reply that states the outcome, each resolved thread is true in the current PR state, and a PR converted to draft only for follow-up work is returned to ready-for-review after all addressed threads are verified resolved.

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
- Distinguish a temporarily draft PR used for safe follow-up pushes from an intentionally draft PR. Restore ready-for-review only when the PR was ready before the follow-up or the user asked to return it to review.
- Preserve draft status when the user explicitly asks for draft status or the PR was intentionally still being built.

## Steps

1. Inspect unresolved PR review threads and each actionable inline review comment.
2. For each comment, assess whether the concern is addressed, rejected as not applicable, or deferred.
3. Before correcting an accepted concern, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit before resolving the thread.
4. Check the authenticated user’s reactions and add exactly one `+1` for accepted/addressed feedback or `-1` for rejected/not-applicable feedback.
5. Reply directly on the thread with the matching outcome phrase.
6. Resolve with the expected reaction in the same completion gate:
   ```bash
   # accepted/addressed
   github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction +1
   # rejected/not applicable
   github-review-thread resolve --repo OWNER/REPOSITORY --pr NUMBER --comment-id COMMENT_ID --reaction -1
   ```
7. Re-check GitHub: the expected reaction exists and `reviewThread.isResolved` is `true`.
8. After each fixup, repeat the assessment, reaction, resolution, and verification protocol before marking the PR ready.
9. If the PR was only converted to draft for the follow-up, mark it ready for review again.
10. Re-check the remote PR state before reporting it ready for review.

## Output Contract

```text
Resolved threads: <count>
Deferred threads: <count and linked issues>
Verification: <command/API/UI check used to confirm thread and PR draft/ready state>
```
