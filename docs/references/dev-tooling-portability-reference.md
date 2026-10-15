# Development Tooling Portability Reference

Use when deciding whether a project-local executable helper belongs in this shared package.

## Shared Dev Wrapper Pattern

Start from the ordinary repository-root setup: install the documented Ruby/runtime and project dependencies, provide required local configuration, then run `bin/dev` from the project root. The shared Ruby `dev` executable owns generic Docker Compose commands and project-local `bin/dev` shims select the local config path and pass caller arguments through unchanged. Keep service names, command overrides, ports, profiles, and environment details in `dev.config.rb`.

The shared wrapper should own behavior that is consistent across repositories: compose passthrough, `up`, `down`, `logs`, `ps`, `run`, `exec`, service shells, test dispatch, and type-check dispatch. Local projects should own the names and commands that vary.

On the documented path, required prerequisites should be present. If a required editor, configuration value, executable, or integration prerequisite is absent, fail with a direct actionable error; do not add fallback startup branches merely to make an unsupported setup appear to work. Keep the check at the boundary that owns the prerequisite.

### Thin Entry Points and Values

Forward caller options verbatim and let the underlying command own its option semantics. For example, `bin/dev up -d --wait` should reach Compose as supplied; do not parse a local `--wait` or `--wait=true` and synthesize `-d`. A documented upstream limitation is not by itself reason to build a project-specific compatibility parser.

Use ordinary Bundler and repository configuration. Avoid custom `BUNDLE_GEMFILE` discovery or repeated configuration calls when standard setup and one clear default suffice. Keep required bind/exposure configuration explicit; do not invent credentials, editor commands, or unrelated defaults.

Use descriptive names for values and helpers. For dynamic environment passed to a Ruby API that accepts a hash, use one builder (for example, `dynamic_environment_variables`) and keep native hash values until the shell boundary requires serialization. Avoid duplicate builders, dual-format flags, and indirection that merely renames a direct operation.

### Dependency Release Selection

When adopting or integrating a dependency, honor an explicit request for its latest published release: at the adoption decision, inspect the authoritative package registry and that release's public API and changelog. Reuse a sibling project's responsibility boundaries and organization, but do not treat its older dependency pin as a constraint that overrides the request. Prefer documented capabilities and defaults of the requested release over plumbing needed only by an older reference, while preserving necessary integration and safety boundaries.

Before removing consumer setup, check the caller's settings and the release's changed defaults, security implications, and compatibility with the project's dependency constraints. If an evidenced incompatibility or release constraint prevents adoption, state the evidence and the materially different choice before reducing scope. Without an upgrade request, leave intentional pins unchanged; stylistic alignment alone does not authorize an upgrade.

Verify the chosen version in the manifest and lockfile, confirm the installed artifact version, and exercise the changed consumer path. Do not claim a version is latest based on an earlier check in the conversation. Registry inspection is an adoption-time decision, not a repeated query on every tool turn or an automatic-upgrade policy.

### Before and After

Before: a shim detects `--wait`/`--wait=true`, edits arguments to inject `-d`, checks whether an editor exists, then silently starts without editor integration if absent. This duplicates upstream option handling and hides a missing prerequisite.

After: `exec dev --config dev.config.rb "$@"` forwards the invocation unchanged; `dev up -d --wait` requests detached startup with Compose's own flags. The normal setup supplies required editor/configuration, and a missing editor fails explicitly with an actionable message. This follows the project's existing shim/config split; it does not remove real integration prerequisites or adapter-owned cleanup.

Review criteria: reject fallback branches, local argument normalization, repeated configuration, duplicate environment builders, and generic helper indirection unless a concrete current invariant or integration boundary requires them. Keep necessary safety/lifecycle contracts and enable optional integrations only on paths that supply their prerequisites (for example, do not activate a mounted Vite plugin for a one-off container that lacks its module).

## Ownership Boundary

The shared wrapper and any future reusable helpers own cross-project command mechanics and reusable adapter behavior. A project owns its entrypoint, configuration, service and command names, Compose files, ports, credentials, deployment assumptions, and opt-in integrations. Reuse the existing shim, `dev.config.rb`, and plugin extension points; do not turn the shared layer into an exhaustive compatibility framework or require a universal DSL.

The examples and criteria above reflect reviewed corrections and observed QA in [Travel Authorization PR #406](https://github.com/icefoganalytics/travel-authorization/pull/406): [thin-helper and detached-startup correction](https://github.com/icefoganalytics/travel-authorization/pull/406#issuecomment-6149477228), [happy-path/configuration correction](https://github.com/icefoganalytics/travel-authorization/pull/406#issuecomment-6150213633), and [mounted-plugin prerequisite failure](https://github.com/icefoganalytics/travel-authorization/pull/406#discussion_r4239465373). These sources support the behavioral examples, not a claim that shared gem APIs or artifacts exist.

For the bounded, conditional evolution path from current shim/config/plugin seams to a separately released artifact, see the [composable dev-helper gem adoption plan](../plans/composable-dev-helper-gem-adoption-plan.md).

## Default

Keep binaries project-local unless the same command contract is useful across multiple repositories or can be expressed as a `dev` config override.

## Good Shared-Tool Candidates

- Dependency-light scripts that use standard CLIs or package dependencies already declared by this repo.
- Commands with stable inputs and outputs across projects.
- Helpers that do not know project service names, ports, cloud targets, database names, or issue tracker project keys.
- Read-only inspection helpers, formatters, or text transformations with low operational risk.

## Keep Project-Local

- Project-local `bin/dev` shims and `dev.config.rb` files that choose Docker Compose files, service names, profiles, ports, databases, or local environment variables.
- Deploy, restart, release, or cloud-operation helpers tied to a specific infrastructure account or role.
- Jira/GitHub helpers that embed project keys, labels, boards, milestones, or team conventions.
- Editor bridges or API waiters that assume a particular app server, route shape, or authentication setup.
- Scripts whose failure could mutate production or non-test data.

## Import Checklist

Before moving a binary into this package:

1. Identify at least two repositories that can call it with the same documented contract.
2. Remove project names, service names, secret names, cloud targets, ports, and issue tracker IDs.
3. Define safety boundaries: read-only vs write, local vs remote, production blocked by default.
4. Add focused verification for the command's contract.
5. Document when a project should keep its own wrapper instead.

## Better First Step

When a helper is not portable yet, import the reusable workflow or reference pattern instead of the executable. For development wrappers, prefer adding a `dev` config option before adding another project-specific command.
