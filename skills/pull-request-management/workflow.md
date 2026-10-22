# Pull Request Management Workflow

Use when creating or updating a pull request.

## Required Inputs

- Current branch name and base branch.
- Diff or commit range being proposed.
- Authoritative ticket key and URL; any secondary tracker record explicitly required by the user or project policy.
- Existing PR body, when updating.

## Process

1. Inspect repository status and preserve unrelated local work.
2. Read the branch diff and recent commits before drafting text.
3. Create PRs as drafts. Before any fixup mutation to an existing open PR, inspect its live remote state; read-only investigation may happen first. Record current draft/ready status separately from explicit user intent about keeping draft or returning to review. Leave an already-draft PR in draft. Unless the user explicitly asks to keep it ready, convert a ready PR to draft and re-read the remote state before the first fixup edit or commit. If required state or conversion cannot be verified, stop before fixup mutations. Record an explicit user override rather than silently skipping the gate; do not defer the default transition until push.
   When follow-up work resolves review comments, use [Pull Request Comment Resolution](../../docs/workflows/pull-request-comment-resolution-workflow.md). After all review, thread, QA, and required-check gates pass, restore ready-for-review only for an agent-temporary conversion from ready or an explicit user request to return to review. Otherwise preserve existing or intentionally draft status. Verify the remote ready state before reporting it.
   Before correcting accepted review feedback, inspect the complete PR diff for the same underlying issue. Correct every in-scope recurrence in a dedicated `:ok_hand:` commit whose body records the concern, corrective outcome, and PR scope checked when that context is not obvious from the subject.

### Initial Draft Publication

Publish a draft PR linked to the authoritative ticket as soon as the first coherent, reviewable change can be pushed, then continue implementation in that same draft. Do not wait for all implementation, full self-review, passing QA, browser access, or finished screenshots. Include the source key and URL in the PR body; link a secondary ticket only when explicitly requested or required by project policy. Do not imply unfinished product work is complete: describe material product incompleteness and prerequisites that reviewers need. Keep operational reports and unrun QA details in the selected evidence location, not in the body merely because the PR is an initial draft.

Push coherent progress and revise that existing description as implementation and QA change; preserve authoritative and explicitly required secondary ticket links, ownership/labels, intentional draft status, and all readiness, feedback-resolution, and merge gates. Honor explicit user or local-policy publication exceptions. If GitHub publication is unavailable, report its exact missing prerequisite; an unrelated browser-QA blocker does not itself prevent draft publication through GitHub's API.

