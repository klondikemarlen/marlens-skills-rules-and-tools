# Marlen's Skills, Rules, and Tools

Reusable agent skills, rules, and tool helpers, plus a thin OMP plugin adapter.

## OMP plugin install

Recommended direct install:

```bash
omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools
```

Use direct install instead of the marketplace flow when you want both the package skills and the OMP extension command.

This installs OMP skill prompts for browser QA, code review, commits, Express Light Rail backend work, feature workflow, Node Express API compatibility, rebases, learning, pull request management, release notes, and testing instructions.

These are skill prompts only; this package does not install browser automation or project test dependencies.

It also adds `/marlens-skills-rules-and-tools [task]`, a prompting shortcut that asks the agent to use the installed skills/rules/workflows, a repo-local `bin/agent-rebase-edit.js` agent helper for scripted history edits, and the `dev` generic Docker Compose wrapper for project-local `bin/dev` shims.

`dev` is a Ruby executable with no runtime gem dependencies. This repo pins maintainer tooling in `.tool-versions` and `Gemfile`; install Ruby 3.3.5 with asdf or any compatible Ruby before running the helper locally.

For local plugin development, link the package root so OMP uses the same plugin path:

```bash
omp plugin link /path/to/marlens-skills-rules-and-tools
```

After reinstalling the plugin or changing skill names, restart OMP before retesting `skill://...`; skill discovery can stay stale inside an already-running session.

## Feature and issue workflow

Preferred flow for repo issues and feature requests:

In this repo only, an explicit request to follow the GitHub issue or feature request workflow authorizes staging and committing the scoped files for that workflow. Keep the broader global git safety block in place for other repositories.

1. Create or identify the GitHub issue with the user story and acceptance criteria.
2. Branch from current `main` using the issue number and short slug before editing when possible; if the scoped work already exists locally, create the issue-named branch before committing.
3. Make the smallest change that resolves the request, including any docs or thin skill aliases that must stay updated.
4. Bump `package.json` for every change; the current release mechanism is the merge to `main` on GitHub.
5. Open a draft PR that links the issue, includes the checks run, and is marked ready only after verification.
6. Merge through the PR so GitHub records the review/merge path; in this repo that merge to `main` is the release.
7. Close the issue via the merged PR when the PR contains the fix. If the fix already landed directly on `main`, comment with the fixing commit and close the issue explicitly instead of creating a misleading closing PR.
8. After merge, reinstall the local plugin from this repo, and tell the user to reload the plugin if their client supports it or restart OMP before retesting installed skills/rules.

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
- `skills/` - thin skill aliases that point at authoritative workflows under `agents/workflows/`
- `lib/` - Ruby implementation for shared package binaries such as `dev`
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
