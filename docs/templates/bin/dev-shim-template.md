# Dev Shim Template

Use this for a project-local `bin/dev` that passes an explicit local config path to the shared Ruby `dev` binary.

```sh
#!/usr/bin/env sh
set -eu

exec dev --config dev.config.rb "$@"
```

## Setup

Use the happy path from the repository root after installing the documented Ruby/runtime and project dependencies and supplying required local configuration.

1. Copy this template to `bin/dev`.
2. Make it executable: `chmod +x bin/dev`.
3. Add `dev.config.rb` from `docs/templates/bin/dev-config-template.md` when service names or commands differ from the defaults.
4. Run `bin/dev <command> <options>` from the project root.

The shim selects the explicit local config and forwards all remaining caller arguments unchanged. Do not add local parsing to normalize upstream flags. Required prerequisites should fail clearly with the missing requirement; do not silently start in a reduced fallback mode.

## Why a Shim

The shared `dev` binary owns generic command behavior. The project-local `bin/dev` shim owns the local entrypoint, config path, and any project-specific overrides. Keep it direct unless a real project-specific invariant requires more.
