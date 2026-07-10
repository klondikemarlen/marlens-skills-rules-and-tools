---
name: code-review
description: Use when reviewing a branch, pull request, or local diff for correctness, regressions, missing tests, and unnecessary complexity.
---

# Code Review

Read the first available workflow:

1. Local project: `agents/workflows/code-review-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://code-review/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
