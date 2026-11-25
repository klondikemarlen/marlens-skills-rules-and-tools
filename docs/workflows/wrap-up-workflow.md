# Wrap-Up Workflow

Use when closing a requested unit of work, including when asked to wrap up, finish, or report completion. This workflow closes loops; it does not authorize a new implementation campaign.

## Intent

**WHY this workflow exists:** A task can appear finished while delivery, release, installation, review, or cleanup is still incomplete. Explicit closeout prevents premature success claims and preserves useful evidence without disturbing unrelated resources.

**WHAT this workflow produces:** An accurate completion, incomplete, or blocked status; relevant delivery evidence; safely handled owned temporary resources; and deduplicated, correctly routed session insights when warranted.

## Decision Rules

- Project-local instructions and the task's authorized target/scope govern. Preserve exact repository, issue, PR, release, install, and environment targets; never infer blanket personal-repository authority.
- Check the actual delivery/release/install state before saying something is delivered. A merge alone does not prove release, publication, installation, or user-visible behavior. Claim only observed status.
- If requested work is incomplete, continue reachable work already authorized by the request. If a prerequisite prevents completion, state the exact missing prerequisite and what was attempted; do not relabel incomplete work as success or exit early.
- Do not turn wrap-up into another implementation campaign. Do not add unrelated fixes or broaden scope. Work required to meet the already-requested outcome remains in scope.
- Normal wrap-up authorizes verified disposable task cleanup by default under [Worktree and Branch Cleanup](feature-workflow.md#worktree-and-branch-cleanup), including its ownership, delivery, contents, and Docker safeguards. Complete those checks, then remove the scoped resources without another disposal prompt. Preserve explicit retention/read-only instructions, primary checkouts, unrelated or uncommitted user changes, and uncertain resources; ask only for a genuinely unresolved safety or scope decision.
- After the requested implementation, verification, and release work is complete, use [Data Mine](../../skills/data-mine/SKILL.md) to inspect the current session and the completed task's commit history. Deduplicate against existing guidance/issues, route findings to their actual owners, and file only where the current task or local workflow authorizes it. No blanket external issue permission and no external implementation are implied.
- Bare wrap-up does not authorize ending the OMP session. An explicit request to wrap up and exit authorizes scheduling supported runtime exit after the final response, but only once the work is complete. Never exit in place of reporting a blocker or unfinished work.
- An authorized installed-plugin update uses [Current-Session Restart](../references/omp-plugin-install-reference.md#applying-installed-updates-to-the-current-session) after delivery and verification are complete. This is a scoped resume handoff, not permission for restart-all or an implicit wrap-up-and-exit.

## Verification-Only Compose Runtime

Before verification can create resources, record the owning checkout, wrapper, resolved Compose project and whether its exact private network already exists (including its ID). A failed lookup is not absence. A retained checkout does not by itself require keeping a runtime created solely for a lint or test run.

When QA finishes, compare against that baseline. Inspect project labels, all project containers (including stopped ones), network endpoints, pending jobs, other users and dependent services. If the runtime was absent beforehand, belongs only to this verification and has no remaining consumers, declare the exact intended dispositions, including the retained checkout, gateway and named volumes. Run the owning wrapper’s scoped `down` without volume removal, then verify those dispositions from fresh observations. A successful command alone is not proof.

If the network predated QA, the baseline is unknown, there is concurrent or pending use, or the wrapper would affect unrelated resources, retain the runtime and state why. An empty network does not establish ownership. Never prune the daemon or use `down -v` for this cleanup.

## Process

1. **Reconstruct the requested finish line.** Use the original request and existing issue/plan as source of scope, acceptance criteria, target, and non-goals. Retain the repository, immutable task base/head revisions, and relevant paths for commit-history mining before cleanup removes worktrees or topic refs. Do not invent new criteria or drop accepted ones.
2. **Check completion and delivery state.** Compare actual work with each acceptance criterion; inspect relevant review, merge, release, publication, installation, and user-visible verification state required by the project. Distinguish completed, not applicable, unverified, failed, and blocked gates. Use existing records and CI rather than duplicating evidence.
3. **Resolve what is reachable.** If required work remains, continue it under the existing authorization and local feature/release process. If blocked, finish other reachable required work and retain the exact blocker, attempted path, and missing prerequisite. Do not start new goals merely because a follow-up seems useful.
   If the authorized disposition is to close a PR without merging, follow [Closing Without Merging](pull-request-management-workflow.md#closing-without-merging) for its discussion explanation and remote read-back.
   For a completed PR or execution scope, apply [Plan Retirement](../plans/README.md#plan-retirement) before disposing of task artifacts: preserve useful knowledge with its existing owner, retain PR-specific evidence in the owning task record, repair references, and remove only an exhausted plan. Active plans, valuable historical records, and explicit retention requirements remain protected.
4. **Complete owned-resource disposition.** Use [Worktree and Branch Cleanup](feature-workflow.md#worktree-and-branch-cleanup) to check and dispose of task resources, including on cleanup-only requests. Do not start PR verification or require a Verifier receipt for housekeeping. Preserve uncertain resources and name the missing evidence rather than repeating a disposal prompt.
5. **Mine insights after completion.** Once implementation, verification, and release work are complete, use [Data Mine](../../skills/data-mine/SKILL.md) for current-session signals and the retained task commit range. Its [Commit-History Mining](session-insight-mining-workflow.md#commit-history-mining) procedure checks actual diffs and the accepted result, deduplicates, and routes supported findings through the existing classifications. Broader history mining requires an explicitly selected bounded scope. Make only currently authorized changes or filings; do not create a second ledger or execute changes in external repositories.
6. **Report truthfully.** State the requested outcome, evidence, and outstanding gates. Cleanup is complete only after the owning workflow checks the final state; a successful command, merge, or source review is not proof of disposal. Report incomplete work and its next action rather than claiming success.
7. **Honor explicit exit.** If and only if the user explicitly requested wrap-up-and-exit and all work is complete, use the supported runtime mechanism to schedule exit after the final response. An exit-after-response tool is called before sending that response; do not attempt another tool call after yielding. Do not invoke exit for a bare wrap-up or an incomplete/blocked task. If no supported mechanism is available, report that limitation rather than killing the process.

## Concise Closeout

Keep completion bookkeeping current as substantive work finishes. Do not spend a tool turn solely marking todo entries complete or recording completion, whether through a direct call, eval cell, loop, or nested tool wrapper. Pair necessary bookkeeping with the actual final substantive action in the same turn; do not invent filler work to justify a bookkeeping call. If no substantive action remains, give the final response instead of starting another completion-only tool turn. Do not dump internal todo structures into tool output or the user-facing report.

Establish readiness for the final response first: required review, verification, delivery, and cleanup gates must have their truthful dispositions. Never mark an incomplete gate complete to shorten closeout. Continue reachable required work; when blocked, report the exact missing prerequisite rather than success. Once readiness is established, send the final response without further completion-only orchestration.

When review findings arrive after a completion response or during another discussion, apply [Findings Delivered After Completion](code-review-workflow.md#findings-delivered-after-completion). Reassess the affected completion claim and disposition the findings within existing authority; do not stop at disclosing them.

When investigating a lingering activity label, distinguish observed unnecessary tool orchestration from a stale UI status, scheduler delay, or advisor latency. A screenshot or unmeasured wait alone does not establish which caused the delay. Keep required advisor/review gates intact, and do not claim guidance changes fix runtime/UI behavior or improve latency without measured evidence.

Before waiting for a review, confirm who or what has been dispatched to advance the exact request, which session or task owns that review, and how the terminal result will reach the session. A prepared request file or `PENDING` status describes the review, not an active producer. A confirmed reviewer can finish asynchronously; wait through its supported completion path. Waiting is not a verdict.

Without a confirmed producer, report the review as outstanding, not running. Use the verifier's supported handoff or recovery path when applicable. If dispatch is unavailable, name the exact missing prerequisite and leave the verification gate outstanding. Do not launch an indefinite file watcher or blindly rerun verification; an observer cannot dispatch a reviewer or submit an assessment.

After stopping an owned wait, report exactly what stopped and what verification remains outstanding. Stopping an observer does not cancel its review request or stop a separately dispatched reviewer. Do not silently start a replacement job.

## Reporting

Prefer concise, reader-useful evidence and links already available in the owning issue/PR/release record. Distinguish merge from release/install and pass from unrun or blocked checks. Preserve material residual risks and the next action for incomplete work; do not publish internal bookkeeping or duplicate an existing record. An explicit requested report format takes precedence.