Reconcile linked implementation tickets through [Ticket Lifecycle](../feature/workflow.md#ticket-lifecycle) when starting a draft, requesting review, handling rework, or completing a merge. PR assignment does not assign its linked ticket, and merging a PR does not prove that Jira status or GitHub Project Status advanced. After merge, use the project's actual next state; retain QA/release requirements rather than marking incomplete delivery Done.

### Repository Metadata

Before every agent-created PR handoff, including drafts and documentation-only work, reconcile ownership and applicable existing labels unless an explicit user instruction or repository policy directs otherwise. Reviewer requests remain separately authorized.

Set the repository and PR number once for these commands:

```bash
repo=OWNER/REPO
number=PULL_NUMBER
```

- **Local policy:** Read the repository's local guidance first. Explicit ownership, label, and handoff exceptions override the generic defaults; never hard-code personal accounts or a fixed label taxonomy into shared standards.
- **Current PR state:** Inspect existing assignees, labels, and review requests before changing them. Preserve unrelated metadata and add only missing applicable assignments and labels:

  ```bash
  gh pr view "$number" --repo "$repo" --json assignees,labels,reviewRequests
  ```

- **Assignee:** Resolve the intended owner to a GitHub login. Use the authenticated GitHub user when that account is the intended owner, or an explicit verified mapping when supplied. Do not assume an automation credential identifies a different requesting human; ask only when the intended identity remains unresolved. When the authenticated user is the intended owner:

  ```bash
  assignee="$(gh api user --jq .login)"
  gh api "repos/$repo/issues/$number/assignees" -X POST \
    -f "assignees[]=$assignee"
  ```

  Keep identities service-specific: a Jira assignment requires a separately resolved Jira account, not a GitHub login. A Jira account ID likewise does not establish a PR owner's GitHub identity.

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

- **Confirmation:** After any metadata update, run the current PR state command again and confirm the intended owner, applicable labels, preserved unrelated metadata, and unchanged review requests before handoff:

  ```bash
  gh pr view "$number" --repo "$repo" --json assignees,labels,reviewRequests
  ```

- **Review requests:** Do not request reviewers unless the user or repository-local policy explicitly directs it.

4. Resolve [Description and Evidence Placement](#description-and-evidence-placement), then maintain one reviewer-focused canonical description in the top-level PR body. The selected repository template is authoritative: follow its sections and order, and link to it from local workflows rather than reproducing its full generic skeleton. Preserve focused examples that help authors fill a section. Only when no description contract exists, use these concise reviewer-facing sections when applicable:
   - Related links
   - Context: why the change exists.
   - Implementation: what user-visible or maintainer-relevant behavior changed.
   - Screenshots: uploaded images, placeholders, or `N/A — <reason>.`
   - Testing instructions: runnable steps a reviewer can execute without branch-author context.
5. After creating or updating a PR body, read the remote PR body and discussion through GitHub. Confirm the body follows the authoritative template or permitted fallback, reflects the latest intended description, preserves issue links and relevant existing images/captions or prerequisites, and has no competing agent-generated description. Confirm links resolve. The remote body—not a local draft or artifact—is the active canonical reviewer description.
6. Keep testing instructions reproducible and usable without branch-author context, subject to local policy for their placement. Preserve supplied instructions and prerequisites that remain relevant when revising the body.
7. Do not claim verification that was not performed.
8. Self-review the complete PR diff before requesting review or merging. Record material findings, decisions, limitations, fixups, blockers, and a `PASS`/`FAIL`/`BLOCKED` outcome in the evidence location selected by [Description and Evidence Placement](#description-and-evidence-placement).
9. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks. Record truthful current-head status, useful evidence, failures, and blockers in that same location, distinguishing superseded results. Refresh the canonical description only when there is reader-needed new information and within its permitted content. Comments are for genuine discussion, specific review responses, or reader-needed new information—not routine implementation, self-review, QA/status, learner, or final-delivery reports. An explicitly requested supplemental report updates its existing designated comment.
10. For an explicitly requested cleanup of duplicate reports, reconcile unique evidence into the existing permitted location or an existing linked check/artifact. Remove only identified, authorized agent-authored duplicates; preserve human discussion, reviewer findings and threads, bot checks, and unique evidence unless removal is explicitly authorized. Repair dangling links, then read back the remote body and discussion to verify the canonical description and absence of competing agent-generated descriptions. Do not post a cleanup-confirmation comment.
11. For every actionable inline review comment, follow the pull-request comment-resolution protocol: react `+1` for accepted/addressed feedback; react `-1` for rejected/not-applicable feedback. Avoid duplicate reactions, resolve the thread, and verify both the reaction and `reviewThread.isResolved` through GitHub. After a fixup, repeat this protocol with the complete self-review and targeted QA.
    Use `github-review-thread resolve ... --reaction +1` for accepted/addressed comments or `--reaction -1` for rejected/not-applicable comments; do not report completion until the helper’s final reaction and `reviewThread.isResolved` checks pass.
12. Resolve every actionable review finding or comment before marking the PR ready or merging by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that instruction, record unresolved findings truthfully, and do not claim they were resolved.
13. Keep the PR `BLOCKED` while repository- or platform-enforced review requirements, review feedback, QA, or required checks are unresolved by default. If the user explicitly requests a waiver, drop, or cleanup instead, follow that disposition, record the missing evidence and do not claim verification that did not occur.
14. After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default. Wait only for specifically required end-user testing the agent cannot perform. If the user explicitly requests a waiver, drop, or cleanup, record the missing evidence and do not claim the result was verified.

## Description and Evidence Placement

Before drafting or refreshing a PR description, read the target repository's template/workflow and apply explicit current or already-established maintainer instructions. Retrieve a relevant known preference when needed; an already-current preference needs application, not another memory entry. These inputs define the description contract. The project template wins: follow its structure and do not add competing headings. Local workflows should link to the canonical template instead of copying its full generic skeleton; keep focused examples and a no-template fallback where useful.

Apply [Workflow Outputs and Publication](../../docs/references/guidance-precedence-reference.md#workflow-outputs-and-publication): an output contract specifies knowledge and evidence to produce, not mandatory public text/headings or permission to post it. Keep required self-review, QA, limitations, learner triage, and truthful `PASS`/`FAIL`/`BLOCKED` evidence in the existing designated check, artifact, work record, or session. Choose the reader, useful new information, and appropriate existing destination independently; if there is no useful reader-needed information, do not post. The PR body is for concise, reviewer-relevant change, risk, action, and evidence links, subject to its contract. Preserve actual reviewer findings, blockers/material prerequisites, requested detailed audits in their designated destination, and genuine discussion/review responses. Do not expand the body or add comments with routine execution reports, duplicate CI evidence, or housekeeping.

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

See [GitHub Asynchronous Merge for PR Stacks](../../docs/references/engineering-techniques-reference.md#github-asynchronous-merge-for-pr-stacks) for the safety boundary.

## Decision Rules

- Preserve existing `Fixes`/`Closes` semantics for GitHub issues and keep Jira ticket links as key-plus-URL references handled through [Ticket Lifecycle](../feature/workflow.md#ticket-lifecycle); never imply a GitHub closing relationship from a Jira key.
- For stacked child PR conflicts, follow [Stacked Pull Request Conflicts](../git-rebase/workflow.md#stacked-pull-request-conflicts): prefer a child-only rebase onto the freshly fetched actual parent, not a parent merge. Preserve explicit published-history rewrite authorization, current draft/fixup gates, and exact expected-remote-SHA leases.
- Prefer concise active language over file-by-file implementation summaries.
- For a specifically requested Codex review, follow [Requested Codex Reviews](../../docs/references/github-tooling-reference.md#requested-codex-reviews) before waiting: establish eligibility, distinguish publication from acknowledgment, and verify completion on the intended head without silently waiving the request.
- Preserve the canonical description contract through every implementation, review, QA, readiness, and merge refresh. Apply [Description and Evidence Placement](#description-and-evidence-placement); its output-placement procedure governs evidence and public reporting. Preserve human/reviewer/bot discussion and checks during authorized duplicate cleanup; reconcile unique evidence, repair dangling links, and verify the remote body and discussion without a cleanup-confirmation comment.
- Before creating or updating a GitHub issue or pull request, run `check-title-case --title "<final title>"`; pass exact identifiers with `--preserve`, then re-read the created title through GitHub and run the same final check.
- Write PR titles in title case. Read the first available title casing reference: local `docs/references/title-casing-reference.md`, then packaged `skill://pull-request-management/title-casing.md`.
- Keep actionable inline review comments incomplete until the expected `+1`/`-1` reaction and `reviewThread.isResolved: true` have been verified through GitHub.
- When a corrective branch needs an explicit CI rerun and its workflow supports `workflow_dispatch`, run `gh workflow run <workflow> --ref <branch>`, identify the new run, verify its branch and head SHA match the intended commit, then watch that exact run. Do not report a stale branch run as current evidence.
- For UI changes, include screenshots or explain why screenshots do not apply.
- When screenshots are required or supplied for a PR, use the packaged `../../docs/workflows/upload-pr-screenshots-workflow.md` workflow for upload and PR body formatting, including browser authentication/session bootstrap, installed batch uploads, saved/rendered verification, and cleanup. Preserve project-local screenshot optionality.
- If a project has a local PR template or workflow, follow it over this generic workflow. Link to the canonical template rather than reproducing its full generic section skeleton; retain focused examples and the no-template fallback.
- Complete the local or shared code-review workflow before finalizing readiness unless the user explicitly asks to skip review. An initial work-in-progress draft must still follow [Initial Draft Publication](#initial-draft-publication), preserving material product incompleteness and prerequisites without turning the body into an operational report.
- Do not stop at PR body drafting: include or update testing instructions unless the user explicitly says not to.

## Output Contract

Return the PR URL, draft/review state, base/head branches, and any verification or blockers.
