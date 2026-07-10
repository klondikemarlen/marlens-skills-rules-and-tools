# Pull Request Management Workflow

Use when creating or updating a pull request.

## Required Inputs

- Current branch name and base branch.
- Diff or commit range being proposed.
- Related issue/ticket URLs, if any.
- Existing PR body, when updating.

## Process

1. Inspect repository status and preserve unrelated local work.
2. Read the branch diff and recent commits before drafting text.
3. Create PRs as drafts. Before pushing changes to an existing open PR, convert it back to draft unless the user asks to keep it ready for review.
   When the follow-up work resolves review comments, use `docs/workflows/pull-request-comment-resolution-workflow.md` and restore ready-for-review status after resolved thread state is verified unless the PR was intentionally left draft.
4. Write a PR body with these sections when applicable:
   - Related links
   - Context: why the change exists
   - Implementation: what user-visible or maintainer-relevant behavior changed
   - Screenshots: uploaded images, placeholders, or `N/A — <reason>.`
   - Testing instructions
5. Use testing instructions that a reviewer can run without branch-author context.
6. Do not claim verification that was not performed.

## Decision Rules

- Preserve existing `Fixes`, `Closes`, or issue-link semantics unless asked to change them.
- Prefer concise active language over file-by-file implementation summaries.
- Write PR titles in title case. Read the first available title casing reference: local `docs/references/title-casing-reference.md`, then packaged `skill://pull-request-management/title-casing.md`.
- For UI changes, include screenshots or explain why screenshots do not apply.
- When screenshots are required, use `docs/workflows/upload-pr-screenshots-workflow.md` for upload and PR body formatting.
- If a project has a local PR template or workflow, follow it over this generic workflow.
- When creating a PR from code changes, use the local or shared code-review workflow before finalizing the PR body unless the user explicitly asks to skip review.
- Do not stop at PR body drafting: include or update testing instructions unless the user explicitly says not to.

## Output Contract

Return the PR URL, draft/review state, base/head branches, and any verification or blockers.
