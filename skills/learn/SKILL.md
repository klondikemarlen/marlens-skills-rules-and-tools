---
name: learn
description: Use when capturing durable lessons from user corrections or recent changes; delegates to the local learn workflow.
---

# Learn

Read the first available workflow:

1. Local project: `agents/workflows/learn-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://learn/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
