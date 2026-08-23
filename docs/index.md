# Agent Workflows and References

This directory contains reusable, agent-readable workflows, templates, references, and plans. Top-level [`examples/`](../examples/) contains concise before/after outcome cases.

## Important

Directory READMEs under `docs/` are discovery documents. Use them to find relevant workflows, templates, or plans, then read the underlying files directly. The individual workflow/template/plan files are the source of truth for task-specific instructions.

Top-level `skills/` are compatibility entry points. Keep authoritative procedures in `workflows/`, copyable end-state templates in `templates/`, durable background in `references/`, and evidence cases in top-level [`examples/`](../examples/); each skill selects project-local guidance first, then uses its behavior-preserving packaged fallback.

## Customization and Precedence

This package is the fallback base layer. Project-local instructions win.

For the canonical precedence and placement rules, read [`references/guidance-precedence-reference.md`](./references/guidance-precedence-reference.md).

## Directory Structure

```text
docs/
├── index.md
├── workflows/   # reusable task procedures
├── templates/   # reusable output/code/document templates
├── references/  # durable background guidance
└── plans/       # implementation or migration plans

```

## Evidence Examples

Top-level [`examples/`](../examples/) demonstrates the smallest observable difference made by a packaged skill, rule, or tool. Each case names a task, contrasts the unguided and guided approach, explains the boundary, and names its check.

## Best Practices

1. Use this page for discovery, then read the linked workflow, template, reference, or plan directly.
2. Keep reusable procedures in `workflows/`.
3. Keep copyable end-state examples in `templates/`.
4. Keep background techniques in `references/`.
5. Keep exploratory or multi-phase implementation plans in `plans/`.
6. Prefer descriptive filenames: `verb-noun-workflow.md`, `noun-template.md`, or `topic-reference.md`.
7. Prefer discovery over long duplicated inventories.

## Workflow Entry Points

- Session insight mining: [`workflows/session-insight-mining-workflow.md`](workflows/session-insight-mining-workflow.md)
- Worktree creation: [`workflows/worktree-creation-workflow.md`](workflows/worktree-creation-workflow.md)

## Agent-Specific Documents

- Codex command approval guidance: [`codex-rules-guide.md`](./codex-rules-guide.md)

## Maintainer Tools

- Downstream agent guidance audit: [`references/downstream-agent-guidance-audit-reference.md`](./references/downstream-agent-guidance-audit-reference.md)
