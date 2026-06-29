# OMP Plugin Adapter

Thin OMP runtime adapter for the generic repo root.

The package root owns the reusable content:

- `AGENTS.md`, `AGENT_RULES.md`, `COMMITTING.md` for shared rules.
- `agents/` for workflows, templates, references, and plans.
- `skills/` for thin skill aliases into the workflow core.

This directory only contains OMP-specific runtime code. Keep shared procedures out of here.

Runtime behavior:

- Registers `/marlens-rules-and-skills [task]`, a prompting shortcut that asks the agent to use Marlen's installed rules and skills.

## Local development

Load the package root so OMP can discover both the extension and sibling `skills/` directory:

```bash
omp --extension .
```

The extension entrypoint is declared in root `package.json` under `omp.extensions`.
