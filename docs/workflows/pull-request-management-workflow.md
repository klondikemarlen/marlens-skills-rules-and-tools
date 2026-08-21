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
   Before correcting accepted review feedback, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit whose body records the concern, corrective outcome, and PR scope checked when that context is not obvious from the subject.
4. Write a reviewer-focused PR body with these sections when applicable:
   - Related links
   - Context: why the change exists.
   - Implementation: what user-visible or maintainer-relevant behavior changed.
   - Screenshots: uploaded images, placeholders, or `N/A — <reason>.`
   - Testing instructions: runnable steps a reviewer can execute without branch-author context.
   - Review and QA status: a concise status containing material self-review findings and outcome, the user-visible QA scenario and observed outcome, and the automated-check status when it affects a reviewer decision. Do not add reviewer-facing `Verification` or `Evidence` sections, raw command logs, test counts, internal diagnostics, or generic claims that a diff was reviewed.
   - Learner coverage: a concise triage outcome for each non-learner-authored issue—`no action`, `propose bug/feature`, or `filed` with its OMP Learner issue link. Keep `no action` to one line when no further context is needed.
5. After creating or updating a PR body, read the PR from GitHub and confirm its intended sections and links are present. A local draft or body artifact is input only; the observed remote body is the active source of truth.
6. Use testing instructions that a reviewer can run without branch-author context.
7. Do not claim verification that was not performed.
8. Self-review the complete PR diff before requesting review or merging. Record material findings, decisions, limitations, fixups, blockers, and a `PASS`/`FAIL`/`BLOCKED` outcome; omit generic process claims and internal diagnostics unless they affect a reviewer decision.
9. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks. Record the concise status in the PR body; when exact commands, scope, results, self-review details, or supporting links would make it noisy, put them in one clearly labeled PR comment or linked traceable artifact. That detailed record must preserve `PASS`, `FAIL`, and `BLOCKED` outcomes.
10. For every actionable inline review comment, follow the pull-request comment-resolution protocol: react `+1` for accepted/addressed feedback; react `-1` for rejected/not-applicable feedback. Avoid duplicate reactions, resolve the thread, and verify both the reaction and `reviewThread.isResolved` through GitHub. After a fixup, repeat this protocol with the complete self-review and targeted QA.
11. Resolve every actionable review finding or comment before marking the PR ready or merging by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
12. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence and do not claim verification that did not occur.
13. After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. If the user explicitly requests a waiver, drop, or cleanup, record the missing evidence and do not claim the result was verified.

## Stacked Pull Request Merge

Use this only when a pull request is stacked or the ordinary merge endpoint returns the stacked-merge `403`.

1. Re-read the pull request and capture its current head SHA and required merge method.
2. Use this authenticated `gh` and `jq` procedure; replace the uppercase values and select the repository's required merge method.

   ```bash
   repo=OWNER/REPO
   number=PULL_NUMBER
   method=merge
   head_sha="$(gh pr view "$number" --repo "$repo" --json headRefOid --jq .headRefOid)"
   result="$(gh api --method PUT "repos/$repo/pulls/$number/merge-async" \
     -f sha="$head_sha" \
     -f merge_method="$method" \
     -f merge_action=default)"
   status="$(jq -r .status <<<"$result")"
   attempts=0
   max_attempts=60

   if [ "$status" = pending ] || [ "$status" = enqueued ]; then
     uuid="$(jq -r .details.uuid <<<"$result")"
     while [ "$status" = pending ] || [ "$status" = enqueued ]; do
       [ "$attempts" -lt "$max_attempts" ] || break
       sleep 2
       result="$(gh api "repos/$repo/pulls/$number/merge-async/$uuid")"
       status="$(jq -r .status <<<"$result")"
       attempts=$((attempts + 1))
     done
   fi

   case "$status" in
     merged) ;;
     failed)
       printf 'Asynchronous merge failed after %s polls. Last response:\n%s\n' "$attempts" "$result" >&2
       false
       ;;
     *)
       printf 'Asynchronous merge ended as %s after %s polls. Last response:\n%s\n' "$status" "$attempts" "$result" >&2
       false
       ;;
   esac
   ```

3. Re-read the pull request, verify its merged state, merge commit, and base branch, then fetch remote refs before branch cleanup.

See [GitHub Asynchronous Merge for PR Stacks](../references/engineering-techniques-reference.md#github-asynchronous-merge-for-pr-stacks) for the safety boundary.

## Decision Rules

- Preserve existing `Fixes`, `Closes`, or issue-link semantics unless asked to change them.
- Prefer concise active language over file-by-file implementation summaries.
- Keep the main PR body reviewer-focused. Preserve all verification evidence, but put detailed commands and results in one discoverable, clearly labeled PR comment or linked artifact when they would make the body noisy; do not prescribe reviewer-facing `Verification` or `Evidence` sections.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Write PR titles in title case. Read the first available title casing reference: local `docs/references/title-casing-reference.md`, then packaged `skill://pull-request-management/title-casing.md`.
- Keep actionable inline review comments incomplete until the expected `+1`/`-1` reaction and `reviewThread.isResolved: true` have been verified through GitHub.
- When a corrective branch needs an explicit CI rerun and its workflow supports `workflow_dispatch`, run `gh workflow run <workflow> --ref <branch>`, identify the new run, verify its branch and head SHA match the intended commit, then watch that exact run. Do not report a stale branch run as current evidence.
- For UI changes, include screenshots or explain why screenshots do not apply.
- When screenshots are required, use `docs/workflows/upload-pr-screenshots-workflow.md` for upload and PR body formatting.
- If a project has a local PR template or workflow, follow it over this generic workflow.
- When creating a PR from code changes, use the local or shared code-review workflow before finalizing the PR body unless the user explicitly asks to skip review.
- Do not stop at PR body drafting: include or update testing instructions unless the user explicitly says not to.

## Output Contract

Return the PR URL, draft/review state, base/head branches, and any verification or blockers.
