# Marlen's Rules and Skills

Reusable agent rules and skills, plus a thin OMP plugin adapter.

## Manual install

Use this path for agents without a plugin system.

Clone this repo anywhere, then link or copy the shared rules file into the locations your agents read:

```bash
REPO=/path/to/rules-and-skills-checkout
mkdir -p "$HOME/.codex" "$HOME/.config/opencode" "$HOME/.omp/agent"
ln -sf "$REPO/AGENTS.md" "$HOME/.codex/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/.config/opencode/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/.omp/agent/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/AGENTS.md"
```

If an agent cannot load plugins or skills, keep the checkout nearby and point it at `AGENTS.md`; the workflow source lives under `agents/`, and the public skill entrypoints live under `skills/`.

Restart the agent after changing this file. Global instructions load at startup.

## OMP plugin install

This repo also ships an OMP package adapter:

- `package.json` declares `omp.extensions`.
- `omp-plugin/index.ts` is the tiny runtime adapter.
- `.omp-plugin/marketplace.json` exposes the package to the OMP marketplace.
- `/marlens-rules-and-skills` is a prompting shortcut that asks the agent to use the installed rules/workflows.

Installed OMP skills:

- `commit`
- `learn`
- `playwright-qa`
- `pull-request-management`
- `release-notes`
- `testing-instructions`

Install from the marketplace:

```bash
omp plugin marketplace add klondikemarlen/marlens-rules-and-skills
omp plugin install marlens-rules-and-skills@marlens-rules-and-skills
```

Interactive equivalent:

```text
/marketplace add klondikemarlen/marlens-rules-and-skills
/marketplace install marlens-rules-and-skills@marlens-rules-and-skills
```

For local development, load the package root so OMP also discovers sibling `skills/`:

```bash
omp --extension /path/to/rules-and-skills-checkout
```

## Future adapters

Only OMP has a plugin adapter today. Add future agent-specific adapters beside it, for example `claude-plugin/`, `codex-plugin/`, or `opencode-plugin/`, and have them consume the root `AGENTS.md`, `agents/`, and `skills/` content instead of copying workflows.

## Name

Use `marlens-rules-and-skills` as the package/plugin slug, GitHub repo name, and OMP marketplace name. Use "Marlen's Rules and Skills" as the display name.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP, Codex, and OpenCode
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `agents/` - generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases that point to authoritative workflows/templates
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
