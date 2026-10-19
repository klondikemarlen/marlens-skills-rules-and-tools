# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and install/verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Before editing repository documentation, follow [Selecting Documentation Content](../../docs/workflows/project-knowledge-base-workflow.md#selecting-documentation-content) to name the changed durable reader question or contract and decide whether a docs change is needed.
- Create or update a GitHub issue before coding user-facing work unless the user explicitly says not to use issues.
- Before branch or worktree creation, use [Related-Issue Triage](#related-issue-triage) to revalidate the seed issue and decide whether nearby tickets belong in the same small delivery.
- An explicit feature-workflow request for the current checkout authorizes same-origin issue and branch creation; do not ask again solely for that delivery. External or unresolved GitHub writes remain subject to `omp-soft-boundary-guard` advisory warnings when installed. A standard OMP Ask applies only when a caller explicitly uses the guard's strict programmatic API; do not add another confirmation. Preserve destructive or ambiguous Git-operation safeguards.
- Name issue branches with the project's issue convention and a concise, meaningful outcome slug; never use opaque abbreviations or a bare issue number. Give pull requests an equally meaningful outcome-focused title and link the issue in the body.
- Before `git worktree add`, `dev branch-from`, or creating an issue branch, inspect the target project's local guidance and existing `git worktree list`/branch layout. Use its prescribed worktree path and branch-name convention; an issue-linked branch does not necessarily repeat the issue number.
- If a worktree must move or a pushed branch must be renamed, update the registered worktree and delete the obsolete remote-tracking branch after confirming it is agent-owned. Do not hard-code project-specific paths or branch shapes into shared guidance.
- Treat GitHub administration as distinct from browser UI validation: for non-UI issue, pull request, and release reconciliation, prefer an authenticated `gh`/GitHub API path when available. A signed-out browser does not block completed remote work when the required state can be queried or mutated through the API.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Report browser authentication as `BLOCKED` only when browser UI behavior is the explicit requirement. After any API mutation, perform a fresh API read that confirms the intended remote state before claiming success.
- When restoring previously tracked behavior, use [Restoring Deleted Features](../../docs/workflows/git-rebase-workflow.md#restoring-deleted-features) to recover from removal history without reviving retired controls or rewriting published history without authorization.
- Before opening a PR, verify its base is the repository's default branch or a documented release branch.
- When a target repository documents an `npm test` gate, run it for source-file changes; in this package that gate includes `node scripts/verify-oversized-source-files.mjs`. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when the required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Merge verified pull requests by default with a merge commit after repository- or platform-enforced review requirements, required checks, and actionable feedback are resolved. Personal or unprotected repositories do not require a second-collaborator review unless local policy explicitly says so. Wait only when the work specifically requires end-user testing the agent cannot perform. An explicit user or maintainer request to waive, drop, or clean up may instead direct merge or closure of unverified work; record the missing evidence and do not claim it was verified.
- Keep complete self-review, targeted QA, current-head status, learner triage, and blockers mandatory. Follow local policy for where their results are recorded; the top-level PR body remains the sole canonical reviewer description, but operational evidence belongs there only when local policy permits it. Without contrary local policy, record concise review/QA status and learner coverage in the PR body and revise it in place after each implementation, review, or QA revision. Do not append routine report comments. Follow [`../../docs/workflows/pull-request-management-workflow.md`](../../docs/workflows/pull-request-management-workflow.md) for evidence, discussion, supplemental reports, cleanup, and remote read-back.
- Resolve every actionable review finding or comment before merge by default. After a fixup, repeat the complete self-review and targeted QA.
- Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
- During issue triage, record an evidence-based learner coverage outcome for every issue not clearly learner-authored; file an OMP Learner bug or feature only for a current-signal miss or capability gap.
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference and follow the default branch. Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis; verify the installed version separately.
- For an artifact whose automatic behavior depends on an OMP advisor, release QA MUST start a fresh OMP process, confirm `/advisor status` shows the named advisor with a resolved model rather than `[no model]`, then trigger one matching failure and observe a standard advisor `blocker` in the primary session before remediation produces `PASS`. A UI notification alone is not correction evidence; unavailable advisor runtime is `BLOCKED`.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## Dockerized Worktree Cleanup

Use this procedure only when an agent-owned Dockerized worktree must be removed.

1. Verify the target branch, pull request, worktree owner, and local changes; preserve the primary checkout and user-owned untracked files.
2. Stop only the target worktree's services through its documented wrapper.
3. Remove only explicitly allowlisted Docker-owned generated artifacts from inside those project containers.
4. Run `git worktree remove <path>`. If its metadata disappears but the directory remains, re-check `git worktree list` before treating the directory as orphaned.
5. Verify the target directory, worktree registry, branch, and primary checkout state afterward.

See [Safe Worktree Cleanup in Dockerized Projects](../../docs/references/engineering-techniques-reference.md#safe-worktree-cleanup-in-dockerized-projects) for ownership and safety boundaries.

## Requirements Snapshot

For ambiguous or cross-cutting feature work, add a lightweight requirements snapshot to the issue or planning artifact that already owns the work:

- **Problem:** the user or maintainer problem being solved.
- **Desired result/success condition:** the observable outcome.
- **Acceptance criteria:** how completion will be recognized.
- **Assumptions:** facts or constraints currently being taken as true.
- **Open questions:** decisions that tools and existing project guidance cannot answer.
- **Non-goals:** explicitly excluded behavior, integrations, and cleanup.

Skip the snapshot for mechanical changes with an obvious scope. Do not turn it into a full PRD, mandatory sign-off, stakeholder roster, target-release ceremony, or separate requirements system.

## Contract Closure

For a cross-cutting change whose observable semantic reaches product or runtime boundaries, add a compact contract-closure entry to the requirements snapshot or PR self-review note. Trace the changed semantic from its source to every relevant direct consumer, recording each boundary as `verified` or `N/A`.

Relevant boundaries include persistence, model/query projection, serializer/API, interactive UI, exports, background jobs, bootstrap/seed paths, and CI/test provisioning. Verify parity between equivalent user-visible paths, such as screen results and exports or downloads. Mechanical local changes skip contract closure.

Reviewers should request a missing boundary only when the changed contract actually reaches it. Contract closure is not a generic whole-repository audit.

## Conditional CI and Cache Closure

For changes to build images, dependency-install layers, migrations, bootstrap or initializers, generated artifacts, or test provisioning, trace each changed source to its conditional CI job predicates and cache keys. Prove the configuration with one representative changed file per relevant path class: each path must independently enable the expected job or cache invalidation, including the composition of positive rules.

Record `N/A` when the repository has no path-filtered CI or cache tied to the changed surface. Ordinary source-only changes do not require CI/cache closure, generic CI edits, cache busting, or full-suite reruns.

## Related-Issue Triage

Before creating a branch or worktree:

1. Revalidate the seed issue against current code and open PRs. Do not implement stale requests, duplicate already-shipped behavior, or start a competing fix for work covered by an existing PR.
2. Search nearby backlog issues using the seed's user outcome and affected implementation boundary. Read plausible matches and their acceptance criteria; this is a bounded related-ticket check, not a backlog-wide audit.
3. Group issues only when one small coherent PR can fully satisfy every linked acceptance criterion through the same implementation boundary and verification path. Keep one primary issue for branch/worktree naming and link every resolved issue in the PR. Keep unrelated or substantially broader work separate; shared keywords or a common deploy command are not sufficient.

Briefly record the grouping or keep-separate decision in the normal issue or PR location. An isolated fix stays single; two gaps in one release-finalization transaction may fit together; independent permission and terminal-input defects stay separate even if both mention deployment. No separate planning artifact, grouping quota, or runtime orchestration is needed.

## Learner Coverage During Issue Triage

For each issue not clearly learner-authored, inspect explicit provenance—author, `learner:` title or label, issue body, and cited evidence—rather than guessing from its appearance. Record exactly one learner coverage outcome in the existing location permitted by local policy. Absent a contrary local evidence-placement rule, record the concise outcome in the implementation PR:

- **Learner coverage: no action** — the issue is one-off, intentionally manual, judgment-only, or lacks source evidence.
- **Learner coverage: propose bug/feature** — a repeatable signal plausibly available to OMP Learner was missed, or detection needs a new capability.
- **Learner coverage: filed** — link the evidence-backed OMP Learner bug or feature request.

Do not auto-file a learner issue solely because an issue was manually authored.

## Process

1. Capture the user story and acceptance criteria in a GitHub issue.
2. Run [Related-Issue Triage](#related-issue-triage). For each issue not clearly learner-authored, inspect its explicit provenance and evidence and record one learner coverage outcome in the existing location permitted by local policy. Absent a contrary local evidence-placement rule, record the concise outcome in the implementation PR. File an OMP Learner bug or feature only for an evidence-backed current-signal miss or capability gap.
3. Before `git worktree add`, `dev branch-from`, or branch creation, inspect the target project's documented naming convention and existing worktree layout. Create the worktree and issue-linked branch with the exact project-local path and branch format plus a concise, meaningful outcome slug; do not use opaque abbreviations, a bare issue number, or infer an `issue-<number>/` prefix from GitHub alone.
4. Before opening a PR, verify its base is the repository's default branch or a documented release branch.
5. Implement the first coherent, reviewable change against project-local patterns and keep the diff scoped to the story.
6. Open a draft pull request as soon as that initial change can be pushed, linked to every issue in scope, using `docs/workflows/pull-request-management-workflow.md`. Do not wait for completed implementation, full self-review, passing QA, or finished screenshots. Honor explicit user/project publication exceptions; if publication is unavailable, report the exact prerequisite rather than silently deferring it. Before every handoff, including drafts, reconcile ownership and applicable existing labels through its [Repository Metadata](../../docs/workflows/pull-request-management-workflow.md#repository-metadata) gate.
7. Continue implementation in the same draft, pushing coherent progress and updating its canonical description with remaining work and truthful verification status. Then self-review the complete PR diff and truthfully record material findings and the `PASS`/`FAIL`/`BLOCKED` outcome in the existing location permitted by local policy. Without contrary local policy, record concise reviewer-relevant status in the top-level PR body.
8. Run targeted QA and truthfully record current-head status, the user-visible scenario and observed outcome, relevant automated-check status, and any failures or blockers—including `PASS`/`FAIL`/`BLOCKED` outcomes—in the existing location permitted by local policy. Without contrary local policy, record concise status in the same PR body. Revise the existing record in place after every implementation, review, or QA change; preserve issue links, genuine product questions, relevant images/captions and prerequisites, and reproducible testing instructions. Follow the pull-request management workflow for evidence placement, detailed evidence, genuine discussion, and remote read-back. Do not append routine report comments.
9. Mark the PR ready only after its acceptance criteria and current self-review and QA are complete. Record their outcomes in the locally permitted existing location; without contrary local policy, use the PR body. If an explicit user or maintainer waiver directs readiness despite incomplete work, record the missing evidence truthfully.
10. Resolve every actionable review finding or comment before marking the PR ready or merging by default using the pull-request comment-resolution workflow; after each fixup, repeat the complete self-review and targeted QA. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
11. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
12. After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the pull request ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. An explicit user or maintainer waiver may instead direct merge or closure; record the missing evidence and do not claim the result was verified.
13. After merge, fetch and prune remote refs (`git fetch --prune origin`) and check out the intended default/release branch.
14. Delete the merged issue branch locally and remotely only when it is agent-owned and no longer needed, then fast-forward the default/release branch from origin (`git pull --ff-only origin <branch>`). If local `main` has no work to preserve but cannot fast-forward, reset it to `origin/main`; never discard unpushed work silently. Any test-only follow-up must start on an issue-named topic branch before staging or committing; never commit it directly to `main`.
15. Run `git worktree prune` and inspect `git worktree list`; remove only stale or agent-owned worktrees, never another user's worktree.
16. For published changes, follow the project release docs: version/changelog if required, publish or deploy, poll the remote distribution source until the new version appears, reinstall from the remote source, and verify the installed version.
17. Record the final checked-out branch, sync state, and retained worktrees as release evidence. Verify `git status --short --branch` has no changed paths and the current branch is synchronized; when no user-owned branches are retained, `git branch --list` must contain only the intended default branch. Retain and report user-owned branches instead of deleting them.

## Output Contract

Report the concrete artifacts and evidence:

```text
Issue: <url or number>
Branch: <branch>
PR: <url or number>
Final branch/sync: <checked-out branch and fast-forward status>
Retained worktrees: <`git worktree list` result>
Learner coverage: <no action, proposed issue, or filed issue link>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
