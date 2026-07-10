# Dev Shim Template

Use this for a project-local `bin/dev` that passes an explicit local config path to the shared Ruby `dev` binary.

```sh
#!/usr/bin/env sh
set -eu

exec dev --config dev.config.rb "$@"
```

## Setup

1. Copy this template to `bin/dev`.
2. Make it executable: `chmod +x bin/dev`.
3. Add `dev.config.rb` from `docs/templates/bin/dev-config-template.md` when service names or commands differ from the defaults.

## Why a Shim

The shared `dev` binary owns generic command behavior. The project-local `bin/dev` shim owns the local entrypoint, config path, and any project-specific overrides.
