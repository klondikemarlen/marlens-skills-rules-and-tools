# Reusable OMP Rules

Generic OMP rules shipped by this package. Plugin installs discover every file in this directory automatically; no selection, copy, or symlink step is required.

## Default Behavior

Every packaged rule is active by default after OMP restarts. A project or user rule with the same name overrides the packaged rule, while a differently named local rule extends the active set. Add a rule name to OMP's `ttsr.disabledRules` setting only when deliberately disabling that rule.

For agents without OMP plugin support, copy or link the required files into that agent's normal rule directory:

```bash
REPO=/path/to/marlens-skills-rules-and-tools
mkdir -p "$HOME/.omp/agent/rules"
for rule in "$REPO"/rules/*.md; do
  [ "$(basename "$rule")" = README.md ] || ln -sf "$rule" "$HOME/.omp/agent/rules/"
done
```

Restart the agent after changing global rule files.

## Scope

Keep rules here only when they are reusable across projects and do not conflict with this package's shared guidance.

Use the [rules and verifications reference](../docs/references/rules-and-verifications-reference.md) to decide whether a reusable concern belongs in a rule, a deterministic verifier, both, or neither.

Keep project-specific rules in the target repo or user-level rules directory. For example, WRAP-specific Vitest/database rules do not belong here.
