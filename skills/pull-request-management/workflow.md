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
   After follow-up work resolves review comments, verify every addressed thread is resolved, restore ready-for-review status unless the PR was intentionally left draft, and re-check the remote PR state before reporting it ready.
4. Write a PR body with these sections when applicable:
   - Related links
   - Context: why the change exists
   - Implementation: what user-visible or maintainer-relevant behavior changed
   - Screenshots: uploaded images, placeholders, or `N/A — <reason>.`
   - Testing instructions
   - Review and QA evidence: concise material self-review findings and outcome, user-visible QA scenario and observed outcome, and automated check result or `BLOCKED` reason. Put detailed commands, output, and supporting evidence in one clearly labeled PR comment or linked traceable artifact when they would make the main body noisy.
   - Learner coverage: the triage outcome for each non-learner-authored issue—`no action`, `propose bug/feature`, or `filed` with its OMP Learner issue link
5. Use testing instructions that a reviewer can run without branch-author context.
6. Do not claim verification that was not performed.
7. Self-review the complete PR diff before requesting review or merging. Record material findings, fixups, and `PASS`/`FAIL`/`BLOCKED` outcome in the PR; keep generic process claims and raw diagnostics out of the main body unless they affect a reviewer decision.
8. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks. Record the exact scenario, observed outcome, and command result in the PR body or one clearly labeled linked evidence comment.
9. For every actionable inline review comment, follow the pull-request comment-resolution protocol: react `+1` for accepted/addressed feedback; react `-1` for rejected/not-applicable feedback. Avoid duplicate reactions, resolve the thread, and verify both the reaction and `reviewThread.isResolved` through GitHub. After a fixup, repeat this protocol with the complete self-review and targeted QA.
   Use `github-review-thread resolve ... --reaction +1` for accepted/addressed comments or `--reaction -1` for rejected/not-applicable comments; do not report completion until the helper’s final reaction and `reviewThread.isResolved` checks pass.
10. Resolve every actionable review finding or comment before marking the PR ready or merging by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
11. Keep the PR `BLOCKED` while review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup, follow that disposition, record the missing evidence, and do not claim verification that did not occur.
12. After all required review, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. An explicit user or maintainer waiver may instead direct merge or closure; record the missing evidence and do not claim the result was verified.

## Decision Rules

- Preserve existing `Fixes`, `Closes`, or issue-link semantics unless asked to change them.
- Prefer concise active language over file-by-file implementation summaries.
- Keep the main PR body reviewer-focused. Do not drop verification evidence; move detailed evidence to one discoverable PR comment or linked artifact when a concise summary is sufficient.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Write PR titles in title case. Read the first available title casing reference: local `docs/references/title-casing-reference.md`, then packaged `skill://pull-request-management/title-casing.md`.
- Keep actionable inline review comments incomplete until the expected `+1`/`-1` reaction and `reviewThread.isResolved: true` have been verified through GitHub.
- For UI changes, include screenshots or explain why screenshots do not apply.
- When screenshots are required, use the packaged `../../docs/workflows/upload-pr-screenshots-workflow.md` workflow for upload and PR body formatting.
- If a project has a local PR template or workflow, follow it over this generic workflow.
- When creating a PR from code changes, use the local or shared code-review workflow before finalizing the PR body unless the user explicitly asks to skip review.
- Do not stop at PR body drafting: include or update testing instructions unless the user explicitly says not to.

## Output Contract

Return the PR URL, draft/review state, base/head branches, and any verification or blockers.
