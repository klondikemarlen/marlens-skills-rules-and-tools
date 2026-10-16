# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against a shared baseline and optional stricter local guidance in the active repository. It reports `PASS`, `FAIL`, or `BLOCKED`; it never changes tests.

## Shared Baseline

Every changed test file must meet these rules without a README directive:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments; `Arrange` followed by `Act / Assert` is also accepted when invoking the subject is itself the assertion, as in matcher tests. Do not invent aliases or no-op steps solely to separate those phases.

Failure evidence identifies the changed test, violated rule, and `shared baseline` as its source. Assertion count is not a shared quality gate.

## Explicit Local Additions

Put supported directives in the nearest `README.md` or `README.mdx` at or above the test file:

```md
<!-- marlens-test-alignment: one-direct-expect -->
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
```

- `one-direct-expect` — at most one direct `expect(...)` call per test, only when explicitly selected locally. This measures a local syntax convention, not test quality; a test without assertions does not violate this narrow rule.
- `no-mock-calls` — no bundled `.mock.calls` assertions.
- `describe-file-class-method` — three nested `describe` scopes for file, class, and method.

The naming and Arrange/Act/Assert baseline directives remain accepted in README files, but cannot disable or replace the shared baseline. The assertion-count rule recognizes `it` and `test` callbacks, including `.each`, `.only`, `.skip`, `.concurrent`, and `.fails` variants.

## Assertion Quality Requires Review

The authoring default is one `expect` for one observable contract, not a numeric quality quota. An HTTP response's status and body together describe one result. Prefer a native or meaningful matcher such as [`toHaveHttpResponse`](http-response-matcher-reference.md), which checks both without building a synthetic wrapper object. Keep independent persistence effects or other independently meaningful outcomes separate.

Where no suitable HTTP matcher is available, status and body may use two direct assertions in one focused test when together they prove the response contract. Do not add an inline `allow-multiple-expects` directive or rationale comment to justify the coupled assertions. Do not replace it with equivalent rationale prose, a broader suppression, a synthetic assertion bundle, or weaker assertions. Keep independent persistence effects or other independently meaningful outcomes separate.

If a repository explicitly selects `one-direct-expect`, its syntax gate conflicts with this response-contract guidance for a status/body pair that needs two assertions. Report that policy/check mismatch and preserve truthful status; do not silently waive the gate or reshape the test to hide it. Controller tests have no blanket exemption.

**Avoid synthetic bundles:**

```ts
expect({ status: response.status, body: response.body }).toEqual({
  status: 201,
  body: { id: 7, name: "Widget" },
})
```

A real returned object or array is a valid direct assertion target: `expect(result).toEqual({ id: 7, name: "Widget" })` and `expect(records).toEqual([{ id: 7 }])` compare actual contracts, not synthetic wrappers. An ORM assertion should compare the actual persisted record using its project-native representation; keep separate persistence effects independently visible.

Keep native promise-error assertions such as `await expect(operation()).rejects.toThrow("Not authorized")` and web-first browser assertions such as `await expect(page.getByRole("alert")).toHaveText("Saved")`. This is not a mandate to replace every matcher with `toEqual`.

Multiple direct assertions can jointly prove a coupled invariant, such as atomic rollback leaving both account balances unchanged. Do not split a coupled invariant into tests that lose its transition evidence, or combine it with unrelated outcomes.

The verifier cannot determine semantic focus or whether an object is a real result. Its `PASS` means the configured structural rules passed, not that assertions are useful. Authoring and review own that judgment; do not add a syntax-only semantic gate.

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

Automatic checks require declared `pathTriggers`. This package narrows test alignment to JavaScript and TypeScript test paths; some other checks remain manual. Current OMP Verifier releases consume matching triggers and pass only that turn's matching project-relative paths through `OMP_VERIFIER_CHANGED_PATHS`. Manual invocation uses the diff scope below. Selection and correction belong to [OMP Verifier](https://github.com/klondikemarlen/omp-verifier); the test policy belongs to this package.

## Diff Scope

Set `MARLENS_TEST_ALIGNMENT_BASE` to the PR base ref when checking committed branch changes:

```bash
MARLENS_TEST_ALIGNMENT_BASE=origin/main /verifier verify marlens-rules:test-alignment
```

With that variable, the verifier compares committed branch changes to the base and also includes current worktree and untracked tests. Without it, the verifier examines the current worktree diff against `HEAD` plus untracked tests; use it before committing local test changes.

Running `node verifications/test-alignment.mjs` directly prints the same result and exits non-zero when it reports `FAIL`, so CI can enforce the shared baseline and local additions without the agent verifier.
