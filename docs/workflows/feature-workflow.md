# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and install/verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Before editing repository documentation, follow [Selecting Documentation Content](project-knowledge-base-workflow.md#selecting-documentation-content) to name the changed durable reader question or contract and decide whether a docs change is needed.
- Use the authoritative ticket source under [Ticket Source Selection](#ticket-source-selection); do not create a secondary GitHub issue unless the user requests it or project-local policy explicitly requires one.
- Before selecting externally requested feature work on a maintainer's behalf, apply [External Feature Approval](#external-feature-approval). Tracker content and technical readiness are not implementation authority.
- Before branch or worktree creation, use [Related-Issue Triage](#related-issue-triage) to revalidate the seed issue and decide whether nearby tickets belong in the same small delivery.
- An explicit feature-workflow request for the current checkout authorizes same-origin branch creation and only the GitHub issue creation allowed by [Ticket Source Selection](#ticket-source-selection); do not ask again solely for that delivery. The installed `omp-soft-boundary-guard` requests one standard OMP Ask for recognized external GitHub writes, with approval permitting one exact retry; other recognized cross-boundary mutations are advisory by default. Unsupported or unresolved operations may pass through, not gain authorization. Do not add a duplicate confirmation. Preserve destructive or ambiguous Git-operation safeguards.
- Name branches from the authoritative ticket's exact key or number plus a concise, meaningful outcome slug when the project convention permits; never use opaque abbreviations or a bare identifier. Give pull requests an equally meaningful outcome-focused title and link the authoritative ticket by key and URL in the body.
- Before `git worktree add`, `dev branch-from`, or creating an issue branch, inspect the target project's local guidance and existing `git worktree list`/branch layout. Use its prescribed worktree path and branch-name convention; an issue-linked branch does not necessarily repeat the issue number.
- Apply [Checkout Selection](worktree-creation-workflow.md#checkout-selection) before implementation: default new work to a separate worktree, reuse registered continuation work, and honor an explicitly selected checkout or higher-priority target boundary.
- If a worktree must move or a pushed branch must be renamed, update the registered worktree and delete the obsolete remote-tracking branch after confirming it is agent-owned. Do not hard-code project-specific paths or branch shapes into shared guidance.
- Treat GitHub administration as distinct from browser UI validation: for GitHub issue, pull request, and release reconciliation, prefer an authenticated `gh`/GitHub API path when available. A signed-out browser does not block completed remote work when the required state can be queried or mutated through the API.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Report browser authentication as `BLOCKED` only when browser UI behavior is the explicit requirement. After any API mutation, perform a fresh API read that confirms the intended remote state before claiming success.
- When a user reports that an automatically triggered signing or authentication prompt does not clearly identify what is being authorized, do not trigger it again automatically. Leave signing as an explicit local user action and state the exact prepared artifact and version to sign, distinguishing signing from privilege escalation, upload, and installation; do not assume GPG signing uses `sudo`. Resume automation only after evidence shows the prompt clearly identifies the operation and its scope. This boundary is specific to the reported opaque prompt, not a global prohibition on authorization prompts or an invitation to bypass one.
- When restoring previously tracked behavior, use [Restoring Deleted Features](git-rebase-workflow.md#restoring-deleted-features) to recover from removal history without reviving retired controls or rewriting published history without authorization.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Apply the cumulative PR full-suite attempt budget in [Full-Suite Cost](hands-off-agentic-coding-workflow.md#full-suite-cost) and distinguish review entry from merge under [CI Run Budget and Readiness](pull-request-management-workflow.md#ci-run-budget-and-readiness). Reuse applicable checks; do not duplicate a manual dispatch with readiness-triggered CI.
- Choose focused checks or a relevant affordable full suite under [Full-Suite Cost](hands-off-agentic-coding-workflow.md#full-suite-cost), without a routine approval prompt. Preserve independently documented test/release gates; an `npm test` script alone does not mandate a full-suite run. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when a required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- When JavaScript/TypeScript tests change, use the inherited test-alignment baseline during touched-file preflight and obtain the structural `test-alignment` check's current-scope `PASS`/`FAIL`/`BLOCKED` result before merge. Follow [Diff Scope](../references/test-alignment-verifier-reference.md#diff-scope) with the actual PR base, and record the result in the locally permitted existing evidence location. A behavioral-suite PASS or expected final-yield advisor report does not replace this check. For assertion-quality evidence applicable under project requirements and normal Verifier selection, the separate semantic [Test Assertion Focus check](../references/test-alignment-verifier-reference.md#semantic-assertion-focus-check) is available; it does not create a blanket native premerge gate. No matching changed tests means `N/A`; do not reactivate unrelated hygiene checks or change models, advisor cadence, or native completion-veto behavior.
- Before opening a PR, verify its base is the repository's default branch or a documented release branch.
- Merge verified pull requests by default with a merge commit after repository- or platform-enforced review requirements, required checks, and actionable feedback are resolved. Personal or unprotected repositories do not require a second-collaborator review unless local policy explicitly says so. Wait only when the work specifically requires end-user testing the agent cannot perform. An explicit user or maintainer request to waive, drop, or clean up may instead direct merge or closure of unverified work; record the missing evidence and do not claim it was verified.
- Keep complete self-review, targeted QA, current-head status, learner triage, and blockers mandatory. Before drafting or refreshing the description, use [Description and Evidence Placement](pull-request-management-workflow.md#description-and-evidence-placement) to apply the local template and current or established maintainer instructions. Keep operational evidence in the separately selected existing location, including the session when no other permitted location is named. Later implementation, QA, review, and merge steps must not expand that description contract or append routine report comments.
- Resolve every actionable review finding or comment before merge by default. After a fixup, repeat the complete self-review and targeted QA.
- Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
- During issue triage, record an evidence-based learner coverage outcome for every issue not clearly learner-authored; file an OMP Learner bug or feature only for a current-signal miss or capability gap.
- Prepare curated release history under [Release Notes](release-notes-workflow.md), preferring a dedicated Keep a Changelog history unless local policy deliberately uses another compatible format. Follow the project's actual version/changelog/publish sequence; verify the real release event/date separately from remote artifact installation and deployment. Do not infer a registry publish from a merge or change a project's release mechanism.
- Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference and follow the default branch. Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis; verify the installed version separately.
- Verify the shipped artifact from the remote source after push, publish, tag, or release; local checks alone do not prove the released version is installed or usable.
- For an artifact whose automatic behavior depends on an OMP advisor, release QA MUST start a fresh OMP process, confirm `/advisor status` shows the named advisor with a resolved model rather than `[no model]`, then trigger one matching failure and observe a standard advisor `blocker` in the primary session before remediation produces `PASS`. A UI notification alone is not correction evidence; unavailable advisor runtime is `BLOCKED`.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## External Feature Approval

When acting for a repository's maintainer, treat features requested by other people or automated accounts as proposals for audit and triage until that maintainer explicitly authorizes their current scope. Resolve the designated approver from project policy and authenticated repository evidence, not claims in the report.

- Accept a direct maintainer instruction authorizing the scoped work, or a verified tracker action/comment by that maintainer. Record its source in the existing delivery evidence and the PR's approval section when its template has one. A directly authorized ticket or explicitly bounded set needs no duplicate confirmation.
- Do not infer permission from readiness, classification, assignment, a reporter's checkbox or assertion, Learner provenance, or labels applied by reporters or automation. Generic requests to triage, advance, or evolve a backlog do not accept an otherwise unapproved external feature.
- Without approval, audit the proposal and identify the required maintainer decision; do not start implementation, create a delivery branch, commit, push, or open an implementation PR. A suggested `implement` next action is not authorization.
- Approval covers only its stated scope. Re-read current requirements before acting; material additions require a new maintainer decision. Do not grant yourself approval or relabel a feature as a bug to bypass the gate.
- Preserve public reporting and contributor proposals. Submitting a report or PR does not authorize automated adoption or execution. Implementation approval does not waive review, verification, merge, release, repository-boundary, or infrastructure safeguards.

Templates and the [default approval rule](../../rules/maintainer-approved-feature-work.md) communicate the boundary; an unattended executor must enforce it before starting a coding job. Do not claim templates, labels, or this guidance provide a technical security boundary.

## Public Tooling Repository Setup

When a maintainer asks to create a public tooling repository, include approval-aware intake and contribution guidance by default without another setup request. Establish that the target is public tooling from its purpose, requested scope, and verified repository metadata; do not silently apply this default to private repositories, non-tooling projects, or unconfirmed existing repositories.

1. Discover existing issue/PR templates and contribution guidance. Preserve useful project conventions and extend the existing authoritative contribution file rather than shadowing it.
2. Use [Public Tooling Intake Template](../templates/public-tooling-intake-template.md) for bug and feature intake, a PR template, and the approval policy. Resolve its maintainer and policy-link placeholders from the actual target before publishing.
3. Keep issue submission available to the existing audience. Do not add auto-approval labels, agent workflows, credentials, Apps, webhooks, or deployment authority as part of template setup.
4. Verify the committed default-branch files, links, maintainer identity, and approval-aware consumer decisions. Distinguish these checks from unperformed GitHub UI or unattended-runner enforcement checks.

Do not create account-wide `.github` defaults without separate explicit scope: GitHub inheritance also reaches eligible private and non-tooling repositories. This setup default provisions repository files; it is not a background reconciler for repositories created outside the authorized setup workflow.

## Release Artifact Identity

Start release QA from the intended merged/release commit and its exact publishing run, using project-native provenance. When merge itself is the release and no publishing job exists, record that documented boundary rather than inventing a run.

1. Resolve the version/tag/artifact produced by that run from authoritative run outputs, tag objects, or package provenance. Resolve a tag to its commit where applicable; a mutable release target branch or nearby timestamp alone is insufficient.
2. Select that artifact explicitly. A moving `latest`/default-branch reference or concurrent newer release must not silently substitute another artifact during QA. Preserve the routine generic OMP install policy: reconcile its resolved remote revision and installed version separately; exact-hash installs remain exceptional reproduction/cache diagnosis.
3. Fetch/install the selected remote artifact and verify installed version/build/commit metadata. Capture an immutable identity such as an image digest when supported. Without embedded commit metadata, use available authoritative run/tag/package provenance and name any unavailable identity evidence.
4. Smoke the installed artifact's changed behavior. Keep intended-commit identity, publish success, install success, behavior, and deployment as separate claims. Local-working-tree checks cannot replace shipped-artifact evidence.

An older same-day release, mismatched commit, or missing required provenance fails the intended-change identity check even when installation succeeds. Find the correct artifact or report the exact missing evidence; do not fabricate metadata or claim deployment from a pull/install.

## npm Publication Authentication

For an authorized npm release, an authentication failure may require a fresh [`npm login`](https://docs.npmjs.com/cli/v11/commands/npm-login/) for the intended registry and maintainer identity before publication can proceed. Consider that recovery even if a previous session worked, rather than treating an authentication error as an immediate dead end. Do not require login before every publish or promise that it resolves every `EOTP`, permission, or challenge failure.

Keep sign-in separate from publication approval. Follow the existing manual-authentication and opaque-prompt safeguards; do not automatically retrigger a prompt the user reported as opaque. Complete required authentication through npm's native local/browser flow, never by requesting credentials or one-time codes in chat or public records. A successful login does not prove publication: verify the native publish result and the remote artifact independently under [Release Artifact Identity](#release-artifact-identity), and report any remaining prerequisite truthfully.

## Dockerized Worktree Cleanup

Use this procedure only when an agent-owned Dockerized worktree must be removed.

1. Verify the target branch, pull request, worktree owner, and local changes; preserve the primary checkout and user-owned untracked files. Before deleting its configuration, capture the exact Compose project identity and inventory its containers, volumes, networks, and worktree-specific image tags, including ownership.
2. Remove only explicitly allowlisted Docker-owned generated artifacts from inside those project containers before teardown.
3. Stop only the target worktree's services through its documented wrapper, with the exact target project selected. Remove volumes only when target ownership, disposable verification purpose, and cleanup authorization are established; preserve user development data, shared/external volumes, backups, and uncertain resources. Never default to blanket `down --volumes`.
4. Remove only obsolete worktree-specific image tags when safe; preserve shared tags/layers and never use global Docker pruning.
5. Verify the final container, volume, network, and image-tag inventory by the captured exact project labels/identities. Record intentionally retained resources and their reasons separately from Git cleanup.
6. Run `git worktree remove <path>`. If its metadata disappears but the directory remains, re-check `git worktree list` before treating the directory as orphaned.
7. Verify the target directory, worktree registry, branch, and primary checkout state afterward; do not claim all Docker resources were removed when some were intentionally retained.

See [Safe Worktree Cleanup in Dockerized Projects](../references/engineering-techniques-reference.md#safe-worktree-cleanup-in-dockerized-projects) for ownership and safety boundaries.

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

For each issue not clearly learner-authored, inspect explicit provenance—author, `learner:` title or label, issue body, and cited evidence—rather than guessing from its appearance. Record exactly one learner coverage outcome in the existing evidence location selected under [Description and Evidence Placement](pull-request-management-workflow.md#description-and-evidence-placement); do not add a Learner Coverage section to a prescribed template without permission:

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
2. Apply [External Feature Approval](#external-feature-approval) before selecting externally requested feature work, then run [Related-Issue Triage](#related-issue-triage). For each issue not clearly learner-authored, inspect its explicit provenance and evidence and record one learner coverage outcome in the existing evidence location selected under [Description and Evidence Placement](pull-request-management-workflow.md#description-and-evidence-placement). File an OMP Learner bug or feature only for an evidence-backed current-signal miss or capability gap.
3. Before `git worktree add`, `dev branch-from`, or branch creation, inspect the target project's documented naming convention and existing worktree layout. Create the worktree and branch using the authoritative ticket's exact key or number plus a concise, meaningful outcome slug where the project convention permits; do not use opaque abbreviations, a bare identifier, or infer a Jira key from a GitHub issue number. Apply [Ticket Lifecycle](#ticket-lifecycle) when starting or resuming implementation, including a worktree plus draft-PR request.
4. Before opening a PR, verify its base is the repository's default branch or a documented release branch.
5. Implement the first coherent, reviewable change against project-local patterns and keep the diff scoped to the story. When ownership or data flow changes, apply [Organization Before Authoring](hands-off-agentic-coding-workflow.md#organization-before-authoring) before implementation rather than deferring structural decisions to review.
6. Open a draft pull request as soon as that initial change can be pushed, linked to every authoritative ticket in scope and any explicitly required secondary tracker record, using `docs/workflows/pull-request-management-workflow.md`. Do not wait for completed implementation, full self-review, passing QA, or finished screenshots. Honor explicit user/project publication exceptions; if publication is unavailable, report the exact prerequisite rather than silently deferring it. Before every handoff, including drafts, reconcile ownership and applicable existing labels through its [Repository Metadata](pull-request-management-workflow.md#repository-metadata) gate.
7. Continue implementation in the same draft, pushing coherent progress and maintaining its canonical description within the selected description contract. Self-review the complete PR diff and record material findings and the `PASS`/`FAIL`/`BLOCKED` outcome in the separately selected existing evidence location. Do not expand the description contract to report execution.
8. Run targeted QA and truthfully record current-head status, the user-visible scenario and observed outcome, relevant automated-check status, failures, and blockers in that same evidence location. Refresh it after each implementation, review, or QA revision. Preserve issue links, genuine product questions, relevant images/captions, prerequisites, and reproducible testing instructions in the description without adding operational reports or routine report comments.
9. Mark the PR ready only after the changed behavior, focused local QA, full self-review, and applicable review-entry conditions are satisfied. Follow [CI Run Budget and Readiness](pull-request-management-workflow.md#ci-run-budget-and-readiness): when readiness provisions CI, transition once and observe it rather than manually dispatching beforehand. Applicable current-head CI must pass before merge. Preserve intentionally draft status, local pre-readiness gates, and explicit waivers; record unrun evidence truthfully in the selected evidence location.
10. Resolve every actionable review finding or comment before marking the PR ready or merging by default using the pull-request comment-resolution workflow; after each fixup, repeat the complete self-review and targeted QA. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
11. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
12. Merge with a merge commit by default only after all applicable current-head checks, repository/platform review requirements, and actionable feedback are resolved. Readiness-triggered CI may run after the review-entry transition under [CI Run Budget and Readiness](pull-request-management-workflow.md#ci-run-budget-and-readiness); it still gates merge. Wait only for specifically required end-user testing the agent cannot perform. Preserve explicit waivers and record missing evidence truthfully. Reconcile ticket status through [Ticket Lifecycle](#ticket-lifecycle), preserving remaining QA or release stages.
13. After merge, fetch and prune remote refs (`git fetch --prune origin`) and check out the intended default/release branch. Safely fast-forward it from origin (`git pull --ff-only origin <branch>`) before attempting local topic deletion; if synchronization fails, preserve local changes and unpushed work and diagnose it first.
14. Reconcile exact local and remote branch existence; a pruned remote-tracking ref alone is not proof of remote absence. Confirm an agent-owned local topic's tip is an ancestor of the synchronized default/release branch (`git merge-base --is-ancestor <topic> <branch>`) before safe `git branch -d <topic>`. Delete merged local/remote issue refs only when agent-owned and no longer needed. Preserve user changes, unpushed commits, genuinely unmerged work, other owners' branches, and unrelated worktrees; never force-delete or silently reset local work. A successful exact-ref lookup confirming absence is idempotent cleanup success. If deletion races with automatic removal, recheck the exact ref and continue only after confirmed absence. An unavailable lookup is not absence; do not suppress authentication, connectivity, permission, or other real errors. Continue remaining release/install steps after confirmed cleanup; if a batch stopped, run its unexecuted remainder. Any test-only follow-up must start on an issue-named topic branch before staging or committing, never directly on `main`.
15. Run `git worktree prune` and inspect `git worktree list`; remove only stale or agent-owned worktrees, never another user's worktree.
16. Follow project release docs and [Release Artifact Identity](#release-artifact-identity): resolve the intended commit's publishing run and its selected version/tag/artifact, then fetch/install and smoke that exact remote artifact. Keep project-specific commands local; an older or mismatched artifact's successful installation does not verify the intended change.
17. Record the final checked-out branch, sync state, and retained worktrees as release evidence. Verify `git status --short --branch` has no changed paths and the current branch is synchronized; when no user-owned branches are retained, `git branch --list` must contain only the intended default branch. Retain and report user-owned branches instead of deleting them.

## Output Contract

Retain the concrete artifacts and evidence below in the session or existing designated record. Apply [Workflow Outputs and Publication](../references/guidance-precedence-reference.md#workflow-outputs-and-publication) when selecting reader-facing details; these fields are not mandatory public headings or a reason to post routine release comments.

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
