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
- Inspect ownership and status before cleaning up. Remove only clearly identified disposable scaffolds/resources owned by this task; preserve primary checkouts, unrelated or uncommitted user changes, and uncertain resources. Follow existing feature/worktree safe-cleanup rules, including Docker/service safeguards. Do not perform destructive git cleanup by assumption.
- After the requested implementation, verification, and release work is complete, use [Session Insight Mining](session-insight-mining-workflow.md) to inspect the current session only. Deduplicate against existing guidance/issues, route findings to their actual owners, and file only where the current task or local workflow authorizes it. No blanket external issue permission and no external implementation are implied.
- Bare wrap-up does not authorize ending the OMP session. An explicit request to wrap up and exit authorizes scheduling supported runtime exit after the final response, but only once the work is complete. Never exit in place of reporting a blocker or unfinished work.

## Process

1. **Reconstruct the requested finish line.** Use the original request and existing issue/plan as source of scope, acceptance criteria, target, and non-goals. Do not invent new criteria or drop accepted ones.
2. **Check completion and delivery state.** Compare actual work with each acceptance criterion; inspect relevant review, merge, release, publication, installation, and user-visible verification state required by the project. Distinguish completed, not applicable, unverified, failed, and blocked gates. Use existing records and CI rather than duplicating evidence.
3. **Resolve what is reachable.** If required work remains, continue it under the existing authorization and local feature/release process. If blocked, finish other reachable required work and retain the exact blocker, attempted path, and missing prerequisite. Do not start new goals merely because a follow-up seems useful.
4. **Complete owned-resource disposition.** Inventory task-owned temporary files, worktrees, local and remote topic branches, and associated disposable Docker resources. Apply [Worktree and Branch Cleanup](feature-workflow.md#worktree-and-branch-cleanup), including fresh PR/remote state, tracked/untracked/ignored contents, local-only commit equivalence, Docker safeguards, and releasing checked-out topics before branch deletion. Perform only already-authorized, ownership-proven safe cleanup; preserve primary checkouts, active/unrelated work, local environment files, and uncertain data. Name each retained task resource and the exact reason or missing approval/prerequisite rather than silently skipping it.
5. **Mine insights after completion.** Once implementation, verification, and release work are complete, inspect current-session corrections, failures, repeated friction, and useful decisions using the session-insight-mining workflow. Check for duplicates, classify and route each actionable finding to its actual owner, and make only currently authorized local changes or issue filings. Do not create a second ledger or execute changes in external repositories.
6. **Report truthfully.** State the requested outcome's status, concise evidence and relevant links, and outstanding gates/blockers or residual risks. Report task resources as removed, already absent, or retained with reasons and any missing permission/approval; unexplained checked-out merged branches are not a completed closeout. Say `complete` only when all applicable acceptance criteria and required delivery/cleanup dispositions are observed complete. Otherwise state `incomplete` or `blocked` and the next reachable action/prerequisite.
7. **Honor explicit exit.** If and only if the user explicitly requested wrap-up-and-exit and all work is complete, use the supported runtime mechanism to schedule exit after the final response. An exit-after-response tool is called before sending that response; do not attempt another tool call after yielding. Do not invoke exit for a bare wrap-up or an incomplete/blocked task. If no supported mechanism is available, report that limitation rather than killing the process.

## Reporting

Prefer concise, reader-useful evidence and links already available in the owning issue/PR/release record. Distinguish merge from release/install and pass from unrun or blocked checks. Preserve material residual risks and the next action for incomplete work; do not publish internal bookkeeping or duplicate an existing record. An explicit requested report format takes precedence.
