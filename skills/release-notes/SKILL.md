---
name: release-notes
description: Use when drafting release notes, changelog entries, release emails, or summaries from PRs, commits, tags, tickets, or deployments.
---

# Release Notes

Read the first available workflow:

1. Local project: `agents/workflows/release-notes-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://release-notes/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
