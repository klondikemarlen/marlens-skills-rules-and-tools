# Marlen's Rules and Skills

Reusable agent rules and skills, plus a thin OMP plugin adapter.

## OMP plugin install

Recommended direct install:

```bash
omp plugin install github:klondikemarlen/marlens-rules-and-skills
```

Use direct install instead of the marketplace flow when you want both the package skills and the OMP extension command.

This installs these OMP skills:

- `code-review`
- `commit`
- `git-rebase`
- `learn`
- `playwright-qa`
- `pull-request-management`
- `release-notes`
- `testing-instructions`

It also adds `/marlens-rules-and-skills [task]`, a prompting shortcut that asks the agent to use the installed rules/workflows, and the `git-edit-commit` helper for editing older commits during a rebase.

For local plugin development, link the package root so OMP uses the same plugin path:

```bash
omp plugin link /path/to/rules-and-skills-checkout
```

## Manual install

Use this path for agents without a plugin system.

Clone this repo anywhere, then link or copy the shared rules file into the locations your agents read:

```bash
REPO=/path/to/rules-and-skills-checkout
mkdir -p "$HOME/.omp/agent"
ln -sf "$REPO/AGENTS.md" "$HOME/.omp/agent/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/AGENTS.md"
```

If an agent cannot load plugins or skills, keep the checkout nearby and point it at `AGENTS.md`; the workflow source lives under `agents/`, and the public skill entrypoints live under `skills/`.

Restart the agent after changing this file. Global instructions load at startup.

## Local customization

Treat this pack as the base layer. Project-local instructions win.

For each project, keep project-specific commands and conventions in that repo, not in this shared pack:

- `AGENTS.md` for project rules.
- `README.md` or `bin/README.md` for setup and dev-wrapper commands.
- `COMMITTING.md` for commit-message style.
- `agents/` for project workflows, templates, references, and plans.
- local skills for project-only shortcuts.

This keeps the shared skills usable across different stacks while letting Icefog-style repos define their own wrappers, test commands, Docker services, UI labels, and domain language.

## Future adapters

Only OMP has a plugin adapter today. Add future agent-specific adapters beside it, for example `claude-plugin/` or another requested agent adapter, and have them consume the root `AGENTS.md`, `agents/`, and `skills/` content instead of copying workflows.

## Name

Use `marlens-rules-and-skills` as the package/plugin slug, GitHub repo name, and OMP marketplace name. Use "Marlen's Rules and Skills" as the display name.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP or manual symlink consumers
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `agents/` - generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases that point to authoritative workflows/templates
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
