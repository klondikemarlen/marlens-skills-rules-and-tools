# Marlen's Skills, Rules, and Tools

Reusable agent skills, rules, and tool helpers, plus thin OMP and Claude Code plugin adapters.

## OMP Plugin Install

Recommended direct install:

```bash
omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools
```

Use direct install instead of the marketplace flow when you want both the package skills and the OMP extension command.

This installs OMP skill prompts for browser QA, code review, commits, Express Light Rail backend work, feature workflow, hands-off agentic coding, learner feedback triage, Node Express API compatibility, rebases, learning, pull request management, release notes, and testing instructions.

These are skill prompts only; this package does not install browser automation or project test dependencies.

It also adds reusable OMP rule files under `rules/`, `/marlens-skills-rules-and-tools [task]`, `/learner on|off|status` automatic durable-feedback triage, a repo-local `bin/agent-rebase-edit.js` agent helper for scripted history edits, and the `dev` generic Docker Compose wrapper for project-local `bin/dev` shims.

`dev` is a Ruby executable with no runtime gem dependencies. This repo pins maintainer tooling in `.tool-versions` and `Gemfile`; install Ruby 3.3.5 with asdf or any compatible Ruby before running the helper locally.

## Claude Code Plugin Install

Install this repo as a Claude Code marketplace, then install the plugin from it:

```bash
claude plugin marketplace add klondikemarlen/marlens-skills-rules-and-tools
claude plugin install marlens-skills-rules-and-tools@marlens-skills-rules-and-tools
```

For local development, load the checkout directly:

```bash
claude --plugin-dir /path/to/marlens-skills-rules-and-tools
```

Claude Code exposes this package's public skills under the plugin namespace, for example `/marlens-skills-rules-and-tools:learn`, `/marlens-skills-rules-and-tools:feature`, `/marlens-skills-rules-and-tools:commit`, and `/marlens-skills-rules-and-tools:code-review`.

The Claude adapter is manifest-only: `.claude-plugin/plugin.json` lets Claude Code load the existing `skills/` tree, and `.claude-plugin/marketplace.json` lets users install the repo without copying workflow files.

## Recommended Companion OMP Plugins

This package stays the base layer for doctrine, skills, rules, workflows, and the thin OMP adapter. Runtime plugins remain separate packages with independent release cycles; install only the pieces that match your workflow.

