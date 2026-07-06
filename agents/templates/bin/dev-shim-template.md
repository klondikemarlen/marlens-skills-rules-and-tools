# Dev Shim Template

Use this for a project-local `bin/dev` that delegates to the shared Ruby `marlens-dev` binary while keeping local config beside the project.

```sh
#!/usr/bin/env sh
set -eu

export MARLENS_DEV_CONFIG="${MARLENS_DEV_CONFIG:-dev.config.rb}"
exec marlens-dev "$@"
```

## Setup

1. Copy this template to `bin/dev`.
2. Make it executable: `chmod +x bin/dev`.
3. Add `dev.config.rb` from `agents/templates/bin/dev-config-template.md` when service names or commands differ from the defaults.

## Why a Shim

The shared `marlens-dev` binary owns the generic command behavior. The project-local `bin/dev` shim owns the local entrypoint, config path, and any project-specific overrides.
