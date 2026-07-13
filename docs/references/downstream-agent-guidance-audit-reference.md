# Downstream Agent Guidance Audit Reference

Use this when checking downstream repos for stale shared-agent guidance, broken local documentation links, static workflow inventory drift, or explicitly paired guidance-tree drift.

## Scope

The audit is read-only maintainer tooling. It reports findings and never edits downstream repos. It does not gate upstream skill, tool, workflow, or template discovery.

Migration ledgers are informational/audit-only. The audit may report stale paths inside a ledger, but a ledger must not act as an allowlist or suppress dynamic discovery of newer shared package guidance.

## CLI

From this repo:

```bash
node bin/agent-guidance-audit.js [--json] [--strict] [--mirror <left>=<right>] <downstream-root>...
```

Installed package form:

```bash
agent-guidance-audit [--json] [--strict] <downstream-root>...
```

Exit codes:

- `0`: no findings.
- `1`: findings were reported.
- `2`: usage or read error.

Default text output is stable for issue bodies:

```text
FAIL /path/to/repo/docs/workflows/example.md:42 markdown-link missing target ./missing-template.md
```

Use `--json` when another script needs structured findings. Use `--strict` to fail on static workflow README inventory drift for workflow READMEs that include the `<!-- agent-guidance-audit: inventory -->` marker.

Suppress intentional examples on the same line with `<!-- agent-guidance-audit: ignore <check> [target] -->`. Suppressible checks are `stale-package-name`, `stale-install-command`, `removed-learner-surface`, `markdown-link`, and `backtick-path`. Suppressions are exact: malformed, unknown, or unused suppressions are findings.

## Checks

- Stale shared package identity: `marlens-rules-and-skills`. <!-- agent-guidance-audit: ignore stale-package-name -->
- Stale install command form: `omp install github:klondikemarlen/marlens-skills-rules-and-tools`. <!-- agent-guidance-audit: ignore stale-install-command -->
- Removed bundled learner public surfaces: `/learner` commands except standalone `omp-learner` setup (`/learner setup <upstream-repository-url>`), `learner_record_candidate`, `docs/workflows/learner-feedback-workflow.md`, `docs/evals/learner-feedback.json`, `skills/learner`, and `omp-plugin/learner` paths. <!-- agent-guidance-audit: ignore backtick-path --> <!-- agent-guidance-audit: ignore removed-learner-surface -->
- Markdown links to missing local files, resolved relative to the containing Markdown file.
- Backtick path references to missing local files for path-like prefixes such as `docs/`, `agents/`, `skills/`, `scripts/`, `lib/`, `bin/`, `rules/`, `./`, and `../`. <!-- agent-guidance-audit: ignore backtick-path -->
- Static workflow README inventory drift when `--strict` is set and the workflow README includes `<!-- agent-guidance-audit: inventory -->`.
- Explicit mirror drift when `--mirror left=right` is supplied.

## Mirror Drift

Do not guess repository relationships. Only compare mirrored guidance trees after a maintainer supplies explicit paths:

```bash
node bin/agent-guidance-audit.js --mirror ../wrap/agents=../wrap-deploy/agents ../wrap
```

The audit reports missing or changed files under the paired trees. It does not decide which side is canonical.

## Verification Checklist

- [ ] Run against each downstream checkout path from the repo root.
- [ ] Confirm findings include exact file paths and line numbers.
- [ ] Treat ledger findings as cleanup hints, not discovery gates.
- [ ] Verify mirror pairs manually before adding `--mirror` to automation.
