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
- `one-direct-expect` — at most one direct `expect(...)` call per test. Tests without an assertion are not violations of this narrow rule.
- `no-mock-calls` — no bundled `.mock.calls` assertions.
- `describe-file-class-method` — three nested `describe` scopes for file, class, and method.

The assertion rule recognizes `it` and `test` callbacks, including `.each`, `.only`, `.skip`, `.concurrent`, and `.fails` variants.

To exempt one test with independently observable contracts, put this comment in its body and name the reason:

```ts
// marlens-test-alignment: allow-multiple-expects -- status and body are independent observable contracts.
```

The exemption applies only to `one-direct-expect`; every other configured directive still applies. It requires text after `--`, so a bare waiver is not supported.

The verifier includes the guidance file, directive line, changed test path, test title, expectation count, and a remediation in every failure. It reports `NOT_CONFIGURED` when changed tests have no supported local directives rather than inventing a style rule.

## Diff Scope

Set `MARLENS_TEST_ALIGNMENT_BASE` to the PR base ref when checking committed branch changes:

```bash
MARLENS_TEST_ALIGNMENT_BASE=origin/main /verifier verify marlens-rules:test-alignment
```

With that variable, the verifier compares committed branch changes to the base and also includes current worktree and untracked tests. Without it, the verifier examines the current worktree diff against `HEAD` plus untracked tests; use it before committing local test changes.

Running `node verifications/test-alignment.mjs` directly prints the same result and exits non-zero when it reports `FAIL`, so CI can enforce configured guidance without the agent verifier.
