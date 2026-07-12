# OMP Plugin Adapter

Thin OMP runtime adapter for the generic repo root.

The package root owns the reusable content:

- `AGENTS.md`, `AGENT_RULES.md`, `COMMITTING.md` for shared rules.
- `docs/` for workflows, templates, references, and plans.
- `skills/` for thin skill aliases into the workflow core.

This directory only contains OMP-specific runtime code. Keep shared procedures out of here.

Runtime behavior:

- Registers `/marlens-skills-rules-and-tools [task]`, a prompting shortcut that asks the agent to use Marlen's installed skills, rules, and tools.
- Registers `/learner ...`, a verifier-style opt-in learner surface. `/learner on` persists automatic triage, activates the default-inactive `learner_record_candidate` tool, and appends learner instructions to future turns; `/learner off` disables it. Manual review commands still store pending/reviewed candidates under the active OMP agent directory and route promoted candidates back through the learn workflow.

## Local Development

Load the package root so OMP can discover both the extension and sibling `skills/` directory:

```bash
omp --extension .
```

The extension entrypoint is declared in root `package.json` under `omp.extensions`.
