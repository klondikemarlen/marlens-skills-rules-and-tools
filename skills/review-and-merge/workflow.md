# Review and Merge Workflow

Use for one existing PR when asked to review, get Codex review, and merge if no changes are required. If review or verification requires corrections, complete the in-scope fixes and hand the PR back for manual re-review by default. This composes existing procedures; it is not another reviewer, runner, or blanket merge waiver.

## Intent

**WHY this workflow exists:** One memorable request should merge a PR that needed no corrections while giving the maintainer a chance to review any corrective work before deciding whether to merge.

**WHAT this workflow produces:** An authorized merge of the verified head, a verified and pushed correction with the PR open for manual re-review, or a precise unresolved gate with the PR preserved.

**Decision Rules:**

- Invocation authorizes review, requesting Codex review, and in-scope fixes for the identified PR. Obtain the required review and verification results before deciding whether to merge. By default, merge only if review and verification required no corrections and all gates pass.
- Required corrections put that PR on hold for manual re-review unless explicit maintainer authorization covers merging that PR after those fixes. Do not solicit that authorization at the handoff. Explicit read-only, no-merge, wait-only, or other narrower instructions prevail.
- Standard mode does not authorize administrative override. The **With Override** mode or an equally explicit instruction can authorize it for the identified PR only. A quoted example or a blocked merge grants no override authority. Administrative override does not authorize merging after required corrections.
- “With override when ready” permits bypassing an administrative merge restriction, not treating missing or failing verification as success. Requested Codex review, actionable findings, security gates, and required CI remain gates unless separately and explicitly waived by an authorized maintainer under the existing delivery policy.
- Project-local procedures and authorization boundaries remain authoritative. Do not change protection rules, App access, credentials, models, or advisor cadence to make a PR mergeable.

## Inputs and Discovery

Accept a PR URL/number or the uniquely established current PR. Resolve its repository, base, head repository/branch/SHA, draft state, issue, accepted scope, and current review/check evidence from GitHub. If target or fix scope is ambiguous, ask only for that missing decision; never choose another PR or drain a backlog.

- **Standard:** `/skill:review-and-merge <PR URL>`.
- **With Override:** `/skill:review-and-merge <PR URL> with override`. This uses the same procedure and considers the administrative override only if the verified head is otherwise ready to merge.

On continuation, recover whether any earlier review or verification round required corrections from the existing PR discussion, fixup history, or session evidence. Read the correction record separately from current-head readiness. The absence of current findings does not establish that no correction was required; if the prior disposition needed for the merge decision cannot be established, leave the PR open and name the missing evidence.

Use these existing skills, each selecting its project-local workflow before its packaged fallback: [Code Review](../code-review/SKILL.md), [PR](../pr/SKILL.md), [Feature](../feature/SKILL.md), and [Wrap-Up](../wrap-up/SKILL.md). Load [Worktree](../worktree/SKILL.md) and [Commit](../commit/SKILL.md) when fixes require them. Do not create another issue, PR, branch, or delivery lifecycle for an already identified PR.

## Process

