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
3. Create PRs as drafts. Before any fixup mutation to an existing open PR, inspect its live remote state; read-only investigation may happen first. Record current draft/ready status separately from explicit user intent about keeping draft or returning to review. Leave an already-draft PR in draft. Unless the user explicitly asks to keep it ready, convert a ready PR to draft and re-read the remote state before the first fixup edit or commit. If required state or conversion cannot be verified, stop before fixup mutations. Record an explicit user override rather than silently skipping the gate; do not defer the default transition until push.
   When follow-up work resolves review comments, use [Pull Request Comment Resolution](pull-request-comment-resolution-workflow.md). After all review, thread, QA, and required-check gates pass, restore ready-for-review only for an agent-temporary conversion from ready or an explicit user request to return to review. Otherwise preserve existing or intentionally draft status. Verify the remote ready state before reporting it.
   Before correcting accepted review feedback, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit whose body records the concern, corrective outcome, and PR scope checked when that context is not obvious from the subject.

### Repository Metadata

Before requesting review, reconcile any ownership, label, and reviewer-request metadata required by
the target repository:

Set the repository and PR number once for these commands:

```bash
repo=OWNER/REPO
number=PULL_NUMBER
```

- **Local policy:** Read the repository's local guidance first. It decides whether metadata is
  required, who owns the PR, which labels are appropriate, and who may request review.
- **Current PR state:** Inspect existing assignees, labels, and review requests before changing
  them. Reconcile only the metadata required by local policy:

  ```bash
  gh pr view "$number" --repo "$repo" --json assignees,labels,reviewRequests
  ```

- **Assignee:** When local policy assigns the authenticated GitHub user, derive and assign that user
  rather than hard-coding an account:

  ```bash
  assignee="$(gh api user --jq .login)"
  gh api "repos/$repo/issues/$number/assignees" -X POST \
    -f "assignees[]=$assignee"
  ```

- **Available labels:** Query the repository's current label taxonomy with an explicit limit.
  If it returns 100 labels, rerun it with a higher limit before selection:

  ```bash
  gh label list --repo "$repo" --limit 100
  ```

- **Addition:** Add every applicable label without discarding unrelated labels:

  ```bash
  # Include every applicable current label.
  applicable_labels=(
    "<existing-label-1>"
    "<existing-label-2>"
  )
  label_fields=()
  for label in "${applicable_labels[@]}"; do
    label_fields+=(-f "labels[]=$label")
  done
  gh api "repos/$repo/issues/$number/labels" -X POST "${label_fields[@]}"
  ```

  `POST` adds the selected labels. Use `PUT` only when local policy explicitly owns the complete
  label set, because `PUT` replaces the entire label set.

- **Confirmation:** After any metadata update, run the current PR state command again and confirm it
  matches local policy:

  ```bash
  gh pr view "$number" --repo "$repo" --json assignees,labels,reviewRequests
  ```

- **Review requests:** Do not request reviewers unless the user or repository-local policy explicitly directs it.

4. Write and maintain one reviewer-focused canonical description in the top-level PR body. Follow the target repository's local PR template and workflow for required sections and for where operational evidence belongs. They may permit evidence in existing PR-body sections, designate another existing location, or prohibit it from the body. If no contrary local policy exists, use these concise reviewer-facing sections when applicable:
   - Related links
   - Context: why the change exists.
   - Implementation: what user-visible or maintainer-relevant behavior changed.
   - Screenshots: uploaded images, placeholders, or `N/A — <reason>.`
   - Testing instructions: runnable steps a reviewer can execute without branch-author context.
   - Review and QA status: concise material self-review findings and outcome, the user-visible QA scenario and observed outcome, and automated-check status when it affects a reviewer decision.
   - Learner coverage: a concise triage outcome for each non-learner-authored issue—`no action`, `propose bug/feature`, or `filed` with its OMP Learner issue link. Keep `no action` to one line when no further context is needed.
     These are not globally required headings. Never add locally forbidden sections, raw command logs, test counts, internal diagnostics, or generic claims that a diff was reviewed.
