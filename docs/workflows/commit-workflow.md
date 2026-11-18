# Commit Workflow

Use when the user explicitly asks to commit, amend, or commit a staged/relevant set of files.

## Intent

**WHY this workflow exists:** Commits are durable history; the agent should create the smallest honest commit without sweeping in unrelated work.

**WHAT this workflow produces:** One logical commit with a repo-conformant message, or a clear blocker when the requested commit is unsafe.

**Decision Rules:**

- Never commit without an explicit current-turn request containing `commit` or `stage`, unless repo-local docs define a narrower allowlisted workflow such as a GitHub issue or feature request flow.
- Treat `commit staged` as index-only. If nothing is staged, ask the user to stage them first.
- Stage files only when the user explicitly asks to stage files, asks to commit a named/relevant set, or repo-local docs authorize staging scoped files for the active workflow.
- Never include unrelated user changes to make the tree clean.
- Prefer one logical change per commit.
- Keep commits homogeneous by change type when practical: a directly corresponding focused test belongs with the implementation it verifies, but split migrations/schema/data changes, dependency churn, formatting, documentation or workflow-learning updates, unrelated test-only changes, and broad test support unless the user explicitly requests a combined commit and the files are inseparable for review.
- When dependency manifests and generated lockfiles both change, stage that pair together in its own dependency commit whenever practical. Keep dependency resolution churn out of unrelated source, test, refactor, formatting, and documentation commits.
- For an accepted concern supplied in PR-review context, inspect the relevant PR context for recurrences before editing; broaden to the complete PR only when the concern reaches that scope. Correct every in-scope recurrence in one dedicated `:ok_hand:` commit; its body states the concern, corrective outcome, and scope checked when not obvious from the subject. Do not amend or fold the correction into an older commit. Commit safety checks do not require restarting code verification after a mechanical tweak.

## Process

1. Read commit guidance before staging: repo-local `COMMITTING.md` first, then this package's shared [`skill://commit/COMMITTING.md`](skill://commit/COMMITTING.md) for defaults not overridden by the repo.
2. Check `git status --short` and preserve unrelated local work.
3. If the user asked for `commit staged`, leave the index unchanged and commit only that selection. If nothing is staged, ask the user to stage the intended changes first; do not stage files for them.
4. Otherwise, when the request or active workflow authorizes staging a named/relevant set, stage only changes that clearly belong to that scope before inspection, scope checking, and message selection. Avoid `git add .`. Honor current-session selective-commit tool requirements and ownership restrictions instead of staging whole files; never use that tool to expand an index-only request.
5. Inspect the selected staged files with `git diff --cached --name-status` and `git diff --cached --stat`.
6. Run `check-commit-scope` against that selection after any authorized staging. A standard source-plus-focused-test commit does not use `.commit-scope.json`; its absence is expected, so do not probe it or report it as a repository failure. Only after the checker reports a mixed file-type boundary and the user confirms that the group is genuinely inseparable may you read or create this optional exception configuration. Then declare the exact all-or-nothing paths in the repository-root `.commit-scope.json`; partial groups and unrelated extra paths still fail. Use `check-commit-scope --allow-mixed` only after that explicit confirmation, then record the exception in the commit body.
   In an OMP plugin session, this package makes `check-commit-scope` available on `PATH`; repo-local commit guidance may still require its own invocation.
7. Derive the likely emoji from the selected staged diff and linked issue or PR using the shared commit guidance. Warn and stop before creating a `:construction:` commit unless the work explicitly identifies an incomplete, application-breaking intermediate migration slice; use `:art:` for a completed extraction or refinement that has no narrower semantic category.
8. Review enough staged diff and issue/PR context to name the problem, outcome, and why the change belongs in this commit.
9. If the purpose or file ownership is unclear, ask instead of guessing.
10. If the request includes amending older commits or reorganizing branch history, switch to the `rebase` workflow before committing.
11. Commit with the repo's message style; add a short body when the subject alone cannot carry the relevant bug, feature, or product context.
12. Verify the resulting message with `git log -1 --format=%B` before reporting it.

## Output Contract

Report the commit hash and full commit message, then mention any remaining unstaged or untracked files. Do not claim tests or checks passed unless they ran in this turn.
