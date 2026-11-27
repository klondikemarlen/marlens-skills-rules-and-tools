# Review and Merge Workflow

Use for an explicit operator request to review one existing PR and merge if no changes are required. If review or verification requires corrections, complete the in-scope fixes and hand the PR back for manual re-review by default. Feature and Evolve deliveries use [Autonomous Merge](../autonomous-merge/workflow.md) instead; it is not a way to clear an operator hold on a later invocation.

## Intent

**WHY this workflow exists:** One memorable request should merge a PR that needed no corrections while giving the maintainer a chance to review any corrective work before deciding whether to merge.

**WHAT this workflow produces:** An authorized merge of the verified head, a verified and pushed correction with the PR open for manual re-review, or a precise unresolved gate with the PR preserved.

**Decision Rules:**

- Invocation authorizes review and in-scope fixes for the identified PR. It does not by itself request Codex review. By default, merge only if review and verification required no corrections and all gates pass.
- Required corrections put that PR on hold for manual re-review unless explicit maintainer authorization covers merging that PR after those fixes. Do not solicit that authorization at the handoff. Explicit read-only, no-merge, wait-only, or other narrower instructions prevail.
- Standard mode does not authorize administrative override. The **With Override** mode or an equally explicit instruction can authorize it for the identified PR only. A quoted example or a blocked merge grants no override authority. Administrative override does not authorize merging after required corrections.
- “With override when ready” permits bypassing an administrative merge restriction, not treating missing or failing verification as success. Applicable Codex review, actionable findings, security gates, and required CI remain gates unless separately and explicitly waived by an authorized maintainer under the existing delivery policy.
- Project-local procedures and authorization boundaries remain authoritative. Do not change protection rules, App access, credentials, models, or advisor cadence to make a PR mergeable.

## Read-Only Readiness Questions

“Is this PR ready to merge?” asks for a status assessment, not approval, fixes, a merge, or an administrative override. Inspect the actual base and current head, required review and checks, unresolved findings, and any post-fix re-review hold. Do not change PR state.

When the maintainer uses “ready” to mean that only administrative approval remains, answer **“Yes—pending admin approval.”** Use that answer only when every other applicable gate is satisfied. For example, if the required review covers the previous head, answer **“No—the latest commit still needs review,”** even if CI is green. Report the actual remaining gate; do not assume this wording is every maintainer's convention.

## Inputs and Discovery

Accept a PR URL/number or the uniquely established current PR. Resolve its repository, base, head repository/branch/SHA, draft state, issue, accepted scope, and current review/check evidence from GitHub. If target or fix scope is ambiguous, ask only for that missing decision; never choose another PR or drain a backlog.

- **Standard:** `/skill:review-and-merge <PR URL>`.
- **With Override:** `/skill:review-and-merge <PR URL> with override`. This uses the same procedure and considers the administrative override only if the verified head is otherwise ready to merge.

On continuation, recover whether any earlier review or verification round required corrections from the existing PR discussion, fixup history, or session evidence. Read the correction record separately from current-head readiness. The absence of current findings does not establish that no correction was required; if the prior disposition needed for the merge decision cannot be established, leave the PR open and name the missing evidence.

Use each applicable skill's project-local workflow before its packaged fallback. Do not create another issue, PR, branch, or delivery lifecycle for an already identified PR.

## Process

1. **Review, verify, and resolve findings.** Apply the [shared verified merge procedure](../../docs/workflows/verified-merge-workflow.md) for live target/base/head identity, initial review, fixups, and current evidence. Use its Codex applicability decision in both standard and override mode.
2. **Check readiness, then choose the handoff or merge.** Apply the shared gates and assess the separate record of corrections before merging.
   - If corrections were required and there is no explicit post-fix merge authority for this PR, leave the verified, pushed PR open for the maintainer's manual re-review. Share what changed, the current-head evidence, and any remaining merge-only restriction, then stop without asking whether to merge now or requesting an override. Do not merge, enable auto-merge, or enqueue a merge. Preserve the branch, worktree, and review evidence; do not publish, install, or perform merged-branch cleanup.
   - A rebase, a fresh clean automated review, a passing verification rerun, or a later invocation (including “with override”) can refresh readiness evidence but does not clear the hold. Neither “when ready” nor completion of manual review alone grants post-fix merge authority. A separate, explicit maintainer instruction to merge the corrected PR can authorize it within that instruction's scope, subject to all applicable gates.
3. **Merge only the authorized, verified head.** If no corrections were required, or explicit post-fix merge authority covers them, use the shared procedure to reconfirm the remote revisions, pin the operation to the verified head, and confirm the merge. Consider administrative override only under the boundary below.
4. **Proceed with delivery after the confirmed merge.** Apply the project's existing [Feature](../feature/SKILL.md) release/install and [Wrap-Up](../wrap-up/SKILL.md) procedures. Do not re-enter Feature's merge stage or exit unless requested. Report only observed results.

## Administrative Override Boundary

Consider administrative override only after establishing authority to merge on the applicable path and satisfying the shared gates. For an explicitly authorized GitHub administrative merge, use `gh pr merge <PR> --repo <OWNER/REPO> --admin --match-head-commit <SHA>` with the repository's required merge-method option. Use this only for the identified administrative restriction and PR. It does not authorize changing repository settings, bypassing a failed check, or substituting for an actual project- or host-required human approval. If the instruction does not clearly cover the restriction, request that specific decision. Preserve higher-priority and project-specific non-waivable requirements.

Pending, failed, stale, or unavailable review or verification is not a pass. Administrative override does not turn any of these states into readiness, resolve an outstanding security finding, or remove the post-fix hold. A separately explicit waiver follows the existing feature policy and is reported as waived/unverified, never PASS.

## Representative Decisions

- No Codex requirement, clean self-review, and all other applicable gates passing: use the authorized ordinary merge, pinned to that head. Do not post a Codex request, ask about connector setup, or wait for a Codex verdict.
- A review finding or a verifier failure required a fix: verify the affected behavior, push the correction, and obtain applicable current-head review and verification results. Hand the still-open PR back for manual re-review, not an immediate merge decision. If the PR is then rebased and a repeated “with override” invocation gets clean results, keep it open. Evidence-backed dismissal of an incorrect finding does not itself mean changes were required.
- The maintainer explicitly says “fix those findings and merge this PR after fixes,” or later explicitly directs merging the corrected PR: merge only if that authority covers the corrections and all applicable gates pass on the current head. Administrative override still needs its own authority.
- When Codex applies, a trusted terminal current-head summary can establish completion without a formal review. A stale, pending, unavailable, or conflicting result does not satisfy that gate, even with administrative override.
- An otherwise authorized merge with all shared gates satisfied but a remaining administrative restriction: use an expressly authorized override only if that instruction covers the identified restriction and the ordinary path is unavailable. Without override authority, request that specific decision.
- A local no-merge instruction or non-waivable security policy: retain it regardless of the generic skill or example invocation.

## Output Contract

Return the PR link and merged/not-merged state, whether corrections were required, the current review and verification outcome, and any post-fix merge authority or separate administrative waiver exercised. Report applicable release/install and cleanup results only if observed. For a manual handoff, lead with the open PR ready for manual re-review and point to the pushed revision, corrections, and evidence worth reviewing. Do not end with a merge approval question or describe the handoff as a completed delivery. If a gate remains unresolved, name the missing evidence and next action without claiming readiness.
