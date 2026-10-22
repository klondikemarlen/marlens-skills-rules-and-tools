# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against a shared baseline and optional stricter local guidance in the active repository. It reports `PASS`, `FAIL`, or `BLOCKED`; it never changes tests.

## Shared Baseline

Every changed test file must meet these rules without a README directive:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments; `Arrange` followed by `Act / Assert` is also accepted when invoking the subject is itself the assertion, as in matcher tests. Do not invent aliases or no-op steps solely to separate those phases.

Failure evidence identifies the changed test, violated rule, and `shared baseline` as its source. Assertion count is not a shared quality gate.

Test callback boundaries are parsed as JavaScript or TypeScript using the packaged TypeScript dependency. Both `test(name, callback)` and Node's `test(name, options, callback)` preserve synchronous or async callback phases, including tests with `skip` options. Callback-plus-timeout forms retain their second-argument callback. Regex literals do not hide phase comments or shift reported source locations; each invocation reads the current file before checking its phases.

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

For placement of persistence-observation queries beside Assert expectations, follow [Scenario-Oriented Verification](code-organization-reference.md#scenario-oriented-verification). This is authoring guidance, not another structural verifier rule.

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

Before merge, select the actual PR base ref and check the current PR scope. The check assesses every test in each selected changed file, including legacy callbacks outside the edited lines. Record its `PASS`, `FAIL`, or `BLOCKED` result in the project's existing permitted evidence location. Behavioral-suite success does not prove this structural contract; anticipated final-yield advice is not a completed check.

In an OMP session launched with `MARLENS_TEST_ALIGNMENT_BASE` set to that base ref, invoke `/verifier verify marlens-rules:test-alignment`. Alternatively, locate the declared check entry in the installed provider and run it from the active project in a terminal:

```bash
env -u OMP_VERIFIER_CHANGED_PATHS \
  MARLENS_TEST_ALIGNMENT_BASE="<actual PR base ref>" \
  node "<installed provider root>/verifications/test-alignment.mjs"
```

Do not run the slash command as a shell executable. Clearing `OMP_VERIFIER_CHANGED_PATHS` avoids a stale automatic per-turn selection overriding the manual PR scope. `MARLENS_TEST_ALIGNMENT_BASE` compares committed branch changes to the base and also includes current worktree and untracked tests. Without it, the check examines only the current worktree diff against `HEAD` plus untracked tests, so a clean committed branch can miss its PR changes.

The standalone entry prints the same structured result and uses a fail-closed shell contract: `PASS` exits zero; `FAIL` and `BLOCKED` exit nonzero. Its JSON output retains the actual status, evidence, and next check; callers must not reinterpret `BLOCKED` as a structural failure or pass. An unavailable base therefore stops a shell `&&` continuation while preserving its prerequisite evidence. No installed coordinator is needed for this standalone path. Preserve explicit local additions and supported scoped suppressions. If the relevant check or base ref is unavailable, record `BLOCKED` with the exact prerequisite rather than claiming a structural PASS. No matching changed tests means `N/A` for this gate. This is focused pre-merge evidence, not a new runtime completion barrier, advisor cadence, model route, or unrelated hygiene scan.

Coordinator integration needs support for nonzero structured `BLOCKED` results, introduced in OMP Verifier 0.10.9. Upgrade older coordinators before relying on the preserved prerequisite fields.

From a source checkout, exercise an installed or unpacked package's standalone CLI by pointing the repository's focused behavioral check at that entrypoint. The maintainer check lives in `scripts/`, which is not part of the installed package:

```bash
MARLENS_TEST_ALIGNMENT_ENTRY="<installed provider root>/verifications/test-alignment.mjs" \
  node scripts/verify-test-alignment.mjs
```

For coordinator integration, start a fresh OMP process in a disposable Git project and run `/verifier verify marlens-rules:test-alignment` with `MARLENS_TEST_ALIGNMENT_BASE` set to a nonexistent ref. Confirm the result remains structured `BLOCKED` with its missing-base evidence. Repeat once with a test containing a real structural violation (`FAIL`), then correct the test and request a fresh evaluation (`PASS`). The standalone CLI contract also requires checking that a shell `&&` continuation is skipped for the missing-base case; the behavioral check above covers this using the installed CLI path when configured. The coordinator must preserve a valid structured `BLOCKED` output even though its process exit is nonzero; a generic process-exit diagnostic is not equivalent evidence.
