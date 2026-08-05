# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against opt-in guidance in the active repository. It reports `PASS`, `FAIL`, or `NOT_CONFIGURED`; it never changes tests.

## Opt-In Guidance

Put one or more supported directives in the nearest `README.md` or `README.mdx` at or above the test file:

```md
<!-- marlens-test-alignment: test-name-when -->
<!-- marlens-test-alignment: arrange-act-assert -->
<!-- marlens-test-alignment: one-direct-expect -->
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
```

Each directive makes only its named convention enforceable:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments.
- `one-direct-expect` — exactly one direct `expect(...)` call per test.
- `no-mock-calls` — no bundled `.mock.calls` assertions.
- `describe-file-class-method` — three nested `describe` scopes for file, class, and method.

The verifier includes the guidance file, directive line, changed test line, quoted test declaration, and a remediation in every failure. It reports `NOT_CONFIGURED` when changed tests have no supported local directives rather than inventing a style rule.

## Diff Scope

Set `MARLENS_TEST_ALIGNMENT_BASE` to the PR base ref when checking committed branch changes:

```bash
MARLENS_TEST_ALIGNMENT_BASE=origin/main /verifier verify marlens-rules:test-alignment
```

Without that variable, the verifier examines the current worktree diff against `HEAD`; use it before committing local test changes.
