# OMP Plugin Adapter

Thin OMP runtime adapter for the generic repo root.

The package root owns the reusable content:

- `AGENTS.md`, `AGENT_RULES.md`, `COMMITTING.md` for shared rules.
- `docs/` for workflows, templates, references, and plans.
- `skills/` for thin skill aliases into the workflow core.

This directory only contains OMP-specific runtime code. Keep shared procedures out of here.

Runtime behavior:

- Registers `/marlens-skills-rules-and-tools [task]`, a prompting shortcut that asks the agent to use Marlen's installed skills, rules, and tools.
- Registers `/learner on|off|status`, a verifier-style opt-in learner surface. `/learner on` persists automatic triage, activates the default-inactive `learner_record_candidate` tool, and appends learner instructions to future turns; `/learner off` disables it; `/learner status` reports state.

Learner runtime boundaries:

- `learner/store.mjs` owns local store paths, migrations/defaults, atomic writes, and enabled state.
- `learner/candidates.mjs` owns candidate normalization, redaction, decisions, feedback, and review formatting.
- `learner/prompts.mjs` owns learner system prompts and self-loop prompt detection.
- `learner/constants.mjs` owns shared domain vocabulary.
- `learner.mjs` wires those domain modules into OMP commands, tools, and events.

## Local Development

Load the package root so OMP can discover both the extension and sibling `skills/` directory:

```bash
omp --extension .
```

The extension entrypoint is declared in root `package.json` under `omp.extensions`.