5. After creating or updating a PR body, read the remote PR body and discussion through GitHub. Confirm the body reflects the latest intended description, locally permitted sections, preserved issue links and relevant existing images/captions or prerequisites, and no competing agent-generated description remains. Confirm links resolve. The remote body—not a local draft or artifact—is the active canonical reviewer description.
6. Keep testing instructions reproducible and usable without branch-author context, subject to local policy for their placement. Preserve supplied instructions and prerequisites that remain relevant when revising the body.
7. Do not claim verification that was not performed.
8. Self-review the complete PR diff before requesting review or merging. Record material findings, decisions, limitations, fixups, blockers, and a `PASS`/`FAIL`/`BLOCKED` outcome in the evidence location permitted by local policy. Absent a contrary local evidence-placement rule, use concise reviewer-relevant status in the PR body; omit generic process claims and internal diagnostics unless they affect a reviewer decision. If the body is forbidden and no alternative is named, retain the evidence in an existing permitted issue, check/artifact, or local work record rather than inventing a report comment.
9. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks. Truthfully record concise current-head status, useful evidence, and `PASS`/`FAIL`/`BLOCKED` outcomes—including unresolved failures and blockers—in the existing location permitted by local policy. If no contrary policy exists, use the PR body, distinguishing superseded results and using collapsed details or existing check/artifact links when needed. Revise the existing record in place after every implementation, review, or QA revision; preserve issue links, genuine product questions, existing images/captions, and reproducible instructions. Never append routine implementation, self-review, overall QA/status, or final-delivery reports as comments; comments are for genuine discussion and specific review responses. If a supplemental report comment is explicitly requested, update its existing designated comment rather than adding another.
10. For an explicitly requested cleanup of duplicate reports, first reconcile unique evidence into the existing location permitted by local policy (including the PR body only when permitted) or an existing linked check/artifact. Remove only identified, authorized agent-authored duplicate reports; preserve human discussion, reviewer findings and threads, bot checks, and unique evidence unless removal is explicitly authorized. Repair links made dangling by removal, then read back the remote body and discussion and verify the canonical reviewer description and absence of competing agent-generated descriptions. Do not post a cleanup-confirmation comment.
11. For every actionable inline review comment, follow the pull-request comment-resolution protocol: react `+1` for accepted/addressed feedback; react `-1` for rejected/not-applicable feedback. Avoid duplicate reactions, resolve the thread, and verify both the reaction and `reviewThread.isResolved` through GitHub. After a fixup, repeat this protocol with the complete self-review and targeted QA.
12. Resolve every actionable review finding or comment before marking the PR ready or merging by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
13. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence and do not claim verification that did not occur.
14. After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. If the user explicitly requests a waiver, drop, or cleanup, record the missing evidence and do not claim the result was verified.

## Public GitHub Records

Before posting or updating any GitHub record—including issue descriptions or comments, PR bodies or comments, review comments, and QA reports—review its text and attachments for public-safe content:

- Never include personal usernames, absolute home paths, local browser profile/session paths, credentials/tokens, or workstation-specific locations. Keep operational local paths and profile/session details in local notes only.
- Legitimate repository-relative source/test paths and reviewer-facing app routes may remain. Use neutral screenshot filenames and captions; if an upload is blocked, state the exact blocker and what remains unverified without exposing local paths.
- When correcting existing record metadata, change only the affected metadata. Preserve generated attachment URLs, captions, surrounding text, and existing/user-uploaded images.

For screenshot-upload steps and safe successful-upload/blocked-auth examples, use the screenshot upload workflow linked in the Decision Rules.

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
- Treat the top-level PR body as the sole canonical reviewer description and revise it in place after implementation, review, or QA revisions. Follow local policy for permitted body sections and operational-evidence placement. Keep self-review, targeted current-head QA, learner triage, and unresolved failures or blockers mandatory, and truthfully record them in the locally permitted existing location; absent contrary policy, use concise status in the PR body and preserve `PASS`, `FAIL`, and `BLOCKED`. Preserve current-head status, distinguish superseded results, and use existing check/artifact links when useful. Never append routine implementation, self-review, overall QA/status, or final-delivery reports; comments are for genuine discussion and specific review responses. An explicitly requested supplemental report updates its existing designated comment. For requested cleanup, reconcile unique evidence first, remove only identified authorized agent-authored duplicates, preserve human/reviewer/bot discussion and checks, repair dangling links, then verify the remote body and discussion without a cleanup-confirmation comment. See Process steps 4–10.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Write PR titles in title case. Read the first available title casing reference: local `docs/references/title-casing-reference.md`, then packaged `skill://pull-request-management/title-casing.md`.
- Keep actionable inline review comments incomplete until the expected `+1`/`-1` reaction and `reviewThread.isResolved: true` have been verified through GitHub.
- When a corrective branch needs an explicit CI rerun and its workflow supports `workflow_dispatch`, run `gh workflow run <workflow> --ref <branch>`, identify the new run, verify its branch and head SHA match the intended commit, then watch that exact run. Do not report a stale branch run as current evidence.
- For UI changes, include screenshots or explain why screenshots do not apply.
- When screenshots are required or supplied for a PR, use `docs/workflows/upload-pr-screenshots-workflow.md` for upload and PR body formatting, including browser authentication/session bootstrap, installed batch uploads, saved/rendered verification, and cleanup. Preserve project-local screenshot optionality.
- If a project has a local PR template or workflow, follow it over this generic workflow.
- When creating a PR from code changes, use the local or shared code-review workflow before finalizing the PR body unless the user explicitly asks to skip review.
- Do not stop at PR body drafting: include or update testing instructions unless the user explicitly says not to.

## Output Contract

Return the PR URL, draft/review state, base/head branches, and any verification or blockers.
