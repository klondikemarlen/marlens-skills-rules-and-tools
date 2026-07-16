---
name: temporary-mcp-task
description: Use when a one-off OMP child task needs one disabled MCP server temporarily enabled; delegates to the local temporary MCP task workflow.
---

# Temporary MCP Task

Read the first available workflow:

1. Local project: `docs/workflows/temporary-mcp-task-workflow.md`
2. Legacy local project: `agents/workflows/temporary-mcp-task-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://temporary-mcp-task/workflow.md` in OMP)
Use a single non-erroring project-root glob with the candidate basename (for example, `glob("**/temporary-mcp-task-workflow.md")`) to find existing local candidates; choose the listed `docs/workflows/` path before its `agents/workflows/` counterpart. If neither local workflow exists, read `skill://temporary-mcp-task/workflow.md` directly. Do not probe missing literal paths or read them speculatively. <!-- agent-guidance-audit: ignore backtick-path -->

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
