# Code Review Workflow

Use when reviewing a branch, pull request, or local diff.

## Intent

**WHY this workflow exists:** Reviews should find concrete bugs, regressions, missing tests, and maintainability risks before style nits.

**WHAT this workflow produces:** Findings ordered by severity, each with a location, risk, and concrete fix. If there are no findings, it says so and names any residual test gaps.

**Decision Rules:**

- Lead with behavior, contracts, data safety, security, and missing verification.
- Treat style as worth raising only when it affects clarity, consistency, or future safety.
- Use project-local rules first: `AGENTS.md`, `README.md`, `COMMITTING.md`, `bin/README.md`, and local `agents/` docs.
- Prefer deletion and simpler existing patterns over new abstractions.
- Do not block on project-specific rules that are not documented locally.

## Process

1. Read the request, issue, PR body, or plan.
2. Inspect the changed files and identify whether the change is backend, frontend, migration, test-only, documentation-only, or cross-cutting.
3. Read project-local rules and setup docs that govern the changed area.
4. Check behavior and contracts: API shapes, serializers, policy/access rules, migrations, persistence, and UI route flows when relevant.
5. Check type and error handling: avoid unsafe casts, non-null assumptions, swallowed errors, and impossible states represented as runtime branches.
6. Check tests and verification: changed behavior should have the smallest meaningful runnable check, and PR testing instructions should match user-visible behavior.
7. Check simplicity: flag helpers, options, abstractions, comments, or compatibility paths that solve no current problem.
8. Check dead code: if a replacement makes old code unreachable, remove stale types, imports, exports, and documentation.

## Output Contract

List findings first, ordered by severity.

```text
[severity] Short finding title
File: path/to/file.ts:42
Risk: What can break or mislead users/developers.
Fix: One concrete change.
```

After findings, include open questions or assumptions. If there are no findings, say that clearly and mention any test gaps or residual risk.
