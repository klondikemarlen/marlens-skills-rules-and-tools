---
name: commit
description: Create intentional git commits from staged or relevant local changes. Use when the user asks Codex to commit, commit staged files, commit relevant files, amend a commit, or otherwise turn current repository changes into a commit while following repo-local commit guidance such as COMMITTING.md.
---

# Commit

Check whether `docs/workflows/commit-workflow.md` exists. If it does, read it.
Otherwise, check whether `agents/workflows/commit-workflow.md` exists. If it does, read it.
If neither local workflow exists, read `skill://commit/workflow.md` (the packaged [workflow](workflow.md)).

Treat missing local workflow files as an expected fallback branch, not as read errors. Read repository-local `COMMITTING.md` first when it exists; it remains applicable to whichever workflow is selected.