| Plugin | Adds | Install | Skip when |
| --- | --- | --- | --- |
| [`omp-verifier`](https://github.com/klondikemarlen/omp-verifier) | Evidence-first guardrails and local verifier scaffolding for hands-off agent runs. Pin the released plugin tag. | `omp plugin install github:klondikemarlen/omp-verifier#v0.6.8` | You do not want verifier-enforced evidence gates or local verifier scaffolding. |
| [`omp-vscode-context`](https://github.com/klondikemarlen/omp-vscode-context) | Two-part VS Code extension plus OMP plugin bridge for richer editor/context handoff into OMP. | `code --install-extension klondikemarlen.omp-vscode-context --force`<br>`omp plugin install github:klondikemarlen/omp-vscode-context` | You do not use VS Code or do not need editor-state context in OMP. |
| [`omp-developer-cost-status`](https://github.com/klondikemarlen/omp-developer-cost-status) | A developer attention/cost status meter for longer sessions. | `omp plugin install github:klondikemarlen/omp-developer-cost-status` | You do not want cost or attention telemetry in your statusline. |
| [`omp-auto-retitle`](https://github.com/klondikemarlen/omp-auto-retitle) | Automatic session title cleanup for long or multi-thread OMP work. | `omp plugin install github:klondikemarlen/omp-auto-retitle` | You prefer manual session titles or your client already handles title hygiene. |
| [`omp-exit-command`](https://github.com/klondikemarlen/omp-exit-command) | Exit ergonomics for ending OMP sessions intentionally. | `omp plugin install github:klondikemarlen/omp-exit-command` | Your current exit flow is already fast enough. |

## Reusable OMP Rules

Reusable rule files live under [`rules/`](rules/). After installing this package, copy or link selected generic rules into `~/.omp/agent/rules`; keep project-specific rules in the target repo or user-level rules directory.

```bash
PACKAGE="$HOME/.omp/plugins/node_modules/marlens-skills-rules-and-tools"
mkdir -p "$HOME/.omp/agent/rules"
ln -sf "$PACKAGE/rules/no-issue-filing-without-confirmation.md" "$HOME/.omp/agent/rules/"
ln -sf "$PACKAGE/rules/no-envrc-example-commits.md" "$HOME/.omp/agent/rules/"
ln -sf "$PACKAGE/rules/omp-not-opencode-target-check.md" "$HOME/.omp/agent/rules/"
ln -sf "$PACKAGE/rules/use-dev-wrapper-for-development-compose.md" "$HOME/.omp/agent/rules/"
```

Restart OMP after changing global rule files.

For local plugin development, link the package root so OMP uses the same plugin path:

```bash
omp plugin link /path/to/marlens-skills-rules-and-tools
```

After reinstalling the plugin or changing skill names, restart OMP before retesting `skill://...`; skill discovery can stay stale inside an already-running session.

## Feature and Issue Workflow

Preferred flow for repo issues and feature requests:

In this repo only, an explicit request to follow the GitHub issue or feature request workflow authorizes staging and committing the scoped files for that workflow. Keep the broader global git safety block in place for other repositories.

1. Create or identify the GitHub issue with the user story and acceptance criteria.
2. Branch from current `main` using the issue number and short slug before editing when possible; if the scoped work already exists locally, create the issue-named branch before committing.
3. Make the smallest change that resolves the request, including any docs or thin skill aliases that must stay updated.
4. Bump `package.json` for every change before opening the release PR.
5. Open a draft PR with `docs/workflows/pull-request-management-workflow.md`; link the issue, include the checks run, and mark it ready only after verification. PR creation is part of the release workflow, but not the release itself.
6. Merge the PR to `main` so GitHub records the review/merge path; in this repo that merge to `main` is the release.
7. Close the issue via the merged PR when the PR contains the fix. If the fix already landed directly on `main`, comment with the fixing commit and close the issue explicitly instead of creating a misleading closing PR.
8. After merge, reinstall the local plugin from this repo, and tell the user to reload the plugin if their client supports it or restart OMP before retesting installed skills/rules.

## Manual Install

Use this path for agents without a plugin system.

Clone this repo anywhere, then link or copy the shared rules file into the locations your agents read:

```bash
REPO=/path/to/marlens-skills-rules-and-tools
mkdir -p "$HOME/.omp/agent"
ln -sf "$REPO/AGENTS.md" "$HOME/.omp/agent/AGENTS.md"
ln -sf "$REPO/AGENTS.md" "$HOME/AGENTS.md"
```

If an agent cannot load plugins or skills, keep the checkout nearby and point it at `AGENTS.md`; the workflow source lives under `docs/`, and the public skill entrypoints live under `skills/`.

Restart the agent after changing this file. Global instructions load at startup.

## Local Customization

Treat this pack as the base layer. Project-local instructions win.

For each project, keep project-specific commands and conventions in that repo, not in this shared pack:

- `AGENTS.md` for project rules.
- `README.md` or `bin/README.md` for setup and dev-wrapper commands.
- `COMMITTING.md` for commit-message style.
- `docs/` for project workflows, templates, references, and plans.
- local skills for project-only shortcuts.

This keeps the shared skills usable across different stacks while letting Icefog-style repos define their own wrappers, test commands, Docker services, UI labels, and domain language.

## Future Adapters

OMP and Claude Code have thin plugin adapters today. Add future agent-specific adapters beside them, and have those adapters consume the root `AGENTS.md`, `docs/`, and `skills/` content instead of copying workflows.

## Name

Use `marlens-skills-rules-and-tools` as the package/plugin slug, GitHub repo name, and OMP marketplace name. Use "Marlen's Skills, Rules, and Tools" as the display name.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP or manual symlink consumers
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `docs/` - authoritative generic workflow, template, reference, and plan discovery docs
- `skills/` - thin skill aliases that point at authoritative workflows under `docs/workflows/`
- `rules/` - reusable OMP rule files that can be copied or linked into `~/.omp/agent/rules`
- `lib/` - Ruby implementation for shared package binaries such as `dev`
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `omp-plugin/learner.mjs` - learner toggle, recording tool, command storage, and candidate review helpers
- `.omp-plugin/` - OMP marketplace catalog
- `.claude-plugin/` - Claude Code plugin manifest and marketplace catalog
