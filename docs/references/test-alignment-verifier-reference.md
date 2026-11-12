# Test Alignment Verifier

`marlens-rules:test-alignment` checks changed JavaScript and TypeScript test files against a shared baseline and optional stricter local guidance in the active repository. It reports `PASS`, `FAIL`, or `BLOCKED`; it never changes tests.

## Shared Baseline

Every changed test file must meet these rules without a README directive:

- `test-name-when` — `when [condition], [behavior]` test names.
- `arrange-act-assert` — ordered `Arrange`, `Act`, and `Assert` comments; `Arrange` followed by `Act / Assert`, `Act & Assert`, or `Act and Assert` is also accepted when invoking the subject is itself the assertion, as in native promise-error or matcher tests. Preserve the existing supported spelling rather than restyling comments. Do not invent aliases or no-op steps solely to separate those phases.
- `one-direct-expect` — exactly one direct `expect(...)` call in every non-controller test, without local opt-in. Zero and multiple calls fail. Controller tests retain the exception described below; tests using native `node:assert` remain in their existing assertion framework.

Failure evidence identifies the changed test, violated rule, and `shared baseline` as its source. The count rule is a structural requirement, not proof of assertion quality.

Test callback boundaries are parsed as JavaScript or TypeScript using the packaged TypeScript dependency. Both `test(name, callback)` and Node's `test(name, options, callback)` preserve synchronous or async callback phases, including tests with `skip` options. Callback-plus-timeout forms retain their second-argument callback. Regex literals do not hide phase comments or shift reported source locations; each invocation reads the current file before checking its phases.

## Explicit Local Additions

Put supported directives in the nearest `README.md` or `README.mdx` at or above the test file:

```md
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
```

- `no-mock-calls` — no bundled `.mock.calls` assertions.
- `describe-file-class-method` — three nested `describe` scopes for file, class, and method.

The naming, Arrange/Act/Assert, and `one-direct-expect` directives remain accepted in README files, but cannot disable or replace the shared baseline. The assertion-count rule recognizes `it` and `test` callbacks, including `.each`, `.only`, `.skip`, `.concurrent`, and `.fails` variants. Asymmetric matcher factories such as `expect.objectContaining(...)` are not additional direct `expect(...)` calls. Preserve the native `node:assert`, `assert`, or `assert/strict` framework rather than migrating those tests to Jest or Vitest for this rule: a test containing native assertions and no direct `expect` is exempt from the expect count, but other native tests in the file do not exempt an expect-based or assertion-free callback.

## Assertion Quality Requires Review

The shared default is **exactly one `expect` per non-controller test**, proving one observable contract. It is not merely an at-most-one rule or a local opt-in. Independent persistence effects, saves, and other independently meaningful outcomes belong in separate focused tests. Do not hide assertions in Arrange, Act, hooks, or helpers, bundle `.mock.calls`, weaken expected payloads, or fabricate summary objects to meet the count.

Controller tests are the exception: direct meaningful status and body assertions may remain together to prove the response contract. Prefer a native or meaningful matcher such as [`toHaveHttpResponse`](http-response-matcher-reference.md) when it naturally expresses that contract, but do not force its adoption or replace clear direct controller assertions with a synthetic wrapper. The exception does not justify bundling independent persistence effects.

Controller classification uses an explicit path convention: a `controller/` or `controllers/` directory segment (case-insensitive), or a filename ending `.controller.test.<extension>`, `.controller.spec.<extension>`, `-controller.test.<extension>`, `-controller.spec.<extension>`, `_controller.test.<extension>`, `_controller.spec.<extension>`, `Controller.test.<extension>`, or `Controller.spec.<extension>` with the PascalCase `Controller` suffix. Extensions are the check's supported JavaScript/TypeScript extensions. HTTP usage or a variable named `response` does not classify a test as a controller.

An inline `allow-multiple-expects` directive is not a supported bypass. Do not add equivalent rationale prose or broaden a suppression to evade this policy. Preserve supported, explicitly scoped legacy suppressions and report any genuine conflicting project-local standard truthfully.

**Avoid synthetic bundles:**

```ts
expect({ status: response.status, body: response.body }).toEqual({
  status: 201,
  body: { id: 7, name: "Widget" },
})
```

A real returned object or array is a valid direct assertion target: `expect(result).toEqual({ id: 7, name: "Widget" })` and `expect(records).toEqual([{ id: 7 }])` compare actual contracts, not synthetic wrappers. An ORM assertion should compare the actual persisted record using its project-native representation; keep separate persistence effects independently visible.

When the full expected collection is known, compare the complete returned collection directly rather than wrapping its expected members in `expect.arrayContaining`. Adding `toHaveLength(...)` to the subset assertion is not the preferred replacement: express the complete-result contract in the collection expectation itself. Partial object matchers may still appear inside that complete expected array when incidental record fields are outside the contract:

```typescript
expect(hits).toEqual([expect.objectContaining({ id: 7 }), expect.objectContaining({ id: 9 })])
```

