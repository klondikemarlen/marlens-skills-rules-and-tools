# Agent Workflows and References

This directory contains reusable, agent-readable workflows, templates, references, and plans.

## Important

Directory READMEs under `agents/` are discovery documents. Use them to find relevant workflows, templates, or plans, then read the underlying files directly. The individual workflow/template/plan files are the source of truth for task-specific instructions.

Top-level `skills/` are compatibility entry points. Keep real procedures in `workflows/`, copyable examples in `templates/`, and durable background in `references/`; skills should only point to the authoritative file.

## Customization and Precedence

This package is the fallback base layer. Project-local instructions win.

Before applying a workflow from this package, read the target project's local rules and docs when they exist:

- `AGENTS.md`
- `README.md`
- `COMMITTING.md`
- `bin/README.md`
- project-local `agents/` docs
- project-local skill files

Keep project-specific commands, services, routes, domain terms, and deployment details in the target project. Do not bake those details into this shared pack.


## Directory Structure

```text
agents/
├── README.md
├── workflows/   # reusable task procedures
├── templates/   # reusable output/code/document templates
├── references/  # durable background guidance
└── plans/       # implementation or migration plans
```

## Best Practices

1. Keep reusable procedures in `workflows/`.
2. Keep copyable end-state examples in `templates/`.
3. Keep background techniques in `references/`.
4. Keep exploratory or multi-phase implementation plans in `plans/`.
5. Prefer descriptive filenames: `verb-noun-workflow.md`, `noun-template.md`, or `topic-reference.md`.
6. Keep workflows generic unless the filename or directory clearly identifies a project-specific scope.
7. Prefer discovery over long inventories: point agents to the relevant directory and naming convention.

## Agent-Specific Documents

- Codex command approval guidance: [`codex-rules-guide.md`](./codex-rules-guide.md)
