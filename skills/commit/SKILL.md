---
name: commit
description: Create intentional git commits from staged or relevant local changes. Use when the user asks Codex to commit, commit staged files, commit relevant files, amend a commit, or otherwise turn current repository changes into a commit while following repo-local commit guidance such as COMMITTING.md.
---

# Commit

Read the first available workflow:

1. Local project: `agents/workflows/commit-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://commit/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
