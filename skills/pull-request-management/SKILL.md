---
name: pull-request-management
description: Use when creating or editing pull requests; delegates to the local pull-request-management workflow.
---

# Pull Request Management

Read the first available workflow:

1. Local project: `agents/workflows/pull-request-management-workflow.md`
2. Packaged fallback for the current runtime:
   - OMP: `skill://pull-request-management/workflow.md`
   - Claude Code: `${CLAUDE_SKILL_DIR}/workflow.md`

Local project workflows win. This skill is a thin alias; the workflow file is authoritative.
