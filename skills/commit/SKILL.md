---
name: commit
description: Create intentional git commits from staged or relevant local changes. Use when the user asks Codex to commit, commit staged files, commit relevant files, amend a commit, or otherwise turn current repository changes into a commit while following repo-local commit guidance such as COMMITTING.md.
---

# Commit

Read the first available workflow:

1. Local project: `docs/workflows/commit-workflow.md`
2. Legacy local project: `agents/workflows/commit-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://commit/workflow.md` in OMP)
Check candidate existence first (for example with glob). Read only the first existing local workflow file; if neither local workflow exists, read `skill://commit/workflow.md` directly. Do not read missing local paths or batch local candidates.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
