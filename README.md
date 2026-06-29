# Marlen's Rules and Skills

Generic agent rules plus a thin OMP plugin adapter.

## Generic use

Clone this repo anywhere, then link each tool's global rules file plus the home-level fallback to that checkout:

```bash
REPO=/path/to/rules-and-skills-checkout
mkdir -p "$HOME/.codex" "$HOME/.config/opencode" "$HOME/.omp/agent"
ln -sf "$REPO/AGENTS.md" "$HOME/.codex/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/.config/opencode/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/.omp/agent/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/AGENTS.md"
```

Restart the agent after changing this file. Global instructions load at startup.

## OMP plugin use

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
omp plugin marketplace add klondikemarlen/agent-global-rules
omp plugin install marlens-rules-and-skills@marlens-rules-and-skills
```

Interactive equivalent:

```text
/marketplace add klondikemarlen/agent-global-rules
/marketplace install marlens-rules-and-skills@marlens-rules-and-skills
```

For local development, load the package root so OMP also discovers sibling `skills/`:

```bash
omp --extension /path/to/rules-and-skills-checkout
```

## Name

Use `marlens-rules-and-skills` as the package/plugin slug and "Marlen's Rules and Skills" as the display name. The GitHub repo can stay `klondikemarlen/agent-global-rules` until you intentionally rename it; if you do, run `gh repo edit klondikemarlen/agent-global-rules --name marlens-rules-and-skills`.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP, Codex, and OpenCode
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `agents/` - generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases that point to authoritative workflows/templates
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
