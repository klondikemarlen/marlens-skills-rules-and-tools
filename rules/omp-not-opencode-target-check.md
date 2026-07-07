---
name: omp-not-opencode-target-check
description: "When the user says OMP, do not write OpenCode docs, config paths, or install instructions into OMP plugin work."
condition: "OpenCode'?s? `plugin` config|opencode\\.ai|~\\/\\.config\\/opencode\\/opencode\\.jsonc?|\\/home\\/[^\\s\"']+\\/\\.config\\/opencode\\/opencode\\.jsonc?"
scope: "tool"
---

Treat **OMP / Oh My Pi** (`https://omp.sh`) and **OpenCode** (`https://opencode.ai`) as different products with different plugin systems.

When the user says **OMP**, use OMP plugin docs, OMP install commands such as `omp install <source>`, OMP plugin manifests such as `omp.extensions` or `plugin.json`, and OMP paths under `~/.omp/...`.

Before writing install docs or editing local config, verify the target runtime from the user's wording and the package format. Do **not** write OpenCode URLs, `opencode.json`, or `~/.config/opencode/...` paths unless the user explicitly asked for OpenCode.
