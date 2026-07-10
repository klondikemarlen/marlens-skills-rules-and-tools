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
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Verify the shipped artifact from the remote source after push, publish, tag, or release; local checks alone do not prove the released version is installed or usable.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## Process

1. Capture the user story and acceptance criteria in a GitHub issue.
2. Create a branch named for the issue number and short feature slug.
3. Implement the feature against project-local patterns and keep the diff scoped to the story.
4. Open a draft pull request linked to the issue using `docs/workflows/pull-request-management-workflow.md`.
5. Review the diff from the user's perspective and run the smallest tests or QA path that covers the change.
6. Mark the PR ready only after the acceptance criteria are satisfied and verification is recorded.
7. Merge through the project's normal PR path after review and required checks pass, so GitHub records the review/merge path.
8. For published changes, follow the project release docs: version/changelog if required, publish or deploy, poll the remote distribution source until the new version appears, then verify the shipped artifact itself, such as installing the pushed OMP plugin commit/tag, installing the packed or published npm package, running the released CLI binary, or pulling and smoke-testing the pushed Docker image. Keep project-specific install commands in the target repo’s local docs.

## Output Contract

Report the concrete artifacts and evidence:

```text
Issue: <url or number>
Branch: <branch>
PR: <url or number>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
