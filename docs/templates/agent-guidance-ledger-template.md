# Agent Guidance Ledger Template

Use this when a downstream repo wants an audit-friendly record of shared guidance it has already adopted, local overrides it still owns, and guidance that must remain project-specific.

## Placement

Put the ledger in an agent-readable documentation location, not main project config:

- `agents/guidance-ledger.yml` for repos that still use `agents/`. <!-- agent-guidance-audit: ignore backtick-path -->
- `docs/agent-guidance-ledger.yml` or `docs/references/agent-guidance-ledger.yml` for repos already centered on `docs/`. <!-- agent-guidance-audit: ignore backtick-path -->
- A short link from `AGENTS.md` when agents need a discoverability pointer.

## Boundary

This ledger is informational and audit-only. It must not gate skill, tool, workflow, or template discovery, and it must not become an allowlist of permitted upstream capabilities. Shared package discovery remains dynamic so downstream repos can discover newly released guidance.

`adopted` means known migrations already completed. It is not the complete permitted tool set.

## Template

```yaml
shared_guidance:
  package: github:klondikemarlen/marlens-skills-rules-and-tools
  adopted:
    - docs/workflows/pull-request-management-workflow.md
    - docs/workflows/testing-instructions-workflow.md
  local_overrides:
    - agents/workflows/browser-qa-workflow.md
  intentionally_local:
    - Auth0 login setup
    - project-specific Docker/dev commands
    - domain language and UI labels
    - deployment steps and production infrastructure details
```

## Fields

- `package`: canonical shared package source the downstream repo is comparing against.
- `adopted`: shared package workflows, templates, references, skills, or rules already migrated or intentionally used locally.
- `local_overrides`: downstream files that intentionally override shared guidance because local stack, auth, command, or deployment behavior differs.
- `intentionally_local`: project-specific knowledge that should stay in the downstream repo, such as setup commands, auth flows, domain terms, route names, UI labels, schemas, secrets handling, deployment details, and operational runbooks.

## Verification Checklist

- [ ] The ledger lives under `agents/`, `docs/`, or is linked from `AGENTS.md`; it is not in main project config such as `.config/`. <!-- agent-guidance-audit: ignore backtick-path -->
- [ ] `package` names `github:klondikemarlen/marlens-skills-rules-and-tools`.
- [ ] `adopted` entries describe completed migrations only, not an allowlist.
- [ ] `local_overrides` names files that intentionally replace or narrow shared guidance.
- [ ] `intentionally_local` keeps project-specific commands, auth setup, domain language, route names, UI labels, and deployment details downstream.
