---
name: testing-instructions
description: Use when writing or updating pull request testing instructions.
---

# Testing Instructions

Read the first available workflow:

1. Local project: `agents/workflows/testing-instructions-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://testing-instructions/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
