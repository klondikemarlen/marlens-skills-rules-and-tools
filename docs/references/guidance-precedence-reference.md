# Agent Guidance Precedence Reference

Use this as the canonical placement and precedence rule for this package.

## Precedence

1. System/developer instructions in the active agent session win over repository files.
2. The target project’s local instructions win over this shared package.
3. This package is the fallback base layer for reusable guidance.
4. Thin skill entrypoints point to authoritative workflow files; they do not replace them.

Before applying a workflow from this package, read the target project’s local guidance when it exists:

- `AGENTS.md` or equivalent project agent rules
- `README.md`
- `COMMITTING.md`
- `bin/README.md` or dev-wrapper docs <!-- agent-guidance-audit: ignore backtick-path -->
- project-local `docs/` workflows, templates, references, or plans
- project-local skill files or agent shortcuts

## Placement

| Guidance type | Canonical home | Use for |
| --- | --- | --- |
| Global rules | `AGENTS.md` | Cross-project safety, release, and operating rules loaded by agents. |
| Shared agent-agnostic rules | `AGENT_RULES.md` | Repo-wide decision rules that are not tied to one agent runtime. |
| Commit guidance | `COMMITTING.md` | Commit-message and commit-scope conventions. |
| Workflows | `docs/workflows/` | Reusable task procedures with inputs, steps, and output contracts. |
| Templates | `docs/templates/` | Copyable end-state shapes for code, docs, or generated artifacts. |
| References | `docs/references/` | Durable background guidance, policies, concepts, and technique notes. |
| Plans | `docs/plans/` | Exploratory or multi-phase implementation plans. |
| Skills | `skills/` | Compatibility entrypoints that route agents to authoritative workflows. |
| OMP rules | `rules/` | Reusable OMP rule snippets that may be copied or linked into user rules. |

## Rules

- Keep project-specific commands, services, routes, domain terms, auth, schemas, deployment details, and UI labels in the target project.
- Keep this shared package generic unless the filename or directory clearly identifies a project-specific scope.
- Do not copy full workflow bodies into skill entrypoints; link to the workflow.
- Do not mirror project-local docs into this package just for discoverability; extract only reusable guidance.
- Prefer directory discovery over long duplicated inventories. Directory READMEs should route readers to authoritative files, not repeat procedures.
- If a document must mention precedence for its audience, link back here instead of restating the full policy.