For an established `7`-then-`9` result order, this accepts additional fields on those two records but rejects an unexpected third element, a missing record, or a different member without a separate count assertion. Use the actual result path and supported project matchers. If order is not guaranteed, preserve the real unordered contract with a supported exact unordered collection matcher; do not add sorting solely to normalize assertions. See [Scenario-Oriented Verification](code-organization-reference.md#scenario-oriented-verification).

Reserve subset matching for a contract that genuinely permits additional elements. Unspecified ordering alone is not that permission. A reviewer should distinguish complete-result membership/cardinality from partial record-field matching, preserve legitimate subset contracts, and avoid exact matching of unrelated object fields.

Keep native promise-error assertions such as `await expect(operation()).rejects.toThrow("Not authorized")` and web-first browser assertions such as `await expect(page.getByRole("alert")).toHaveText("Saved")`. This is not a mandate to replace every matcher with `toEqual`.

For synchronous exceptions and promise rejections, prefer an independently specified string or regex message matcher over arranged error-object identity or `arrangedError.message`. With Vitest, these are separate scenario assertions:

```typescript
expect(() => parseRecord(invalidInput)).toThrow("Invalid record")
```

```typescript
await expect(refresh).rejects.toThrow(/Unavailable/)
```

Here `refresh` is the promise returned by the operation under test. Both matchers prove failure as well as the expected message; do not replace them with an unguarded `catch` assertion that passes when nothing throws. Use the active framework's supported equivalent, retaining native `node:assert` rather than migrating it. Preserve additional error-contract checks where required and ordinary identity assertions for non-error contracts. This is authoring/review guidance, not a new automatic syntax check.

Preserve transition, race, and rollback setup and scenario identities when reorganizing tests. A coupled invariant is not a general multi-expect exception for non-controller tests. Keep the complete causal sequence in each focused scenario that needs it; assert a real returned or persisted object/collection when it naturally represents the invariant, or use separate tests for distinct observations. Never discard an intervening failure, stale completion, or rollback operation merely to reach one expectation.

### Independent Saves With Concrete Payloads

Before: two independently meaningful saves share one test, and wildcard payloads do not prove either request:

```ts
test("when the worksheet is edited twice, saves both edits", async () => {
  // Arrange
  const patchSpy = vi.spyOn(worksheetApi, "patch").mockResolvedValue(savedWorksheet)
  const page = await mountWorksheetPage()

  // Act
  await page.save({ hours: 4 })
  await page.save({ hours: 6 })

  // Assert
  expect(patchSpy).toHaveBeenCalledTimes(2)
  expect(patchSpy).toHaveBeenNthCalledWith(1, 7, expect.anything())
  expect(patchSpy).toHaveBeenNthCalledWith(2, 7, expect.anything())
})
```

After: each save has its own API-spy expectation with the concrete request contract. The second test retains the earlier save because it establishes the transition being exercised:

```ts
test("when worksheet hours are first edited, saves the first edit", async () => {
  // Arrange
  const patchSpy = vi.spyOn(worksheetApi, "patch").mockResolvedValue(savedWorksheet)
  const page = await mountWorksheetPage()

  // Act
  await page.save({ hours: 4 })

  // Assert
  expect(patchSpy).toHaveBeenCalledExactlyOnceWith(7, { hours: 4 })
})

test("when saved worksheet hours are edited again, saves the new edit", async () => {
  // Arrange
  const patchSpy = vi.spyOn(worksheetApi, "patch").mockResolvedValue(savedWorksheet)
  const page = await mountWorksheetPage()
  await page.save({ hours: 4 })
  patchSpy.mockClear()

  // Act
  await page.save({ hours: 6 })

  // Assert
  expect(patchSpy).toHaveBeenCalledExactlyOnceWith(7, { hours: 6 })
})
```

Use the actual API signature, full relevant payload, and supported runner-native matcher; the example uses Vitest's exact-once matcher. Spy cleanup follows the project's existing isolation setup. Do not replace the concrete payload with `expect.anything()`, a projected call array, or a helper that performs assertions. A scenario-specific earlier operation may establish a transition in Arrange; an assertion may not.

The structural verifier cannot determine semantic focus or whether an object is a real result. Its `PASS` means the configured syntax rules passed, not that assertions are useful. `marlens-rules:test-assertion-focus` is a separate declared agentic review of the same changed-test paths against this guidance and applicable ordinary-language local standards; it uses the existing OMP Verifier consumer and semantic contract, not a syntax-only semantic gate.

For placement of persistence-observation queries beside Assert expectations, follow [Scenario-Oriented Verification](code-organization-reference.md#scenario-oriented-verification). This is authoring guidance, not another structural verifier rule.

## Semantic Assertion-Focus Check

`marlens-rules:test-assertion-focus` reviews the complete changed test files against this shared assertion-quality guidance and applicable ordinary-language local test standards. Its automatic path triggers match `test-alignment`, but the checks answer different questions: test-alignment evaluates deterministic naming, phase, shared exactly-one-expect, and explicit local structural additions; assertion-focus assesses whether assertions prove the intended contract without evasion or lost scenario coverage.

The review must cite the changed test and any governing local guidance. Enforce the shared exactly-one rule for non-controller tests and preserve the explicit controller exception; do not invent a general coupled-invariant exemption. Preserve native promise-error and web-first matchers, real-result object/array comparisons, and native `node:assert` tests. Inspect needed invoked helpers and relevant scenario context for hidden assertions, weakened payloads, bundled calls, and lost transition/race/rollback evidence. A structural `PASS` does not establish semantic quality. When the changed scope, applicable required guidance, or subject/helper context needed to judge a finding is unavailable, report `BLOCKED` with the missing evidence rather than guessing. Unnecessary caller or sibling context is not a prerequisite.

Invoke the check through the supported OMP Verifier interface, for example `/verifier verify marlens-rules:test-assertion-focus`; the installed Verifier's existing semantic review flow captures scope and required context. This declaration adds no executable, natural-language parser, directive, dependency, or advisor. See [Agentic Semantic Verification](rules-and-verifications-reference.md#agentic-semantic-verification) for the shared contract ownership and protocol boundary.

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
