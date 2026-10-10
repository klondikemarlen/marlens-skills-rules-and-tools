# Marlen's Skills, Rules, and Tools

**Official acronym:** MSSRT — pronounced “em-ess-ess-are-tee” (“EM-ess-ess-are-TEE”).

Reusable agent skills, rules, and tool helpers, plus thin OMP and Claude Code plugin adapters.

## Stability

The v1 contract defines this package's stable public surfaces: installable package metadata, skill entrypoints, reusable `docs/` workflows/templates/references, outcome-oriented `examples/`, `rules/`, packaged `bin/` helpers, the OMP command adapter, and Claude plugin manifests. Runtime behavior from optional companion plugins, downstream project configuration, browser automation, project test dependencies, and removed bundled learner behavior stays outside this package's v1 contract.

## OMP Plugin Install

Recommended direct install:

```bash
omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools
```

Use direct install instead of the marketplace flow when you want both the package skills and OMP adapter.

Routine OMP installs use the generic GitHub reference and follow the repository's default branch. An exact full-commit reference with `--force` is exceptional: use it only to reproduce an exact artifact or diagnose stale plugin-cache state. See [`docs/references/omp-plugin-install-reference.md`](docs/references/omp-plugin-install-reference.md).

This installs task-oriented OMP skill prompts for browser QA, code review, commits, Express Light Rail backend work, feature workflow, hands-off agentic coding, layered page orchestration, Node Express API compatibility, project knowledge bases, rebases, learning, pull request management, release notes, self-improvement, session insight mining, temporary MCP tasks, testing instructions, and worktree creation. Invoke a skill when its task applies; skills and workflows do not attach to unrelated turns.

