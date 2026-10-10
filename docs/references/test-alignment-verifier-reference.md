# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against a shared baseline and optional stricter local guidance in the active repository. It reports `PASS`, `FAIL`, or `BLOCKED`; it never changes tests.

## Shared Baseline

Every changed test file must meet these rules without a README directive:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments.

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

A project that explicitly selects `one-direct-expect` may exempt a test only when multiple direct assertions jointly prove one coupled invariant. Put a reasoned comment in its body:

```ts
// marlens-test-alignment: allow-multiple-expects -- Both balances prove atomic rollback.
```

The exemption applies only to the local count rule and requires text after `--`. It does not exempt naming or other directives. Controller tests have no blanket exemption: independently meaningful status and body outcomes belong in separate focused tests.

## Assertion Quality Requires Review

Author tests around one observable outcome. Assert actual returned values, persisted records, and other native results directly with `toEqual` or the framework-native equivalent. Do not fabricate actual/expected wrapper objects merely to bundle independent outcomes or lower assertion count.

**Avoid synthetic bundles:**

```ts
expect({ status: response.status, body: response.body }).toEqual({
  status: 201,
  body: { id: 7, name: "Widget" },
})
```

**Separate independent outcomes:**

```ts
test("when creation succeeds, returns the created status", async () => {
  const response = await createWidget()
  expect(response.status).toEqual(201)
})

test("when creation succeeds, returns the created widget", async () => {
  const response = await createWidget()
  expect(response.body).toEqual({ id: 7, name: "Widget" })
})
```

These snippets isolate assertion choices; use meaningful setup and the project's full test structure when implementing them.

A real returned object or array is valid: `expect(result).toEqual({ id: 7, name: "Widget" })` and `expect(records).toEqual([{ id: 7 }])` compare actual contracts, not synthetic wrappers. An ORM assertion should compare the actual persisted record using its project-native representation, without rebuilding a bundle from unrelated records.

Keep native promise-error assertions such as `await expect(operation()).rejects.toThrow("Not authorized")` and web-first browser assertions such as `await expect(page.getByRole("alert")).toHaveText("Saved")`. This is not a mandate to replace every matcher with `toEqual`.

Multiple direct assertions can jointly prove a coupled invariant, such as atomic rollback leaving both account balances unchanged. That is not a controller-specific exception or a reason to group unrelated outcomes. Split independent outcomes; do not split a coupled invariant into tests that lose its transition evidence.

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
