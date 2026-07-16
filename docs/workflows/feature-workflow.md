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
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Verify the shipped artifact from the remote source after push, publish, tag, or release; local checks alone do not prove the released version is installed or usable.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## Process

1. Capture the user story and acceptance criteria in a GitHub issue.
2. Create a branch named for the issue number and short feature slug.
3. Implement the feature against project-local patterns and keep the diff scoped to the story.
4. Open a draft pull request linked to the issue using `docs/workflows/pull-request-management-workflow.md`.
5. Self-review the complete PR diff; record findings, any fixups, and a `PASS`/`FAIL`/`BLOCKED` outcome in the PR.
6. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed result, and command output in the PR.
7. Mark the PR ready only after its acceptance criteria and the current self-review and QA evidence are recorded.
8. Resolve every actionable review finding or comment with the pull-request comment-resolution workflow. After each fixup, repeat the complete self-review and targeted QA, then update the PR evidence.
9. Keep the PR `BLOCKED` and do not merge while review feedback, QA, or required checks are unresolved.
10. Merge through the project's normal PR path only after review and required checks pass, so GitHub records the review/merge path.
11. For published changes, follow the project release docs: version/changelog if required, publish or deploy, poll the remote distribution source until the new version appears, then verify the shipped artifact itself, such as installing the pushed OMP plugin commit/tag, installing the packed or published npm package, running the released CLI binary, or pulling and smoke-testing the pushed Docker image. Keep project-specific install commands in the target repo’s local docs.

## Output Contract

Report the concrete artifacts and evidence:

```text
Issue: <url or number>
Branch: <branch>
PR: <url or number>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
