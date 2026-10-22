# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and install/verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Before editing repository documentation, follow [Selecting Documentation Content](../../docs/workflows/project-knowledge-base-workflow.md#selecting-documentation-content) to name the changed durable reader question or contract and decide whether a docs change is needed.
- Use the authoritative ticket source under [Ticket Source Selection](#ticket-source-selection); do not create a secondary GitHub issue unless the user requests it or project-local policy explicitly requires one.
- Before branch or worktree creation, use [Related-Issue Triage](#related-issue-triage) to revalidate the seed issue and decide whether nearby tickets belong in the same small delivery.
- An explicit feature-workflow request for the current checkout authorizes same-origin branch creation and only the GitHub issue creation allowed by [Ticket Source Selection](#ticket-source-selection); do not ask again solely for that delivery. External or unresolved GitHub writes remain subject to `omp-soft-boundary-guard` advisory warnings when installed. A standard OMP Ask applies only when a caller explicitly uses the guard's strict programmatic API; do not add another confirmation. Preserve destructive or ambiguous Git-operation safeguards.
- Name branches from the authoritative ticket's exact key or number plus a concise, meaningful outcome slug when the project convention permits; never use opaque abbreviations or a bare identifier. Give pull requests an equally meaningful outcome-focused title and link the authoritative ticket by key and URL in the body.
- Before `git worktree add`, `dev branch-from`, or creating an issue branch, inspect the target project's local guidance and existing `git worktree list`/branch layout. Use its prescribed worktree path and branch-name convention; an issue-linked branch does not necessarily repeat the issue number.
- Apply [Checkout Selection](../worktree-creation/workflow.md#checkout-selection) before implementation: default new work to a separate worktree, reuse registered continuation work, and honor an explicitly selected checkout or higher-priority target boundary.
- If a worktree must move or a pushed branch must be renamed, update the registered worktree and delete the obsolete remote-tracking branch after confirming it is agent-owned. Do not hard-code project-specific paths or branch shapes into shared guidance.
- Treat GitHub administration as distinct from browser UI validation: for GitHub issue, pull request, and release reconciliation, prefer an authenticated `gh`/GitHub API path when available. A signed-out browser does not block completed remote work when the required state can be queried or mutated through the API.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Report browser authentication as `BLOCKED` only when browser UI behavior is the explicit requirement. After any API mutation, perform a fresh API read that confirms the intended remote state before claiming success.
- When restoring previously tracked behavior, use [Restoring Deleted Features](../../docs/workflows/git-rebase-workflow.md#restoring-deleted-features) to recover from removal history without reviving retired controls or rewriting published history without authorization.
- Before opening a PR, verify its base is the repository's default branch or a documented release branch.
- Choose focused checks or a relevant affordable full suite under [Full-Suite Cost](../hands-off-agentic-coding/workflow.md#full-suite-cost), without a routine approval prompt. Preserve independently documented test/release gates; an `npm test` script alone does not mandate a full-suite run. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when a required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- When JavaScript/TypeScript tests change, use the inherited test-alignment baseline during touched-file preflight and obtain the declared check's current-scope `PASS`/`FAIL`/`BLOCKED` result before merge. Follow [Diff Scope](../../docs/references/test-alignment-verifier-reference.md#diff-scope) with the actual PR base, and record the result in the locally permitted existing evidence location. A behavioral-suite PASS or expected final-yield advisor report does not replace this check. No matching changed tests means `N/A`; do not reactivate unrelated hygiene checks or change models, advisor cadence, or native completion-veto behavior.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Merge verified pull requests by default with a merge commit after repository- or platform-enforced review requirements, required checks, and actionable feedback are resolved. Personal or unprotected repositories do not require a second-collaborator review unless local policy explicitly says so. Wait only when the work specifically requires end-user testing the agent cannot perform. An explicit user or maintainer request to waive, drop, or clean up may instead direct merge or closure of unverified work; record the missing evidence and do not claim it was verified.
- Keep complete self-review, targeted QA, current-head status, learner triage, and blockers mandatory. Before drafting or refreshing the description, use [Description and Evidence Placement](../../docs/workflows/pull-request-management-workflow.md#description-and-evidence-placement) to apply the local template and current or established maintainer instructions. Keep operational evidence in the separately selected existing location, including the session when no other permitted location is named. Later implementation, QA, review, and merge steps must not expand that description contract or append routine report comments.
- Resolve every actionable review finding or comment before merge by default. After a fixup, repeat the complete self-review and targeted QA.
- Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
- During issue triage, record an evidence-based learner coverage outcome for every issue not clearly learner-authored; file an OMP Learner bug or feature only for a current-signal miss or capability gap.
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference and follow the default branch. Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis; verify the installed version separately.
- For an artifact whose automatic behavior depends on an OMP advisor, release QA MUST start a fresh OMP process, confirm `/advisor status` shows the named advisor with a resolved model rather than `[no model]`, then trigger one matching failure and observe a standard advisor `blocker` in the primary session before remediation produces `PASS`. A UI notification alone is not correction evidence; unavailable advisor runtime is `BLOCKED`.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## Release Artifact Identity

Start release QA from the intended merged/release commit and its exact publishing run, using project-native provenance. When merge itself is the release and no publishing job exists, record that documented boundary rather than inventing a run.

1. Resolve the version/tag/artifact produced by that run from authoritative run outputs, tag objects, or package provenance. Resolve a tag to its commit where applicable; a mutable release target branch or nearby timestamp alone is insufficient.
2. Select that artifact explicitly. A moving `latest`/default-branch reference or concurrent newer release must not silently substitute another artifact during QA. Preserve the routine generic OMP install policy: reconcile its resolved remote revision and installed version separately; exact-hash installs remain exceptional reproduction/cache diagnosis.
3. Fetch/install the selected remote artifact and verify installed version/build/commit metadata. Capture an immutable identity such as an image digest when supported. Without embedded commit metadata, use available authoritative run/tag/package provenance and name any unavailable identity evidence.
4. Smoke the installed artifact's changed behavior. Keep intended-commit identity, publish success, install success, behavior, and deployment as separate claims. Local-working-tree checks cannot replace shipped-artifact evidence.

An older same-day release, mismatched commit, or missing required provenance fails the intended-change identity check even when installation succeeds. Find the correct artifact or report the exact missing evidence; do not fabricate metadata or claim deployment from a pull/install.

## Dockerized Worktree Cleanup

Use this procedure only when an agent-owned Dockerized worktree must be removed.

1. Verify the target branch, pull request, worktree owner, and local changes; preserve the primary checkout and user-owned untracked files. Before deleting its configuration, capture the exact Compose project identity and inventory its containers, volumes, networks, and worktree-specific image tags, including ownership.
2. Remove only explicitly allowlisted Docker-owned generated artifacts from inside those project containers before teardown.
3. Stop only the target worktree's services through its documented wrapper, with the exact target project selected. Remove volumes only when target ownership, disposable verification purpose, and cleanup authorization are established; preserve user development data, shared/external volumes, backups, and uncertain resources. Never default to blanket `down --volumes`.
4. Remove only obsolete worktree-specific image tags when safe; preserve shared tags/layers and never use global Docker pruning.
5. Verify the final container, volume, network, and image-tag inventory by the captured exact project labels/identities. Record intentionally retained resources and their reasons separately from Git cleanup.
6. Run `git worktree remove <path>`. If its metadata disappears but the directory remains, re-check `git worktree list` before treating the directory as orphaned.
7. Verify the target directory, worktree registry, branch, and primary checkout state afterward; do not claim all Docker resources were removed when some were intentionally retained.

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

For each issue not clearly learner-authored, inspect explicit provenance—author, `learner:` title or label, issue body, and cited evidence—rather than guessing from its appearance. Record exactly one learner coverage outcome in the existing evidence location selected under [Description and Evidence Placement](../../docs/workflows/pull-request-management-workflow.md#description-and-evidence-placement); do not add a Learner Coverage section to a prescribed template without permission:

- **Learner coverage: no action** — the issue is one-off, intentionally manual, judgment-only, or lacks source evidence.
- **Learner coverage: propose bug/feature** — a repeatable signal plausibly available to OMP Learner was missed, or detection needs a new capability.
- **Learner coverage: filed** — link the evidence-backed OMP Learner bug or feature request.

Do not auto-file a learner issue solely because an issue was manually authored.

## Ticket Source Selection

Before work starts, resolve the authoritative source from project policy and current tracker records. Verify the ticket in its owning tracker and confirm its project and current requirements/status; a key, URL, branch name, or mirror alone does not establish authority. Carry the exact authoritative key and URL with the requirements and use that source for assignment and status transitions under [Ticket Lifecycle](#ticket-lifecycle).

- **Verified Jira ticket:** Reuse its exact Jira key and URL as authoritative. Keep the key in the branch/worktree name where project conventions allow, capture requirements on the Jira ticket, and link the Jira record by key and URL in the PR. Do not create a GitHub mirror unless the user requests one or project-local policy explicitly requires a secondary tracker.
- **Verified GitHub issue:** Reuse its exact number and URL as authoritative, including GitHub's native assignment, status, and PR-link semantics. Do not create a Jira mirror unless the user requests one or project-local policy explicitly requires it.
- **No authoritative ticket:** Follow project-local policy; a GitHub-native project creates its normal GitHub issue before implementation. Preserve an explicit user opt-out or a local policy that designates a different authoritative tracker.
- **Explicit secondary mirror:** Create a secondary record only when the user requests it or project-local policy explicitly requires it. Keep the originating ticket authoritative, record both exact keys and URLs, link both records from the PR, and update the secondary tracker only as project workflow requires. Never infer a Jira key from a GitHub issue number.

## Ticket Lifecycle

Treat tracker updates as part of doing the work, not optional handoff cleanup. A request to start work on a named ticket includes its routine assignment and status updates within the authorized tracker/project boundary; it does not authorize unrelated ticket changes, new boards, workflow administration, or bypassing permissions.

1. **Resolve the ticket and workflow.** Read project-local policy, the authoritative ticket, current assignees/status, board membership, and available workflow transitions or status options. Use the project's mapping for active work, review, QA, release, and completion; do not guess the next column by display order. Update linked secondary trackers only when the project's workflow requires it. Do not advance parent, dependency, or merely related tickets as if they were completed.
2. **Claim actual work at the start.** Before implementation, including creating/resuming its worktree or spinning up a draft PR, assign the requesting person unless another owner is explicitly designated. Resolve a service-specific identity: GitHub login for GitHub, Jira account ID for Jira. Use the authenticated identity only when verified as the intended person, not merely because it is the automation credential. An explicit assignment request permits that reassignment; otherwise resolve a conflicting existing owner rather than silently taking their ticket. Preserve unrelated assignees/metadata where the platform supports them. Read-only triage or report drafting alone does not claim ownership.
3. **Enter active work.** Move the ticket to the supported In Progress equivalent when implementation starts. A draft PR normally remains active work; move to review only when the project's review-entry condition is met. Rework returns to active work only when that transition matches the actual workflow. On resumption, reconcile rather than blindly resetting a ticket already in a valid later state.
4. **Use the platform's real controls.** For Jira, discover currently allowed issue transition IDs and any required fields; board columns may map several statuses. For GitHub, assignment and open/closed issue state are separate from a Projects item's Status field. Resolve the actual project/item/field/option IDs and authorized target board; add a missing item to the documented work board when required and authorized. Use an existing documented label-based workflow only where that is the project's convention. Do not invent labels or create project fields to simulate a missing board. No board/status workflow means status updates are `N/A`, not a fabricated In Progress value.
5. **Advance on evidence, not just merge.** At review, merge, QA, and release, select the state matching what actually happened. After merge this may be Ready for QA or Ready for Release; use Done/Closed only when the project's completion conditions are met. GitHub closing keywords and board automation may act independently: inspect their configured effect before using them when closure could be premature. Verify automation's result instead of assuming merge updated every tracker. A waived check is not a passed check; dropped work uses the project's cancellation disposition, not a success state.
6. **Reconcile safely and verify.** Re-read current ownership/state immediately before a mutation, preserve concurrent human updates, and skip already-satisfied changes. After each assignment or transition, read back the authoritative ticket and applicable project item to confirm the actual owner/status. If automation has not advanced it, perform the supported authorized transition and verify again. Ask only for an unresolved identity, target board, meaningful owner conflict, or genuinely ambiguous transition after inspection.
7. **Report exact gaps without hiding them.** If access, permissions, or a required transition is unavailable, report the ticket, intended update, and missing prerequisite in the existing evidence location. Continue independently reachable coding/PR work unless that missing action is itself a required gate. Do not claim assignment or status synchronization succeeded, silently waive the action, or add routine tracker-report comments. At handoff, distinguish code/PR completion from outstanding tracker, QA, or release actions.

## Process

1. Capture the user story and acceptance criteria on the authoritative ticket selected under [Ticket Source Selection](#ticket-source-selection), preserving its exact key and URL. Create a GitHub issue only when that source-selection rule calls for one.
2. Run [Related-Issue Triage](#related-issue-triage). For each issue not clearly learner-authored, inspect its explicit provenance and evidence and record one learner coverage outcome in the existing evidence location selected under [Description and Evidence Placement](../../docs/workflows/pull-request-management-workflow.md#description-and-evidence-placement). File an OMP Learner bug or feature only for an evidence-backed current-signal miss or capability gap.
3. Before `git worktree add`, `dev branch-from`, or branch creation, inspect the target project's documented naming convention and existing worktree layout. Create the worktree and branch using the authoritative ticket's exact key or number plus a concise, meaningful outcome slug where the project convention permits; do not use opaque abbreviations, a bare identifier, or infer a Jira key from a GitHub issue number. Apply [Ticket Lifecycle](#ticket-lifecycle) when starting or resuming implementation, including a worktree plus draft-PR request.
4. Before opening a PR, verify its base is the repository's default branch or a documented release branch.
5. Implement the first coherent, reviewable change against project-local patterns and keep the diff scoped to the story.
6. Open a draft pull request as soon as that initial change can be pushed, linked to every authoritative ticket in scope and any explicitly required secondary tracker record, using `docs/workflows/pull-request-management-workflow.md`. Do not wait for completed implementation, full self-review, passing QA, or finished screenshots. Honor explicit user/project publication exceptions; if publication is unavailable, report the exact prerequisite rather than silently deferring it. Before every handoff, including drafts, reconcile ownership and applicable existing labels through its [Repository Metadata](../../docs/workflows/pull-request-management-workflow.md#repository-metadata) gate.
7. Continue implementation in the same draft, pushing coherent progress and maintaining its canonical description within the selected description contract. Self-review the complete PR diff and record material findings and the `PASS`/`FAIL`/`BLOCKED` outcome in the separately selected existing evidence location. Do not expand the description contract to report execution.
8. Run targeted QA and truthfully record current-head status, the user-visible scenario and observed outcome, relevant automated-check status, failures, and blockers in that same evidence location. Refresh it after each implementation, review, or QA revision. Preserve issue links, genuine product questions, relevant images/captions, prerequisites, and reproducible testing instructions in the description without adding operational reports or routine report comments.
9. Mark the PR ready only after its acceptance criteria and current self-review and QA are complete. Record outcomes in the selected evidence location; readiness and merge administration do not authorize new description sections. If an explicit user or maintainer waiver directs readiness despite incomplete work, record the missing evidence truthfully.
10. Resolve every actionable review finding or comment before marking the PR ready or merging by default using the pull-request comment-resolution workflow; after each fixup, repeat the complete self-review and targeted QA. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
11. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
12. After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the pull request ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. An explicit user or maintainer waiver may instead direct merge or closure; record the missing evidence and do not claim the result was verified. Reconcile ticket status through [Ticket Lifecycle](#ticket-lifecycle), preserving any remaining QA or release stage.
13. After merge, fetch and prune remote refs (`git fetch --prune origin`) and check out the intended default/release branch. Safely fast-forward it from origin (`git pull --ff-only origin <branch>`) before attempting local topic deletion; if synchronization fails, preserve local changes and unpushed work and diagnose it first.
14. Reconcile exact local and remote branch existence; a pruned remote-tracking ref alone is not proof of remote absence. Confirm an agent-owned local topic's tip is an ancestor of the synchronized default/release branch (`git merge-base --is-ancestor <topic> <branch>`) before safe `git branch -d <topic>`. Delete merged local/remote issue refs only when agent-owned and no longer needed. Preserve user changes, unpushed commits, genuinely unmerged work, other owners' branches, and unrelated worktrees; never force-delete or silently reset local work. A successful exact-ref lookup confirming absence is idempotent cleanup success. If deletion races with automatic removal, recheck the exact ref and continue only after confirmed absence. An unavailable lookup is not absence; do not suppress authentication, connectivity, permission, or other real errors. Continue remaining release/install steps after confirmed cleanup; if a batch stopped, run its unexecuted remainder. Any test-only follow-up must start on an issue-named topic branch before staging or committing, never directly on `main`.
15. Run `git worktree prune` and inspect `git worktree list`; remove only stale or agent-owned worktrees, never another user's worktree.
16. Follow project release docs and [Release Artifact Identity](#release-artifact-identity): resolve the intended commit's publishing run and its selected version/tag/artifact, then fetch/install and smoke that exact remote artifact. Keep project-specific commands local; an older or mismatched artifact's successful installation does not verify the intended change.
17. Record the final checked-out branch, sync state, and retained worktrees as release evidence. Verify `git status --short --branch` has no changed paths and the current branch is synchronized; when no user-owned branches are retained, `git branch --list` must contain only the intended default branch. Retain and report user-owned branches instead of deleting them.

## Output Contract

Retain the concrete artifacts and evidence below in the session or existing designated record. Apply [Workflow Outputs and Publication](../../docs/references/guidance-precedence-reference.md#workflow-outputs-and-publication) when selecting reader-facing details; these fields are not mandatory public headings or a reason to post routine release comments.

```text
Ticket: <authoritative tracker key and URL>
Branch: <branch>
PR: <url or number>
Final branch/sync: <checked-out branch and fast-forward status>
Retained worktrees: <`git worktree list` result>
Learner coverage: <no action, proposed issue, or filed issue link>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
