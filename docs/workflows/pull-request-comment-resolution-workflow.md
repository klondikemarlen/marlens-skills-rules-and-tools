# Pull Request Comment Resolution Workflow

Use when addressing pull request review comments, especially line-level review threads that need direct replies.

## Intent

**WHY this workflow exists:** Review feedback can live in review threads, top-level comments, or body edits. Threaded concerns need direct replies and explicit outcomes so reviewers can see what happened without reconstructing commits.

**WHAT this workflow produces:** Each addressed review thread has a direct outcome reply and verified resolution; an agent-temporary draft may return to authorized review entry after applicable work-level proof, while current-head CI and review requirements remain merge gates.

**Decision Rules:**

- Apply [Work Levels](hands-off-agentic-coding-workflow.md#work-levels) to the current fixup request. Normal work uses affected-contract proof and delta review; rearchitecture reviews the whole affected design; quick tweaks stop after editing without agent-initiated code rechecking. Required remote reaction, thread-resolution, and PR-state readbacks below remain required and are distinct from code verification. A tweak alone does not authorize readiness, merge, or release.

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
- Apply [Solve Real User Needs](../../rules/solve-real-user-needs.md) before accepting review suggestions: distinguish required fixes from unrequested error handling, retries, scalability, extensibility, and adjacent refactors. For optional or out-of-scope suggestions, give a reasoned not-applicable or deferred reply rather than silently expanding the diff. Create or link an issue only when the follow-up has a concrete justified need and filing is authorized; speculative suggestions do not automatically require code, a ticket, or a delivery blocker.
- Fix every actionable review finding or comment needed to satisfy accepted behavior, required validation/error reporting/authorization, or demonstrated correctness/security/data-integrity safeguards affected by the change before the PR is marked ready or merged. Report material adjacent findings separately instead of silently editing unrelated code; do not use scope discipline to dismiss a required fix.
- Before correcting accepted feedback, inspect the relevant PR context for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit whose body records the concern, corrective outcome, and scope checked when not obvious from the subject. Inspect the complete PR before editing only when the concern reaches that scope.
- After a fixup, apply the current work level rather than automatically repeating complete-PR review and QA. Retain unchanged evidence and truthfully distinguish checks not run.
- After a fixup, reconcile affected actionable inline comments through the assessment, reaction, resolution, and remote verification protocol; do not reopen unchanged resolved threads as a ritual.
- Keep merge `BLOCKED` while actionable feedback, QA, or required checks are unresolved. Readiness-triggered CI is a merge gate, not a reason to dispatch first while draft.
- Distinguish agent-temporary draft transitions from intentional draft status. Restore authorized review entry only after feedback/thread resolution and applicable work-level proof under [CI Run Budget and Readiness](pull-request-management-workflow.md#ci-run-budget-and-readiness), preserving independently required pre-readiness checks and the cumulative suite budget.
- Preserve draft status when the user asks to keep it draft or it is intentionally still being built; do not automatically undo that intent. Record explicit contrary user directions separately from the default pre-fixup draft gate.

## Steps

1. Inspect unresolved PR review threads and each actionable inline review comment. This and other read-only investigation may happen before checking draft status.
2. Before any fixup, classify each comment against the accepted scope and required safeguards, then assess whether the concern is addressed, rejected as not applicable, or deferred. A suggestion alone does not expand the accepted feature set; explicit maintainer approval may revise that scope.
3. Before the first fixup mutation for an existing open PR, inspect its live remote state and record current draft/ready status separately from explicit user intent about keeping draft or returning to review. Leave an already-draft PR in draft. Unless the user explicitly asks to keep it ready, convert a ready PR to draft and re-read the remote state before the first fixup edit or commit. If required state or conversion cannot be verified, stop before fixup mutations. Record an explicit user override rather than silently skipping the gate; do not defer the default transition until push.
4. Before correcting an accepted concern, inspect the relevant PR context for recurrences, broadening to the complete PR only when the concern reaches that scope. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit before resolving the thread.
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
9. After a fixup, reconcile affected comments through the assessment, reaction, resolution, and remote verification protocol before authorized readiness. Apply the current work level separately to code review and QA.
10. After feedback/thread resolution and applicable work-level proof are complete, restore ready-for-review only for an agent-temporary conversion from ready or an explicit user request to return to review. Follow [CI Run Budget and Readiness](pull-request-management-workflow.md#ci-run-budget-and-readiness): let readiness provision configured CI once, then require its applicable current-head result before merge. Preserve intentional draft status and independently required pre-readiness checks; verify the remote state.

## Output Contract

```text
Resolved threads: <count>
Deferred threads: <count, reasons, and justified issue links when applicable>
Verification: <command/API/UI check used to confirm thread and PR draft/ready state>
```
