# Reusable OMP Rules

Generic OMP rule files that can be copied or linked into `~/.omp/agent/rules`.

## Install

After installing this package as an OMP plugin, copy or link only the rules you want:

```bash
PACKAGE="$HOME/.omp/plugins/node_modules/marlens-skills-rules-and-tools"
mkdir -p "$HOME/.omp/agent/rules"
ln -sf "$PACKAGE/rules/no-envrc-example-commits.md" "$HOME/.omp/agent/rules/"
ln -sf "$PACKAGE/rules/omp-not-opencode-target-check.md" "$HOME/.omp/agent/rules/"
ln -sf "$PACKAGE/rules/use-dev-wrapper-for-development-compose.md" "$HOME/.omp/agent/rules/"
```
Upgrading from v1.3.2 or earlier? Remove the obsolete rule before restarting OMP:

```bash
rm -f "$HOME/.omp/agent/rules/no-issue-filing-without-confirmation.md"
```


Restart OMP after changing global rule files.

## Scope

Keep rules here only when they are reusable across projects and do not conflict with this package's shared guidance.

Keep project-specific rules in the target repo or user-level rules directory. For example, WRAP-specific Vitest/database rules do not belong here.