1. **Review the current scope.** Apply the code-review workflow to the complete PR against its actual base and accepted requirements. Reuse still-valid evidence. Review-only work needs no checkout mutation. Before fixes, reuse the actual registered PR-head worktree and apply the PR workflow's draft-state gate; preserve unrelated changes and discussion.
2. **Obtain Codex review.** Follow [Requested Codex Reviews](../../docs/references/github-tooling-reference.md#requested-codex-reviews), including eligibility, exact request, acknowledgement, bounded observation/recovery, trusted author, full current-head SHA, comments/threads, and terminal result. Publication, eyes acknowledgement, elapsed time, empty formal reviews, and an older favorable result are not completion. Do not repeat confirmation prompts for routine authorized observation.
3. **Resolve review and verifier findings.** Obtain applicable verification results and address required in-scope corrections from self-review, external review, or verification using the existing fixup, reaction, and thread-resolution procedures. Record in the existing PR or session evidence that corrections were required, even if another contributor made them. Run affected-contract checks at the current work level, commit and push the fixes, and obtain fresh current-head Codex completion and relevant verification and CI results when the head changes. Reuse unaffected proof. Return material product decisions or unrelated requested changes to the maintainer rather than silently expanding scope.
4. **Check readiness, then choose the handoff or merge.** Re-read the head, review and verification outcomes, outstanding findings or threads, and merge requirements. Keep the PR draft during collaborative corrections and follow the selected workflow's readiness and CI order. Missing or ambiguous evidence is a gate, not “nothing came up.”
   - If corrections were required and there is no explicit post-fix merge authority for this PR, leave the verified, pushed PR open for the maintainer's manual re-review. Share what changed, the current-head evidence, and any remaining merge-only restriction, then stop without asking whether to merge now or requesting an override. Do not merge, enable auto-merge, or enqueue a merge. Preserve the branch, worktree, and review evidence; do not publish, install, or perform merged-branch cleanup.
   - A rebase, a fresh clean automated review, a passing verification rerun, or a later invocation (including “with override”) can refresh readiness evidence but does not clear the hold. Neither “when ready” nor completion of manual review alone grants post-fix merge authority. A separate, explicit maintainer instruction to merge the corrected PR can authorize it within that instruction's scope, subject to all applicable gates.
5. **Merge only the authorized, verified head.** Proceed when no corrections were required and all gates pass, or when explicit post-fix merge authority covers the corrections and the corrected head passes all gates. Prefer the ordinary supported merge path. If administrative override is needed, identify the exact restriction and apply the boundary below; never infer waiver from a blocked merge. Pin the operation to the freshly verified reviewed SHA (for GitHub CLI, `--match-head-commit <SHA>`). A changed head requires reassessment, not an unpinned retry.
6. **Confirm the merge and proceed with delivery.** Read back the remote merged state, merge commit, and base. Enqueueing or a successful request is not a completed merge. Apply the project's existing release/install and wrap-up procedures; preserve verifier handoffs before owned worktree cleanup and do not exit unless requested. Report only observed results.

## Administrative Override Boundary

Consider administrative override only after establishing authority to merge on the applicable path. For an explicitly authorized GitHub administrative merge, use `gh pr merge <PR> --repo <OWNER/REPO> --admin --match-head-commit <SHA>` with the repository's required merge-method option. Use this only for the identified restriction and PR. It does not authorize changing repository settings or bypassing a failed check. If a mandatory external approval is the remaining restriction, identify that approval as the waiver being exercised; do not report it as received. If the instruction does not clearly cover the restriction, request that specific decision. Preserve higher-priority and project-specific non-waivable requirements.

Pending, failed, stale, or unavailable review or verification is not a pass. Administrative override does not turn any of these states into readiness, resolve an outstanding security finding, or remove the post-fix hold. A separately explicit waiver follows the existing feature policy and is reported as waived/unverified, never PASS.

## Representative Decisions

- Clean self-review, trusted current-head Codex completion requiring no changes, and passing applicable verification and CI: use the authorized ordinary merge, pinned to that head. Evidence-backed dismissal of an incorrect finding does not itself mean changes were required.
- A Codex finding or a verifier failure required a fix: verify the affected behavior, push the correction, and obtain applicable current-head review and verification results. Hand the still-open PR back for manual re-review, not an immediate merge decision. If the PR is then rebased and a repeated “with override” invocation gets clean results, keep it open.
- The maintainer explicitly says “fix those findings and merge this PR after fixes,” or later explicitly directs merging the corrected PR: merge only if that authority covers the corrections and all applicable gates pass on the current head. Administrative override still needs its own authority.
- Empty formal reviews but a trusted complete current-head Codex summary: apply the reference's comment-based completion rules; do not wait solely for a formal review.
- Stale, pending, unavailable, or conflicting Codex result: no merge under the ordinary “when ready” instruction, even with administrative override.
- An otherwise authorized merge with green verification but a remaining administrative approval requirement: use an expressly authorized override only after identifying the waived requirement; without override authority, request that specific decision.
- A local no-merge instruction or non-waivable security policy: retain it regardless of the generic skill or example invocation.

## Output Contract

Return the PR link and merged/not-merged state, whether corrections were required, the current review and verification outcome, and any post-fix merge authority or separate administrative waiver exercised. Report applicable release/install and cleanup results only if observed. For a manual handoff, lead with the open PR ready for manual re-review and point to the pushed revision, corrections, and evidence worth reviewing. Do not end with a merge approval question or describe the handoff as a completed delivery. If a gate remains unresolved, name the missing evidence and next action without claiming readiness.
