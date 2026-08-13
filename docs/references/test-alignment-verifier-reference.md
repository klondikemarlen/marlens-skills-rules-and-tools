# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against a shared baseline and optional stricter local guidance in the active repository. It reports `PASS`, `FAIL`, or `BLOCKED`; it never changes tests.

## Shared Baseline

Every changed test file must meet these rules without a README directive:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments.
- `one-direct-expect` — at most one direct `expect(...)` call per test. Tests without an assertion are not violations of this narrow rule.

Failure evidence identifies the changed test, violated rule, and `shared baseline` as its source.

## Stricter Local Additions

Put one or more supported directives in the nearest `README.md` or `README.mdx` at or above the test file:

```md
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
```

These additions layer on top of the shared baseline:

- `no-mock-calls` — no bundled `.mock.calls` assertions.
- `describe-file-class-method` — three nested `describe` scopes for file, class, and method.

The baseline directives remain accepted for existing README files, but cannot disable or replace baseline rules.

The assertion rule recognizes `it` and `test` callbacks, including `.each`, `.only`, `.skip`, `.concurrent`, and `.fails` variants.

To exempt one test with independently observable contracts, put this comment in its body and name the reason:

```ts
// marlens-test-alignment: allow-multiple-expects -- status and body are independent observable contracts.
```

The exemption applies only to `one-direct-expect`; every other configured directive still applies. It requires text after `--`, so a bare waiver is not supported.

## Scoped Suppression

Use the repository-root `.marlens-verifications.json` only when a bounded legacy path cannot meet the shared contract yet:

```json
{
  "suppressions": [
    {
      "id": "marlens-rules:test-alignment",
      "path": "tests/legacy",
      "reason": "Legacy tests are being migrated separately.",
      "expiresOn": "2026-12-31"
    }
  ]
}
```

`id`, project-relative `path`, and non-empty `reason` are required. `path` is a file or directory, not a glob; use `.` only to suppress the whole project. `expiresOn` is optional and uses `YYYY-MM-DD`.

The verifier reports every matching suppression and its reason in `PASS` or `FAIL` evidence. Invalid or expired suppressions return `BLOCKED`; they never silently disable a check.

## Automatic Selection

The plugin manifest declares `pathTriggers` for JavaScript and TypeScript test paths. [`omp-verifier` issue #86](https://github.com/klondikemarlen/omp-verifier/issues/86) owns consuming those triggers during completed-change verification; until that runtime release is installed, invoke this verification explicitly.

## Diff Scope

Set `MARLENS_TEST_ALIGNMENT_BASE` to the PR base ref when checking committed branch changes:

```bash
MARLENS_TEST_ALIGNMENT_BASE=origin/main /verifier verify marlens-rules:test-alignment
```

With that variable, the verifier compares committed branch changes to the base and also includes current worktree and untracked tests. Without it, the verifier examines the current worktree diff against `HEAD` plus untracked tests; use it before committing local test changes.

Running `node verifications/test-alignment.mjs` directly prints the same result and exits non-zero when it reports `FAIL`, so CI can enforce the shared baseline and local additions without the agent verifier.
