# Agent Global Rules

Generic agent rules plus a thin OMP plugin adapter.

## Generic use

Clone this repo anywhere, then link each tool's global rules file plus the home-level fallback to that checkout:

```bash
REPO=/path/to/agent-global-rules
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
- `/agent-global-rules` is a prompting shortcut that asks the agent to use the installed rules/workflows.

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
omp plugin install agent-global-rules@agent-global-rules
```

Interactive equivalent:

```text
/marketplace add klondikemarlen/agent-global-rules
/marketplace install agent-global-rules@agent-global-rules
```

For local development, load the package root so OMP also discovers sibling `skills/`:

```bash
omp --extension /path/to/agent-global-rules
```

## Name

Keep `agent-global-rules` for now. It preserves existing install paths and still describes the root contract. If this becomes a public package beyond personal/global rules, `agent-rules-and-skills` is the clearer rename.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP, Codex, and OpenCode
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `agents/` - generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases that point to authoritative workflows/templates
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
