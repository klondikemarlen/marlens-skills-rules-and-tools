# Review and Merge Workflow

Use for one existing PR when asked to review, get Codex review, fix findings, and merge when ready. This composes existing procedures; it is not another reviewer, runner, or blanket merge waiver.

## Intent

**WHY this workflow exists:** One memorable request should carry an existing PR through review and corrective work to a verified merge without repeated coordination prompts.

**WHAT this workflow produces:** The reviewed PR merged at its verified head, with applicable delivery and cleanup completed, or a precise unresolved gate with the PR preserved.

**Decision Rules:**

- Invocation authorizes review, in-scope fixes, and ordinary merge for the identified PR, including requesting Codex review. Explicit read-only, no-merge, wait-only, or other narrower instructions prevail.
- Administrative override is opt-in: append “with override” or use an equally explicit instruction. Neither this skill's name nor a quoted example grants override authority. Such approval is scoped to this PR, not future work.
- “With override when ready” permits bypassing an administrative merge restriction, not treating missing or failing verification as success. Requested Codex review, actionable findings, security gates, and required CI remain gates unless separately and explicitly waived by an authorized maintainer under the existing delivery policy.
- Project-local procedures and authorization boundaries remain authoritative. Do not change protection rules, App access, credentials, models, or advisor cadence to make a PR mergeable.

## Inputs and Discovery

Accept a PR URL/number or the uniquely established current PR. Resolve its repository, base, head repository/branch/SHA, draft state, issue, accepted scope, and current review/check evidence from GitHub. If the target or authority is ambiguous, ask only for that missing decision; never choose another PR or drain a backlog.

Use these existing skills, each selecting its project-local workflow before its packaged fallback: [Code Review](../../skills/code-review/SKILL.md), [PR](../../skills/pr/SKILL.md), [Feature](../../skills/feature/SKILL.md), and [Wrap-Up](../../skills/wrap-up/SKILL.md). Load [Worktree](../../skills/worktree/SKILL.md) and [Commit](../../skills/commit/SKILL.md) when fixes require them. Do not create another issue, PR, branch, or delivery lifecycle for an already identified PR.

## Process

1. **Review the current scope.** Apply the code-review workflow to the complete PR against its actual base and accepted requirements. Reuse still-valid evidence. Review-only work needs no checkout mutation. Before fixes, reuse the actual registered PR-head worktree and apply the PR workflow's draft-state gate; preserve unrelated changes and discussion.
2. **Obtain Codex review.** Follow [Requested Codex Reviews](../references/github-tooling-reference.md#requested-codex-reviews), including eligibility, exact request, acknowledgement, bounded observation/recovery, trusted author, full current-head SHA, comments/threads, and terminal result. Publication, eyes acknowledgement, elapsed time, empty formal reviews, and an older favorable result are not completion. Do not repeat confirmation prompts for routine authorized observation.
3. **Resolve findings.** Address actionable self-review and external feedback within scope using the existing fixup, reaction/thread-resolution, commit, and push procedures. Run affected-contract checks at the current work level. A changed head invalidates required current-head review; obtain fresh Codex completion and relevant CI evidence, while retaining unaffected proof. A material product decision or unrelated requested change returns to the maintainer rather than silently expanding scope.
4. **Establish readiness.** Re-read the head, required checks, outstanding findings/threads, and merge requirements. Keep the PR draft during collaborative corrections. Mark it ready only when the selected workflow permits it; a review trigger requiring readiness follows that workflow's readiness/CI order. Missing or ambiguous evidence remains an explicit gate, not “nothing came up.”
5. **Merge the reviewed head.** Prefer the repository's ordinary merge method and supported merge path. If administrative override is needed, identify the exact remaining restriction and confirm the existing explicit authority covers it. Apply the boundary below; never infer waiver from a blocked merge. Pin the operation to the freshly verified reviewed SHA (for GitHub CLI, `--match-head-commit <SHA>`). A changed head requires reassessment, not an unpinned retry.
6. **Finish delivery.** Read back the remote merged state, merge commit, and base. Enqueueing or a successful request is not a completed merge. Apply the project's existing release/install and wrap-up procedures; preserve verifier handoffs before owned worktree cleanup and do not exit unless requested. Report only observed release/install results.

## Administrative Override Boundary

For an explicitly authorized GitHub administrative merge, use `gh pr merge <PR> --repo <OWNER/REPO> --admin --match-head-commit <SHA>` with the repository's required merge-method option. Use this only for the identified restriction and PR. It does not authorize changing repository settings or bypassing a failed check. If a mandatory external approval is the remaining restriction, identify that approval as the waiver being exercised; do not report it as received. If the instruction does not clearly cover the restriction, request that specific decision. Preserve higher-priority and project-specific non-waivable requirements.

A requested Codex review still running, unresolved security finding, or unrelated failed required check is not made ready by “with override.” A separately explicit waiver follows the existing feature policy and is reported as waived/unverified, never PASS.

## Representative Decisions

- Clean self-review, trusted current-head Codex completion without findings, and satisfied required checks: ordinary merge, pinned to that head.
- Codex findings fixed in a new commit: verify affected behavior and obtain the new head's required review/check results before merge.
- Empty formal reviews but a trusted complete current-head Codex summary: apply the reference's comment-based completion rules; do not wait solely for a formal review.
- Stale, pending, unavailable, or conflicting Codex result: no merge under the ordinary “when ready” instruction, even with administrative override.
- Green verification but a remaining administrative approval requirement: use an expressly authorized override only after identifying the waived requirement; without authority, request the scoped decision.
- A local no-merge instruction or non-waivable security policy: retain it regardless of the generic skill or example invocation.

## Output Contract

Return the PR link and merged/not-merged state, relevant review and verification outcome, any exact override/waived requirement, and applicable release/install and cleanup result. If blocked, name the missing evidence or decision and the next action; do not replace it with a success summary.
