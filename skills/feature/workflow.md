# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and install/verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Create or update a GitHub issue before coding user-facing work unless the user explicitly says not to use issues.
- An explicit feature-workflow request for the current checkout authorizes same-origin issue and branch creation; do not ask again solely for that delivery. External or unresolved GitHub writes defer to `omp-repository-boundary-guard`'s single standard Ask; do not add another confirmation. Preserve destructive or ambiguous Git-operation safeguards.
- Keep branches and PRs named for the issue so GitHub links the work automatically.
- Treat GitHub administration as distinct from browser UI validation: for non-UI issue, pull request, and release reconciliation, prefer an authenticated `gh`/GitHub API path when available. A signed-out browser does not block completed remote work when the required state can be queried or mutated through the API.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Report browser authentication as `BLOCKED` only when browser UI behavior is the explicit requirement. After any API mutation, perform a fresh API read that confirms the intended remote state before claiming success.
- Before opening a PR, verify its base is the repository's default branch or a documented release branch.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Merge verified pull requests by default with a merge commit after repository- or platform-enforced review requirements, required checks, and actionable feedback are resolved. Personal or unprotected repositories do not require a second-collaborator review unless local policy explicitly says so. Wait only when the work specifically requires end-user testing the agent cannot perform. An explicit user or maintainer request to waive, drop, or clean up may instead direct merge or closure of unverified work; record the missing evidence and do not claim it was verified.
- Before requesting review or merging, authors MUST self-review the complete PR diff and record their findings and outcome in the PR.
- Run targeted QA of the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed outcome, and command result in the PR.
- Resolve every actionable review finding or comment before merge by default. After a fixup, repeat the complete self-review and targeted QA.
- Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence truthfully, and do not claim verification that did not occur.
- During issue triage, record an evidence-based learner coverage outcome for every issue not clearly learner-authored; file an OMP Learner bug or feature only for a current-signal miss or capability gap.
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference and follow the default branch. Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis; verify the installed version separately.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.


## Requirements Snapshot

For ambiguous or cross-cutting feature work, add a lightweight requirements snapshot to the issue or planning artifact that already owns the work:

- **Problem:** the user or maintainer problem being solved.
- **Desired result/Gold:** the observable outcome.
- **Acceptance criteria:** how completion will be recognized.
- **Assumptions:** facts or constraints currently being taken as true.
- **Open questions:** decisions that tools and existing project guidance cannot answer.
- **Non-goals:** explicitly excluded behavior, integrations, and cleanup.

Skip the snapshot for mechanical changes with an obvious scope. Do not turn it into a full PRD, mandatory sign-off, stakeholder roster, target-release ceremony, or separate requirements system.

## Learner Coverage During Issue Triage

For each issue not clearly learner-authored, inspect explicit provenance—author, `learner:` title or label, issue body, and cited evidence—rather than guessing from its appearance. Record exactly one learner coverage outcome in the implementation PR:

- **Learner coverage: no action** — the issue is one-off, intentionally manual, judgment-only, or lacks source evidence.
- **Learner coverage: propose bug/feature** — a repeatable signal plausibly available to OMP Learner was missed, or detection needs a new capability.
- **Learner coverage: filed** — link the evidence-backed OMP Learner bug or feature request.

Do not auto-file a learner issue solely because an issue was manually authored.

## Process

1. Capture the user story and acceptance criteria in a GitHub issue.
2. For each issue not clearly learner-authored, record a learner coverage outcome from the issue's explicit provenance and evidence. File an OMP Learner bug or feature only for an evidence-backed current-signal miss or capability gap.
3. Create a branch named for the issue number and short feature slug.
4. Before opening a PR, verify its base is the repository's default branch or a documented release branch.
5. Implement the feature against project-local patterns and keep the diff scoped to the story.
6. Open a draft pull request linked to the issue.
7. Self-review the complete PR diff; record material findings, decisions, limitations, fixups, blockers, and a `PASS`/`FAIL`/`BLOCKED` outcome in the PR, omitting generic process claims and internal diagnostics unless they affect a reviewer decision.
8. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks; record the concise status in the PR body. When exact commands, scope, results, self-review details, or supporting links would make it noisy, put them in one clearly labeled PR comment or linked traceable artifact, preserving `PASS`, `FAIL`, and `BLOCKED` outcomes.
9. Mark the PR ready only after its acceptance criteria and the current self-review and QA evidence are recorded by default. If an explicit user or maintainer waiver directs readiness, record the missing evidence truthfully.
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
