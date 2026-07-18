# Agent Workflows and References

This directory contains reusable, agent-readable workflows, templates, references, and plans.

## Important

Directory READMEs under `docs/` are discovery documents. Use them to find relevant workflows, templates, or plans, then read the underlying files directly. The individual workflow/template/plan files are the source of truth for task-specific instructions.

Top-level `skills/` are compatibility entry points. Keep authoritative procedures in `workflows/`, copyable examples in `templates/`, and durable background in `references/`; each skill selects project-local guidance first, then uses its behavior-preserving packaged fallback.

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

## Best Practices

1. Use this page for discovery, then read the linked workflow, template, reference, or plan directly.
2. Keep reusable procedures in `workflows/`.
3. Keep copyable end-state examples in `templates/`.
4. Keep background techniques in `references/`.
5. Keep exploratory or multi-phase implementation plans in `plans/`.
6. Prefer descriptive filenames: `verb-noun-workflow.md`, `noun-template.md`, or `topic-reference.md`.
7. Prefer discovery over long duplicated inventories.

## Agent-Specific Documents

- Codex command approval guidance: [`codex-rules-guide.md`](./codex-rules-guide.md)

## Maintainer Tools

- Downstream agent guidance audit: [`references/downstream-agent-guidance-audit-reference.md`](./references/downstream-agent-guidance-audit-reference.md)
