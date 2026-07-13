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

Learner runtime boundaries follow the sibling-project service pattern: one public `perform()` operation per service class, shallow named steps in `perform()`, private helpers for implementation detail, and generic utilities under `learner/lib`.

- `learner/services/*-service.mjs` contains one operation service class per file.
- `learner/services/register-learner-plugin-service.mjs` orchestrates plugin registration only.
- `learner/services/register-learner-tool-service.mjs` owns the `learner_record_candidate` tool.
- `learner/services/register-learner-session-events-service.mjs` owns session and before-agent hooks.
- `learner/services/register-learner-slash-command-service.mjs` owns `/learner on|off|status`.
- `learner/repositories/learner-store-repository.mjs` owns local store paths, defaults, atomic writes, and enabled state.
- `learner/lib/*.mjs` contains stateless utilities such as redaction, prompt builders, and candidate normalization.
- `learner.mjs` is the OMP entry point only.

## Local Development

Load the package root so OMP can discover both the extension and sibling `skills/` directory:

```bash
omp --extension .
```

The extension entrypoint is declared in root `package.json` under `omp.extensions`.
