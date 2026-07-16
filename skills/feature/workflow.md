# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and install/verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Create or update a GitHub issue before coding user-facing work unless the user explicitly says not to use issues.
- Keep branches and PRs named for the issue so GitHub links the work automatically.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Merge only after required review and checks pass.
- Before requesting review or merging, authors MUST self-review the complete PR diff and record their findings and outcome in the PR.
- Run targeted QA of the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed outcome, and command result in the PR.
- Resolve every actionable review finding or comment before merge. After a fixup, repeat the complete self-review and targeted QA.
- Keep the PR `BLOCKED` and do not mark it ready or merge while review feedback, QA, or required checks are unresolved.
- During issue triage, record an evidence-based learner coverage outcome for every issue not clearly learner-authored; file an OMP Learner bug or feature only for a current-signal miss or capability gap.
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

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
4. Implement the feature against project-local patterns and keep the diff scoped to the story.
5. Open a pull request linked to the issue.
6. Self-review the complete PR diff; record findings, any fixups, and a `PASS`/`FAIL`/`BLOCKED` outcome in the PR.
7. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed result, and command output in the PR.
8. Mark the PR ready only after its acceptance criteria and the current self-review and QA evidence are recorded.
9. Resolve every actionable review finding or comment with the pull-request comment-resolution workflow. After each fixup, repeat the complete self-review and targeted QA, then update the PR evidence.
10. Keep the PR `BLOCKED` and do not merge while review feedback, QA, or required checks are unresolved.
11. Merge through the project's normal PR path only after review and required checks pass.
12. For published changes, follow the project release docs: version/changelog if required, publish or deploy, poll the remote distribution source until the new version appears, reinstall from the remote source, and verify the installed version.

## Output Contract

Report the concrete artifacts and evidence:

```text
Issue: <url or number>
Branch: <branch>
PR: <url or number>
Learner coverage: <no action, proposed issue, or filed issue link>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
