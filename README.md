# Marlen's Skills, Rules, and Tools

Marlen's coding conventions, task workflows, and practical tools for AI-assisted development. The goal is code and communication that reflect how Marlen works, with the knowledge kept in Git so it can be reviewed, shared, and recovered on another machine.

Install the package for **OMP** or **Claude Code**, or use its Markdown guidance with another agent. MSSRT is pronounced “em-ess-ess-are-tee”.

## Start Here

- **Understand administrator requests before approving them:** [Privilege Preview](#privilege-preview) opens a native GNOME window explaining what needs access and why. Try the demo without authenticating or executing a command.
- **Give an agent a clear outcome:** use [evolve, advance, improve, simplify, wrap-up, or triage](#four-verbs-to-remember) instead of rebuilding the same prompt every time.
- **Find a practical helper:** [preview browser handoffs, recover conventions into native memory, or mark explicitly reviewed PR files](#useful-tools).
- **Use the detailed guidance:** browse the [skill catalog](skills/), [documentation map](docs/index.md), or [before/after examples](examples/).

## OMP Plugin Install

```bash
omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools
```

Restart OMP after installation or an update so it loads the current commands, skills, and rules. This direct install includes the OMP adapter; it follows the repository's default branch. See the [install reference](docs/references/omp-plugin-install-reference.md) for artifact identity and cache troubleshooting.

Skills are loaded when their task applies. Packaged rules are active by default; [customize them](#local-customization) for your projects. Browser automation, project test dependencies, and companion runtime plugins are not installed by this package.

## Privilege Preview

When an agent needs administrator access for an explicitly authorized operation, **`privilege-preview` explains the request before system authentication**. Its native GNOME window shows the affected resource, what has happened, why access is needed, and the intended result. **Details** reveals the exact command, working directory, and requesting agent.

After installing the OMP plugin, type this **inside OMP**:

```text
/privilege-preview demo
```

The demo shows an illustrative project blocked by missing Git. It does not inspect your machine, install Git, authenticate, or execute the displayed command. Choose **Close Demo** to finish, or **Cancel** to dismiss it. Command and `demo` argument autocomplete are available.

For a real request, the caller supplies structured task context and an exact command through the CLI. **Continue** hands that command to system authorization through `pkexec`; the system polkit agent handles credentials. The OMP slash command is demo-only.

**Requirements:** a non-root Linux desktop session with Python/PyGObject, GTK 4, and libadwaita. Real requests additionally need compatible `pkexec` and a working polkit authentication agent. The package does not install these system dependencies. See the [complete prerequisites and usage](docs/references/privilege-preview-reference.md#prerequisites), including the external-terminal command.

This is an informed approval handoff, **not a sandbox**. It does not intercept existing `sudo` calls or make an arbitrary command safe. The caller still needs authorization for the task and must provide truthful context.

[Usage, request format, and safety boundaries](docs/references/privilege-preview-reference.md) · [Implementation](lib/privilege-preview/)

## Four Verbs to Remember

For a complete improvement cycle, ask **“Use evolve on this repo”** or invoke `/skill:evolve` in OMP. It runs **advance → improve → simplify → wrap-up** once, with bounded triage when selecting ticket work. Each stage can conclude that no change is justified; this is not an automatic backlog drain.

For a narrower task:

| Skill                                  | Example Request                                     | Outcome                                                                  |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| [`advance`](skills/advance/SKILL.md)   | “Move this project forward.”                        | Deliver one valuable, bounded outcome.                                   |
| [`improve`](skills/improve/SKILL.md)   | “Reassess this repo's guidance and implementation.” | Address one evidenced gap, or explain why no change is needed.           |
| [`simplify`](skills/simplify/SKILL.md) | “Simplify the hardest-to-read code.”                | Reduce a real maintenance burden without changing behavior.              |
| [`wrap-up`](skills/wrap-up/SKILL.md)   | “Finish this task and clean up.”                    | Close delivery and verification loops; remove owned temporary resources. |

Use [`triage`](skills/triage/SKILL.md) to assess tickets and apply supported evidence-backed updates without starting implementation. Add “assessment only” or “no writes” when you want a read-only assessment. Triage is not implementation approval.

Use [`data-mine`](skills/data-mine/SKILL.md) to extract evidence-backed insights from a given OMP chat: `/skill:data-mine <session ID or path>`, or supply the transcript. Standalone mining is read-only unless you authorize follow-up actions. `wrap-up` uses the same workflow for the current session and completed task's commits.

In OMP, type `/skill:` to browse the full catalog. Specialist entrypoints include [`feature`](skills/feature/SKILL.md), [`code-review`](skills/code-review/SKILL.md), [`testing-instructions`](skills/testing-instructions/SKILL.md), and [`jira-reporting`](skills/jira-reporting/SKILL.md). Agents can also discover the relevant skill from its task description.

These workflows respect project-local instructions and the task's authorization. Neither `evolve` nor `wrap-up` exits OMP unless you explicitly ask for exit after completion.

## Useful Tools

| Need                                                  | Tool and Boundary                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand a browser sign-in or authorization handoff | [`authorization-preview`](docs/references/authorization-preview-reference.md) explains the work before opening a supplied HTTPS destination. It does not certify that destination as safe.                                                                                                                                        |
| Recover coding conventions on another machine         | [`conventions-memory`](docs/references/conventions-memory-reference.md) imports committed Markdown into an explicitly selected native Mnemopi database. Preview before applying; Git remains authoritative and memory settings are not changed. Requires Bun; retrieval does not guarantee better coding adherence.               |
| Update personal PR review progress                    | [`github-reviewed-files`](docs/references/github-tooling-reference.md#opt-in-reviewed-files-helper) inspects exact paths by default and marks only explicitly approved, reviewed paths with `--mark-viewed`. It checks viewer/head identity and fresh readback; it does not review code or make GitHub mutations revision-atomic. |
| Work with GitHub review comments                      | [`github-review-thread`](docs/references/github-tooling-reference.md#review-comment-thread-actions) supports reactions, replies, and thread resolution.                                                                                                                                                                           |
| Prepare a ticket assessment                           | [`triage`](docs/references/ticket-triage-reference.md) captures read-only GitHub evidence and renders an agent-authored assessment. The CLI itself does not modify tickets.                                                                                                                                                       |
| Set up worktrees or edit commit history               | [`agent-worktree` and `agent-rebase-edit`](bin/README.md) provide packaged Git helpers.                                                                                                                                                                                                                                           |

Package commands are available on **OMP's process PATH**, not automatically in your external terminal. Each tool's reference documents its invocation and prerequisites. Browse the [complete command list](bin/README.md) for other helpers, including the Ruby `dev` wrapper for downstream Docker Compose projects.

For Jest or Vitest HTTP tests, the optional [HTTP response matcher](docs/references/http-response-matcher-reference.md) checks status and body as one response contract. Install [the standalone matcher](https://github.com/klondikemarlen/expect-http-response#installation) as a project development dependency; you do not need MSSRT just for that matcher.

## Default OMP Rules

Every reusable rule under [`rules/`](rules/) is active by default after plugin discovery. These carry coding, review, and workflow preferences; specialist skills remain task-specific.

### Local Customization

- Define a project or user rule with the **same name** to override a packaged rule.
- Add a differently named rule under `.omp/rules/` or `~/.omp/agent/rules/` to extend the defaults.
- Use OMP's `ttsr.disabledRules` setting to disable a rule deliberately.
- Keep project-specific commands, domain language, UI labels, and stack conventions in the owning repository.

Project-local guidance wins over this package's fallback guidance. See [guidance precedence](docs/references/guidance-precedence-reference.md) for placement and override rules.

## Default Verifications

MSSRT supplies checks and semantic review contracts; the optional [`omp-verifier`](https://github.com/klondikemarlen/omp-verifier) runtime discovers and runs them. Installing this package alone does not enable automatic advisor correction. See [Rules and Verifications](docs/references/rules-and-verifications-reference.md) for check scope and configuration, and [Quality Ownership](docs/references/quality-ownership-reference.md) for the policy/runtime boundary.

After setting up Verifier, restart OMP and run `/advisor status`. A `verifier [no model]` result means the advisor cannot perform correction. A UI notification alone is not correction evidence. The [correction-coverage guide](docs/references/quality-ownership-reference.md#correction-coverage-and-verification-evidence) explains the required failure, remediation, and fresh-pass proof.

## Claude Code Plugin Install

```bash
claude plugin marketplace add klondikemarlen/marlens-skills-rules-and-tools
claude plugin install marlens-skills-rules-and-tools@marlens-skills-rules-and-tools
```

Skills use the plugin namespace, for example `/marlens-skills-rules-and-tools:feature` or `/marlens-skills-rules-and-tools:code-review`. The Claude adapter loads the shared skill tree; OMP-specific slash commands are not Claude commands. For local development, use `claude --plugin-dir /path/to/marlens-skills-rules-and-tools`.

## Manual Install

For agents without a plugin system, clone this repository and point the agent at [`AGENTS.md`](AGENTS.md). Copy or link applicable reusable files into the locations that agent reads, preserving existing local guidance. The [skills](skills/) select procedures under [docs/workflows](docs/workflows/); [rules](rules/) can be copied or linked into the agent's rules directory. Restart the agent after changing startup-loaded guidance.

## Companion Runtime Plugins

These are separate, optional installations with independent releases. Follow each project's setup guide; install only the capabilities you need.

| Companion                                                                        | Use It For                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Verifier](https://github.com/klondikemarlen/omp-verifier)                       | Running declared checks and delivering advisor correction.                                                               |
| [Learner](https://github.com/klondikemarlen/omp-learner)                         | Turning corrections and workflow gaps into reviewable proposals. Proposals are not permission to implement.              |
| [Soft Boundary Guard](https://github.com/klondikemarlen/omp-soft-boundary-guard) | Approval for recognized external GitHub writes and warnings for other supported boundary crossings. It is not a sandbox. |
| [Send Context](https://github.com/klondikemarlen/omp-send-context)               | Sending selected editor or Firefox content into an OMP prompt.                                                           |
| [Instance Control](https://github.com/klondikemarlen/omp-instance-control)       | Linux managed-terminal discovery, addressed peer messaging, and restart/resume.                                          |
| [Project Time](https://github.com/klondikemarlen/omp-project-time)               | Recording local human-active and agent-turn intervals, not billable totals.                                              |
| [Worklog](https://github.com/klondikemarlen/omp-worklog)                         | Preparing work-log drafts and filing explicitly approved Harvest batches.                                                |
| [Auto Retitle](https://github.com/klondikemarlen/omp-auto-retitle)               | Cleaning up session titles automatically.                                                                                |
| [Exit Command](https://github.com/klondikemarlen/omp-exit-command)               | Ending OMP sessions intentionally.                                                                                       |

## Task-Oriented Documentation Map

The [full documentation map](docs/index.md) is the starting point for procedures, templates, and references. Common routes:

| Task                                 | Read                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Deliver an issue or feature          | [Feature workflow](docs/workflows/feature-workflow.md)                                           |
| Create or update a pull request      | [PR management](docs/workflows/pull-request-management-workflow.md)                              |
| Resolve review feedback              | [Review-comment resolution](docs/workflows/pull-request-comment-resolution-workflow.md)          |
| Commit changes or edit older commits | [Commit conventions](COMMITTING.md) and [rebase workflow](docs/workflows/git-rebase-workflow.md) |
| Start from an established code shape | [Templates](docs/templates/) and [before/after examples](examples/)                              |
| Maintain a project's own knowledge   | [Project knowledge base](docs/workflows/project-knowledge-base-workflow.md)                      |

## Repository Development Checks

Use Node.js 22.13 or newer on the 22.x line, or Node.js 24+, with npm, Bun 1.4.4, and Python 3.10+ with `venv` support. Run these commands natively from this checkout:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-lint.txt
npm ci
npm run lint
npm run lint:python
npm test
npm run test:memory
npm run test:reviewed-files
npm pack --dry-run --json
```

JavaScript/TypeScript lint runs without fixes or warnings; TypeScript lint is not typechecking. Python lint uses the repository's pinned Ruff rules for the native dialog. GUI dependencies are separate system prerequisites; linting does not open a window or request administrator access.

The [Verifier bindings](.omp-verifier.json) are checkout-specific, not installed rules for consuming projects. The packaged `bin/dev` is a downstream Docker Compose helper, **not this repository's test wrapper**; these checks need no Docker service. CI runs both lint commands, the package checks, and the native-memory and reviewed-files suites.

To develop the OMP plugin from this checkout, run `omp plugin link /path/to/marlens-skills-rules-and-tools`, then restart OMP after changes before testing installed behavior.

## Feature and Issue Workflow

Follow the [contribution policy](.github/CONTRIBUTING.md) and [feature workflow](docs/workflows/feature-workflow.md). Feature decisions belong to the maintainer; a submitted issue is not implementation approval.

In this repo only, an explicit request to follow the GitHub issue or feature request workflow authorizes staging and committing the scoped files for that workflow. Keep the broader global Git safety rules in place for other repositories.

1. Create or identify an issue with the user story and acceptance criteria.
2. Branch from current `main` using the issue number and a concise outcome slug before editing when possible; create the issue-named branch before committing existing scoped work.
3. Make the smallest change that resolves the request, including affected docs and skill mirrors.
4. Bump `package.json` for every change, keeping the lockfile and Claude manifest aligned. Curate the outcome under `Unreleased` in [CHANGELOG.md](CHANGELOG.md), following the [release-notes workflow](docs/workflows/release-notes-workflow.md).
5. Open an issue-linked draft PR as soon as the first coherent change can be pushed. Continue implementation and QA in that draft; mark it ready only after verification.
6. At release preparation, move the changelog outcome into the selected version heading with a UTC date and real PR/release or immutable comparison link. Merge to `main`: **that merge is this package's release**. Verify the date against GitHub's `mergedAt`; correct a mismatch through the normal issue/PR flow. Do not claim a separate npm or marketplace publish.
7. Close the issue via the fixing PR. If a fix already landed directly on `main`, cite its commit and close the issue rather than creating a misleading closing PR.
8. Reinstall from this repository after merge, verify the installed artifact, and reload the plugin if supported or restart OMP before retesting.

## Release Versioning

Use semantic versioning with cumulative release judgment:

- Bump **major** for a breaking public plugin, tool, skill, workflow, or configuration contract.
- Bump **minor** for a backward-compatible reusable capability, substantive core workflow change, or a cumulative set of compatible changes that now merits a higher-tier release.
- Bump **patch** for compatible fixes, clarifications, and narrow maintenance.

There is no numeric patch threshold. Promote to a minor release before a long run of compatible changes becomes misleading; use the size and public significance of the accumulated work rather than a mechanical counter. Do not rewrite historical versions.

## Stability

The package's public surfaces are its installable metadata, skill entrypoints, workflows/templates/references under `docs/`, examples, rules, packaged commands, and thin OMP/Claude adapters. Optional companion runtimes, downstream project configuration, browser automation, and project test dependencies are separate concerns with their own owners.

## Release History

See [CHANGELOG.md](CHANGELOG.md) for the curated release history, newest versions first.
