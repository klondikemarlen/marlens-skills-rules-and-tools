# Pull Request Comment Resolution Workflow

Use when addressing pull request review comments, especially line-level review threads that need direct replies.

## Intent

**WHY this workflow exists:** Review feedback can live in review threads, top-level comments, or body edits. Threaded concerns need direct replies and explicit outcomes so reviewers can see what happened without reconstructing commits.

**WHAT this workflow produces:** Each addressed review thread has one direct reply that states the outcome, and each resolved thread is true in the current PR state.

**Decision Rules:**

- Reply on the review thread for line comments. Do not use a top-level PR comment or PR body edit as a substitute.
- Start replies with one outcome phrase:
  - `Addressed in <commit-hash>: <specific fix>.`
  - `Not relevant because <specific reason>.`
  - `Deferred until later because <specific reason>.`
- Resolve the thread only after the direct reply exists and the fix, non-applicability, or deferral is true.
- Keep PR body and thread replies separate. The PR body explains overall scope; a thread reply explains one concern.
- If a comment identifies follow-up outside the PR scope, create or link the appropriate issue before using the deferral reply.

## Steps

1. Inspect unresolved PR review threads.
2. For each thread, verify whether the concern is addressed, not relevant, or deferred.
3. Reply directly on the thread with the matching outcome phrase.
4. Resolve the thread.
5. Re-check review-thread state from the source control provider.

## Output Contract

```text
Resolved threads: <count>
Deferred threads: <count and linked issues>
Verification: <command/API/UI check used to confirm thread state>
```
