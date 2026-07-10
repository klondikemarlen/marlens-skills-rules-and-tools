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
- Keep commits homogeneous by change type when practical: split code/test changes, migrations/schema/data changes, dependency churn, formatting, and documentation or workflow-learning updates unless the user explicitly requests a combined commit and the files are inseparable for review.

## Process

1. Read commit guidance before staging: repo-local `COMMITTING.md` first, then this package's shared `COMMITTING.md` for defaults not overridden by the repo.
2. Check `git status --short` and preserve unrelated local work.
3. Inspect staged files with `git diff --cached --name-status` and `git diff --cached --stat`.
4. If the user asked for `commit staged`, commit only the index.
5. If the user asked to commit a named/relevant set, stage only files that clearly belong to that requested change. Avoid `git add .`.
6. Review enough staged diff and issue/PR context to name the problem, outcome, and why the change belongs in this commit.
7. If the purpose or file ownership is unclear, ask instead of guessing.
8. If the request includes amending older commits or reorganizing branch history, switch to the `git-rebase` workflow before committing.
9. Commit with the repo's message style; add a short body when the subject alone cannot carry the relevant bug, feature, or product context.
10. Verify the resulting message with `git log -1 --format=%B` before reporting it.

## Output Contract

Report the commit hash and full commit message, then mention any remaining unstaged or untracked files. Do not claim tests or checks passed unless they ran in this turn.