Every reusable OMP rule in [`rules/`](rules/) loads by default through OMP plugin discovery. Project and user rules can override a package rule by reusing its name or extend it with a new name; see [local customization](#local-customization).

This package does not install browser automation or project test dependencies. Its `dev` generic Docker Compose wrapper, `bin/agent-rebase-edit.js`, and `bin/agent-worktree.js` remain available for project-local shims and scripted Git worktree setup.

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

## Companion Runtime Plugins

This package is the default base layer for doctrine, rules, task skills, workflows, and the thin OMP adapter. Companion runtime plugins remain separate opt-ins with independent release cycles; install only the runtime capabilities your workflow needs.

Use [Quality Ownership Across MSSRT, Verifier, and Learner](docs/references/quality-ownership-reference.md) to place policy, runtime, and learning changes. Each companion's own docs remain authoritative for its implementation.

| Plugin                                                                                     | Adds                                                                                                                                                                                                                                                                    | Install                                                                                                                               | Skip when                                                                           |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`omp-verifier`](https://github.com/klondikemarlen/omp-verifier)                           | Declared-check discovery, changed-path selection, execution, suppression, structured evidence, and verifier-advisor correction.                                                                                                                                         | `omp plugin install github:klondikemarlen/omp-verifier`                                                                               | You do not want automatic check execution or advisor correction.                    |
| [`omp-soft-boundary-guard`](https://github.com/klondikemarlen/omp-soft-boundary-guard)     | Advisory repository-boundary warnings for local writes and moves, `git push`, supported `gh issue`/`gh pr`/`gh api` mutations, and supported `xd://github` writes. Routine installs follow the default branch; use an exact tag or hash only for artifact verification. | `omp plugin install github:klondikemarlen/omp-soft-boundary-guard`                                                                    | You do not need advisory repository-boundary visibility for local or GitHub writes. |
| [`omp-vscode-context`](https://github.com/klondikemarlen/omp-vscode-context)               | Two-part VS Code extension plus OMP plugin bridge for richer editor/context handoff into OMP.                                                                                                                                                                           | `code --install-extension klondikemarlen.omp-vscode-context --force`<br>`omp plugin install github:klondikemarlen/omp-vscode-context` | You do not use VS Code or do not need editor-state context in OMP.                  |
| [`omp-developer-cost-status`](https://github.com/klondikemarlen/omp-developer-cost-status) | A developer attention/cost status meter for longer sessions.                                                                                                                                                                                                            | `omp plugin install github:klondikemarlen/omp-developer-cost-status`                                                                  | You do not want cost or attention telemetry in your statusline.                     |
| [`omp-auto-retitle`](https://github.com/klondikemarlen/omp-auto-retitle)                   | Automatic session title cleanup for long or multi-thread OMP work.                                                                                                                                                                                                      | `omp plugin install github:klondikemarlen/omp-auto-retitle`                                                                           | You prefer manual session titles or your client already handles title hygiene.      |
| [`omp-exit-command`](https://github.com/klondikemarlen/omp-exit-command)                   | Exit ergonomics for ending OMP sessions intentionally.                                                                                                                                                                                                                  | `omp plugin install github:klondikemarlen/omp-exit-command`                                                                           | Your current exit flow is already fast enough.                                      |
| [`omp-learner`](https://github.com/klondikemarlen/omp-learner)                             | High-confidence feedback retention through native `learn` and deduplicated reviewable proposals routed to the evidenced owner.                                                                                                                                          | `omp plugin install github:klondikemarlen/omp-learner`                                                                                | You do not want opt-in feedback retention or a proposal backlog.                    |

`omp-learner` is the standalone replacement for the removed bundled learner runtime. It uses OMP's native `learn` for eligible durable feedback and a separate tool for reviewable tickets. Its generic knowledge-base target is configurable (default `klondikemarlen/omp-config`); after installing and restarting OMP, explicitly choose this repository when shared guidance belongs here:

```text
/learner setup https://github.com/klondikemarlen/marlens-skills-rules-and-tools
```

Ticket filing requires existing `gh` authentication, an accessible target with GitHub Issues enabled, and permission to create issues there. Learner-created issues are reviewable proposals, not instructions to apply. When asked to "implement new tickets", triage the full open `learner:` set with [`docs/workflows/learn-workflow.md#learner-issue-triage`](docs/workflows/learn-workflow.md#learner-issue-triage): implement reusable missing guidance; report duplicate/already-covered filings with citations; route project-specific work to its evidenced owner and report misrouting to Learner. Installing this package never enables learner filing by itself. Learner invokes native `learn` for eligible feedback, but OMP owns memory storage and managed skills; Learner does not implement proposals, open PRs, or release changes. Its [own knowledge base](https://github.com/klondikemarlen/omp-learner/blob/main/docs/README.md) owns the current signal and routing contracts.

## Default OMP Rules

After installing this package as an OMP plugin, every reusable rule under [`rules/`](rules/) is active by default. Restart OMP after installing or upgrading so it discovers the installed package capabilities.

To customize the defaults:

- Define a project or user rule with the same name to override the packaged rule at higher precedence.
- Add a differently named rule under `.omp/rules/` or `~/.omp/agent/rules/` to extend the defaults.
- Add a rule name to OMP's `ttsr.disabledRules` setting to disable it deliberately.

For agents without OMP plugin support, follow the [manual install](#manual-install) path and copy or link the required rule files into that agent's rule directory.

## Default Verifications

When [`omp-verifier`](https://github.com/klondikemarlen/omp-verifier) is installed, its automatic-selection runtime runs test alignment for changed test paths and checks every tracked TypeScript path for default function exports. To disable the export verification deliberately, add this project-root `.marlens-verifications.json` configuration:

```json
{
  "defaultFunctionExports": false
}
```

Repository hygiene runs through `check-commit-scope`: it checks the Git index for `.envrc.example` and staged changed source files. The `npm test` gate retains the full-repository source-size check for CI.

Automatic correction also requires an enabled, model-resolved verifier advisor. After installing or upgrading [`omp-verifier`](https://github.com/klondikemarlen/omp-verifier), restart OMP and run `/advisor status`: `verifier [no model]` means checks cannot reach the agent correction flow. For an advisor-backed release, intentionally trigger one matching verification failure, observe a `verifier` blocker in the primary session, remediate it, and confirm the subsequent check passes. A UI notification alone is not correction evidence.

Current OMP Verifier releases consume declared triggers for automatic checks. Extensions add their own manifest entries and triggers; checks without triggers remain manual, and scoped suppression stays visible in verifier output. See [Quality Ownership](docs/references/quality-ownership-reference.md) for the policy/runtime handoff and proof limits.

For local plugin development, link the package root so OMP uses the same plugin path:

```bash
omp plugin link /path/to/marlens-skills-rules-and-tools
```

After reinstalling the plugin or changing skill names, restart OMP before retesting `skill://...`; skill discovery can stay stale inside an already-running session.

## Task-Oriented Documentation Map

Start with [`docs/index.md`](docs/index.md) for the detailed docs map. Common routes:

| Task                                                                      | Start here                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implement a repo issue or feature request                                 | [`docs/workflows/feature-workflow.md`](docs/workflows/feature-workflow.md)                                                                                                                                      |
| Open, update, or merge a pull request                                     | [`docs/workflows/pull-request-management-workflow.md`](docs/workflows/pull-request-management-workflow.md)                                                                                                      |
| Resolve PR review comments                                                | [`docs/workflows/pull-request-comment-resolution-workflow.md`](docs/workflows/pull-request-comment-resolution-workflow.md)                                                                                      |
| Commit scoped changes                                                     | [`COMMITTING.md`](COMMITTING.md) and [`docs/workflows/commit-workflow.md`](docs/workflows/commit-workflow.md)                                                                                                   |
| Edit older commits safely                                                 | [`docs/workflows/git-rebase-workflow.md`](docs/workflows/git-rebase-workflow.md) and `git-edit-commit`                                                                                                          |
| Add Express Light Rail backend code                                       | [`docs/workflows/express-light-rail-backend-workflow.md`](docs/workflows/express-light-rail-backend-workflow.md) and [`docs/templates/backend/express-light-rail/`](docs/templates/backend/express-light-rail/) |
| Add full-stack admin CRUD scaffolding                                     | [`docs/workflows/full-stack-admin-crud-workflow.md`](docs/workflows/full-stack-admin-crud-workflow.md) and [`docs/templates/backend/express-sequelize-crud/`](docs/templates/backend/express-sequelize-crud/)   |
| Add frontend or backend reusable scaffolding                              | [`docs/templates/`](docs/templates/)                                                                                                                                                                            |
| Compare before/after guidance outcomes                                    | [`examples/`](examples/)                                                                                                                                                                                        |
| Layer route-based UI flows                                                | [`docs/workflows/layered-page-orchestration-workflow.md`](docs/workflows/layered-page-orchestration-workflow.md)                                                                                                |
| Upload PR screenshots                                                     | [`docs/workflows/upload-pr-screenshots-workflow.md`](docs/workflows/upload-pr-screenshots-workflow.md)                                                                                                          |
| Decide where guidance belongs                                             | [`docs/references/guidance-precedence-reference.md`](docs/references/guidance-precedence-reference.md)                                                                                                          |
| Audit downstream agent guidance                                           | [`docs/references/downstream-agent-guidance-audit-reference.md`](docs/references/downstream-agent-guidance-audit-reference.md) and `agent-guidance-audit`                                                       |
| Establish a project-local documentation knowledge base                   | [`docs/workflows/project-knowledge-base-workflow.md`](docs/workflows/project-knowledge-base-workflow.md)                                                                                                        |
| Improve reusable guidance, prompt flow, or evidence-backed technical debt | [`docs/workflows/self-improvement-workflow.md`](docs/workflows/self-improvement-workflow.md)                                                                                                                    |
| Mine session insights and route durable lessons                           | [`docs/workflows/session-insight-mining-workflow.md`](docs/workflows/session-insight-mining-workflow.md)                                                                                                        |
| Draft or file Jira reports                                                | [`docs/workflows/jira-reporting-workflow.md`](docs/workflows/jira-reporting-workflow.md) and `jira-reporting`                                                                                                   |
| Run one task with a temporarily enabled MCP server                        | [`docs/workflows/temporary-mcp-task-workflow.md`](docs/workflows/temporary-mcp-task-workflow.md)                                                                                                                |

## Task-Proportionate Execution

The [hands-off workflow](docs/workflows/hands-off-agentic-coding-workflow.md) keeps small solo diffs on a read → patch → proof path. Non-trivial work uses one bounded plan and evidence-driven iteration, reusing the issue's outcome and constraints. Context handoffs are for actual delegation or resumption, not a mandatory artifact for every task.

The [self-improvement workflow](docs/workflows/self-improvement-workflow.md) prioritizes demonstrated instruction conflicts and unnecessary ceremony before adding guidance. More capable models do not waive safety, review, QA, or release gates, and workflow changes are not measured speedups without comparative evidence.

## Feature and Issue Workflow

Preferred flow for repo issues and feature requests:

In this repo only, an explicit request to follow the GitHub issue or feature request workflow authorizes staging and committing the scoped files for that workflow. Keep the broader global git safety block in place for other repositories.

1. Create or identify the GitHub issue with the user story and acceptance criteria.
2. Branch from current `main` using the issue number and concise, meaningful outcome slug before editing when possible; never use opaque abbreviations or a bare issue number. If the scoped work already exists locally, create the issue-named branch before committing.
3. Make the smallest change that resolves the request, including any docs or thin skill aliases that must stay updated.
4. Bump `package.json` for every change before opening the release PR.
5. Open a draft PR with `docs/workflows/pull-request-management-workflow.md`; link the issue, include the checks run, and mark it ready only after verification. PR creation is part of the release workflow, but not the release itself.
6. Merge the PR to `main` so GitHub records the review/merge path; in this repo that merge to `main` is the release.
7. Close the issue via the merged PR when the PR contains the fix. If the fix already landed directly on `main`, comment with the fixing commit and close the issue explicitly instead of creating a misleading closing PR.
8. After merge, reinstall the local plugin from this repo, and tell the user to reload the plugin if their client supports it or restart OMP before retesting installed skills/rules.

## Release Versioning

Use semantic versioning with cumulative release judgment:

- Bump **major** for a breaking public plugin, tool, skill, workflow, or configuration contract.
- Bump **minor** for a backward-compatible reusable capability, substantive core workflow change, or a cumulative set of compatible changes that now merits a higher-tier release.
- Bump **patch** for compatible fixes, clarifications, and narrow maintenance.

There is no numeric patch threshold. Promote to a minor release before a long run of compatible changes becomes misleading; use the size and public significance of the accumulated work rather than a mechanical counter. Do not rewrite historical versions.

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

For a non-plugin agent, copy or link the applicable reusable rules into its normal rules directory:

```bash
REPO=/path/to/marlens-skills-rules-and-tools
mkdir -p "$HOME/.omp/agent/rules"
for rule in "$REPO"/rules/*.md; do
  [ "$(basename "$rule")" = README.md ] || ln -sf "$rule" "$HOME/.omp/agent/rules/"
done
```

## Local Customization

Treat this pack as the base layer: package rules are default suggestions, while project-local instructions and rules win. Use a local rule with the same name for a deliberate replacement, add a new local rule for project-only behavior, or use OMP's `ttsr.disabledRules` setting to disable one package rule. The detailed placement and precedence policy lives in [`docs/references/guidance-precedence-reference.md`](docs/references/guidance-precedence-reference.md).

Keep project-specific commands, wrappers, test commands, Docker services, UI labels, domain language, and stack conventions in that repo.

## Future Adapters

OMP and Claude Code have thin plugin adapters today. Add future agent-specific adapters beside them, and have those adapters consume the root `AGENTS.md`, `docs/`, and `skills/` content instead of copying workflows.

## Name

Use `marlens-skills-rules-and-tools` as the package/plugin slug, GitHub repo name, and OMP marketplace name. Use "Marlen's Skills, Rules, and Tools" as the display name.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP or manual symlink consumers
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `docs/` - authoritative generic workflow, template, reference, and plan discovery docs
- `examples/` - compact before/after outcomes for packaged skills, rules, and tools
- `skills/` - thin skill aliases that point at authoritative workflows under `docs/workflows/`
- `rules/` - reusable OMP rule files that can be copied or linked into `~/.omp/agent/rules`
- `lib/` - Ruby implementation for shared package binaries such as `dev`
- `bin/agent-guidance-audit.js` - read-only downstream agent-guidance audit helper for stale package names, broken local links, and explicit mirror drift checks
- `package.json` - OMP package manifest that loads the adapter and exposes sibling skills
- `omp-plugin/` - OMP-specific runtime adapter; no shared workflow content lives here
- `.omp-plugin/` - OMP marketplace catalog
- `.claude-plugin/` - Claude Code plugin manifest and marketplace catalog
