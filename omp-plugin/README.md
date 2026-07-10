# OMP Plugin Adapter

Thin OMP runtime adapter for the generic repo root.

The package root owns the reusable content:

- `AGENTS.md`, `AGENT_RULES.md`, `COMMITTING.md` for shared rules.
- `docs/` for workflows, templates, references, and plans.
- `skills/` for thin skill aliases into the workflow core.

This directory only contains OMP-specific runtime code. Keep shared procedures out of here.

Runtime behavior:

- Registers `/marlens-skills-rules-and-tools [task]`, a prompting shortcut that asks the agent to use Marlen's installed skills, rules, and tools.

## Local Development

Load the package root so OMP can discover both the extension and sibling `skills/` directory:

```bash
omp --extension .
```

The extension entrypoint is declared in root `package.json` under `omp.extensions`.
