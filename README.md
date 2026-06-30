# Marlen's Skills, Rules, and Tools

Reusable agent skills, rules, and tool helpers, plus a thin OMP plugin adapter.

## OMP plugin install

Recommended direct install:

```bash
omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools
```

Use direct install instead of the marketplace flow when you want both the package skills and the OMP extension command.

This installs OMP skill prompts for browser QA, code review, commits, rebases, learning, pull request management, release notes, and testing instructions.

These are skill prompts only; this package does not install browser automation or project test dependencies.

It also adds `/marlens-skills-rules-and-tools [task]`, a prompting shortcut that asks the agent to use the installed skills/rules/workflows, and the `git-edit-commit` helper with `--message-only` and `--edit` modes for fixing older commits during a rebase.

For local plugin development, link the package root so OMP uses the same plugin path:

```bash
omp plugin link /path/to/marlens-skills-rules-and-tools
```

After reinstalling the plugin or changing skill names, restart OMP before retesting `skill://...`; skill discovery can stay stale inside an already-running session.

## Manual install

Use this path for agents without a plugin system.

Clone this repo anywhere, then link or copy the shared rules file into the locations your agents read:

```bash
REPO=/path/to/marlens-skills-rules-and-tools
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

Use `marlens-skills-rules-and-tools` as the package/plugin slug, GitHub repo name, and OMP marketplace name. Use "Marlen's Skills, Rules, and Tools" as the display name.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP or manual symlink consumers
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `agents/` - authoritative generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases plus packaged workflow mirrors for `skill://` sandboxed reads
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
