# Pull Request Comment Resolution Workflow

Use when addressing pull request review comments, especially line-level review threads that need direct replies.

## Intent

**WHY this workflow exists:** Review feedback can live in review threads, top-level comments, or body edits. Threaded concerns need direct replies and explicit outcomes so reviewers can see what happened without reconstructing commits.

**WHAT this workflow produces:** Each addressed review thread has one direct reply that states the outcome, each resolved thread is true in the current PR state, and a PR converted to draft only for follow-up work is returned to ready-for-review after all addressed threads are verified resolved.

**Decision Rules:**

- Reply on the review thread for line comments. Do not use a top-level PR comment or PR body edit as a substitute.
- For every actionable inline review comment, react with `+1` after accepting or addressing it; react with `-1` when rejecting it as not applicable.
- Before writing a reaction, check the authenticated user’s existing reactions so the same reaction is never duplicated; verify the expected reaction exists afterward.
- Resolve the corresponding review thread with GraphQL `resolveReviewThread` only after its direct reply and outcome are true, then verify `reviewThread.isResolved` is `true`.
- The reaction endpoint is `POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions`.
- Start replies with one outcome phrase:
  - `Addressed in <commit-hash>: <specific fix>.`
  - `Not relevant because <specific reason>.`
  - `Deferred until later because <specific reason>.`
- Resolve the thread only after the direct reply exists and the fix, non-applicability, or deferral is true.
- Keep PR body and thread replies separate. The PR body explains overall scope; a thread reply explains one concern.
- If a comment identifies follow-up outside the PR scope, create or link the appropriate issue before using the deferral reply.
- Fix every actionable review finding or comment before the PR is marked ready or merged.
- After a fixup, re-review the complete PR diff and repeat targeted QA and relevant checks before recording the updated evidence.
- After every fixup commit, repeat the assessment, reaction, resolution, and remote verification protocol for each actionable inline review comment.
- Keep the PR `BLOCKED` and do not mark it ready or merge while actionable feedback, QA, or required checks are unresolved.
- Distinguish a temporarily draft PR used for safe follow-up pushes from an intentionally draft PR. Restore ready-for-review only when the PR was ready before the follow-up or the user asked to return it to review.
- Preserve draft status when the user explicitly asks for draft status or the PR was intentionally still being built.

## Steps

1. Inspect unresolved PR review threads and each actionable inline review comment.
2. For each comment, assess whether the concern is addressed, rejected as not applicable, or deferred.
3. Check the authenticated user’s reactions and add exactly one `+1` for accepted/addressed feedback or `-1` for rejected/not-applicable feedback.
4. Reply directly on the thread with the matching outcome phrase.
5. Resolve the thread with GraphQL `resolveReviewThread`.
6. Re-check GitHub: the expected reaction exists and `reviewThread.isResolved` is `true`.
7. After each fixup, repeat the assessment, reaction, resolution, and verification protocol before marking the PR ready.
8. If the PR was only converted to draft for the follow-up, mark it ready for review again.
9. Re-check the remote PR state before reporting it ready for review.

## Output Contract

```text
Resolved threads: <count>
Deferred threads: <count and linked issues>
Verification: <command/API/UI check used to confirm thread and PR draft/ready state>
```
