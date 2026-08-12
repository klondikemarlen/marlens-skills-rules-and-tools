# Code Review Workflow

Use when reviewing a branch, pull request, or local diff.

## Intent

**WHY this workflow exists:** Reviews should find concrete bugs, regressions, missing tests, and maintainability risks before style nits.

**WHAT this workflow produces:** Findings ordered by severity, each with a location, risk, and concrete fix. If there are no findings, it says so and names any residual test gaps.

**Decision Rules:**

- Lead with behavior, contracts, data safety, security, and missing verification.
- Start from Gold: name the behavior, invariant, or regression risk that must be proven before judging implementation quality.
- Treat style as worth raising only when it affects clarity, consistency, or future safety.
- Use Arrange / Act / Assert comments when each section clarifies meaningful setup, behavior, or assertion. Do not require aliases, no-op setup, or comments solely to manufacture a section; parameterized test arguments already provide arranged inputs.
- Flag cramped adjacent sibling logical blocks when local precedent separates them: top-level functions/classes/modules, class methods, helper sections, and test cases/groups should usually have one blank line between siblings for scanability.
- Use project-local rules first: `AGENTS.md`, `README.md`, `COMMITTING.md`, `bin/README.md`, and local `docs/` docs.
- Prefer deletion and simpler existing patterns over new abstractions.
- For generic parsing, traversal, tokenization, serialization, or equivalent plumbing, compare the standard library, installed dependencies, and well-maintained libraries before approving bespoke code. Prefer the option with lower net owned complexity after accounting for compatibility, maintenance, security, and the adapter code the project must own; keep product-specific policy explicit at the library boundary.
- For queued or deferred work, inspect whether its payload references a record the initiating operation deletes or invalidates before execution. Pass immutable delivery fields as a snapshot when they are sufficient; reload live state only when current data is required and absence is handled deliberately. Request a focused delayed-execution or deletion-path check when this lifecycle applies.
- Do not block on project-specific rules that are not documented locally.
- Test expectations should be declarative expected data, not expectation-building logic. For business catalogs and configured defaults, prefer explicit expected values over mapping, sorting, branching, or deriving expectations from the same production constant/helper under test.
- Default to one `expect` per test when it proves one focused observable contract; do not combine unrelated values merely to satisfy the heuristic. Repository-native assertion patterns override generic guidance. For a promise-error contract, prefer `await expect(promise).rejects.toThrow(...)`; do not manually catch its rejection or aggregate it with mock-call arrays solely to keep one `expect`. Assert mock calls separately only when they are independently observable and important. In controller tests, separately assert `response.status` and `response.body` only when they are independent observable contracts; this preserves clearer Vitest failure output and does not justify redundant assertions.
- For changed test files, inspect the nearest test-directory README and applicable local test guidance; report its assertion conventions and flag violations before reporting `PASS`, including multiple `expect(...)` calls when the local standard allows only one.
- Treat test setup as self-contained: prefer local setup and intentional duplication when it keeps inputs visible; flag helpers or fixtures that hide varying inputs or expected values, but allow stable environment setup.
- Make readability an explicit delivery gate: before reporting `PASS`, name each independent responsibility and its side effects. Flag unstructured accumulation of independent scenarios or repeated mechanics that hides the contract; review structure rather than numeric readability proxies, preserve literal scenario data locally, and do not require mechanical splits or generic fixture builders. Use the scenario guidance in [`code-organization-reference.md`](../references/code-organization-reference.md) when reviewing verification code.
- For each changed `index.ts`, require re-exports to be alphabetized by exported symbol within each intentional comment/category group. Flag out-of-order exports as required corrections, name the expected ordering, preserve category boundaries, and do not require unrelated barrel-file rewrites.
- Review commit scope when relevant: flag mixed code/test changes, migrations/schema/data changes, dependency churn, formatting, and documentation or workflow-learning updates unless the user explicitly requested a combined commit and the files are inseparable for review.
- For maintainability or organization findings, use `docs/references/code-organization-reference.md`: flag boundaries, modules, helpers, or abstractions only when they affect ownership, data handoffs, dependency direction, side effects, or future change safety. Keep Ponytail/YAGNI simplicity checks separate.

- Before proposing a reorganization, run the domain-discovery checkpoint in [`docs/references/code-organization-reference.md`](../references/code-organization-reference.md): inspect topology, cohesive concepts, repeated change clusters, varying dispatch dimensions, owned invariants, dependency direction, and sibling conventions. Treat churn, growing branches, context-heavy helpers, and repeated boundary crossings as evidence to investigate—not proof of a new abstraction—and record each candidate's evidence, responsibilities, boundary, and smallest safe next action.
- Flag private helpers that read instance fields when a caller can pass those values explicitly. Do not force parameters when the helper is inherently bound to object state.

## Process

1. Read the request, issue, PR body, or plan.
2. Inspect the changed files and identify whether the change is backend, frontend, migration, test-only, documentation-only, or cross-cutting.
3. Read project-local rules and setup docs that govern the changed area.
4. Check behavior and contracts: API shapes, serializers, policy/access rules, migrations, persistence, and UI route flows when relevant.
5. Check type and error handling: avoid unsafe casts, non-null assumptions, swallowed errors, and impossible states represented as runtime branches.
6. Check tests and verification: changed behavior should have the smallest meaningful runnable check, and PR testing instructions should match user-visible behavior.
7. Report evidence-sensitive checks as `PASS`, `FAIL`, or `BLOCKED` using the shared vocabulary in `AGENT_RULES.md`.
8. Check code organization: flag modules, services, repositories, value objects, adapters, or helper extractions that obscure ownership, create cycles, pass context bags, hide side effects, or fail to group code that changes together. Treat an oversized file as a signal to inspect responsibility clusters, independent change axes, side effects, dependency direction, and extraction seams; do not require a split when the file is cohesive, and do not accept a mechanical split that preserves the same tangles. State names should describe represented domain facts or lifecycles, and query/composable results should stay beside their direct derived state unless a stronger local convention applies.
9. Check simplicity: flag helpers, options, abstractions, comments, or compatibility paths that solve no current problem.
10. Check dead code: if a replacement makes old code unreachable, remove stale types, imports, exports, and documentation.

## Output Contract

List findings first, ordered by severity.

```text
[severity] Short finding title
File: path/to/file.ts:42
Risk: What can break or mislead users/developers.
Fix: One concrete change.
```

After findings, include open questions or assumptions. If there are no findings, say that clearly and mention any test gaps or residual risk.
