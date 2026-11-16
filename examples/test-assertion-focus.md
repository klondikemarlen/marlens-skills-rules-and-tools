# Semantic Test Assertion Focus

## Task

Exercise `marlens-rules:test-assertion-focus` through the existing OMP Verifier consumer. Apply the shared exactly-one-expect non-controller default without an HTML directive, preserve the explicit controller exception and native assertion frameworks, and assess semantic quality separately from count. The [assertion-quality reference](../docs/references/test-alignment-verifier-reference.md#semantic-assertion-focus-check) owns policy; Verifier owns execution and native publication.

## Without

A structural test-alignment PASS is mistaken for proof of semantic focus. Route and dialog-visibility outcomes are bundled together, or independent assertions are hidden in helpers and Act. Counting expectations alone also misses synthetic summary objects and lost transition evidence.

## With

Use an owned disposable Git project, not an application checkout. Keep the configured models, advisor cadence and native completion behavior unchanged. Record the actual OMP, Verifier and installed MSSRT versions for each run; a later installation does not retroactively identify an earlier process's loaded runtime.

1. Install or otherwise resolve the intended released MSSRT artifact through its documented path and confirm its version separately. Start a fresh OMP process in the disposable project.
2. Run `/advisor status` and confirm the named `verifier` has a resolved model. Run `/verifier checks` and confirm `marlens-rules:test-assertion-focus` is available. These are OMP commands, not shell executables.
3. Supply complete test, subject and helper files. The [project-aware review example](project-aware-test-review.md#with) supplies representative mixed and clean assertion contracts; when converting it into native fixture files, provide the actual referenced helper implementations and imports rather than undefined functions or assertion-only echoes.
4. Give the changed test a nearest README with ordinary prose: each non-controller expect-based test has exactly one meaningful final expectation; route navigation and dialog visibility are independent outcomes; use the route's complete `fullPath`; assertions must not be hidden in helpers or Act. Preserve native matcher APIs, the controller exception, and native `node:assert` tests. Do not add a verifier directive.
5. For the negative case, make a test exercise route navigation and dialog visibility together. Include a visibility expectation in an invoked helper and return an artificial `{ fullPath, visible }` object solely for assertion bundling. Request `/verifier verify marlens-rules:test-assertion-focus`. Let the configured named advisor perform the semantic assessment; the primary must not supply its own verdict as a substitute.
6. Inspect the validated result and actual native advisor note. The finding must cite the changed test and governing README, explain the independent outcomes and hidden helper assertion, and recommend direct full-path and separate visibility tests. A generic BLOCKED, notification, or count-only criticism is not this negative proof.
7. Correct only the fixture: remove the assertion-bearing helper/bundle, split the independent outcomes, directly assert the real route `fullPath`, and assert dialog visibility separately. Request a fresh review and obtain a coordinator-validated PASS for the corrected current source.
8. In a separate test directory without a local count directive, exercise a non-controller rollback test with two direct balance expectations. Obtain a finding against the shared exactly-one rule, then split the balance observations into focused tests, retaining the complete failing transfer setup in both. Obtain a fresh clean assessment for the correction, a native promise-rejection matcher, a web-first matcher, native `node:assert` tests, and a controller test with direct meaningful status/body expectations in a conventionally classified controller path. Supply complete invoked subjects/helpers and runner/matcher contracts. Do not weaken rollback observations or introduce assertion-bearing helpers or synthetic bundles.

## Why

The declared contract adds source-backed semantic review, not another parser or runtime. The structural test-alignment check remains separate. Documentation presence, a supplied contract, a model's proposed assessment, coordinator validation, native blocker publication and installed-artifact behavior are distinct evidence.

## Check

Record evidence in the existing session or permitted release record, not a new permanent harness or application test suite:

- Capture request IDs and current source/context hashes, the actual named verifier selector, and the corresponding coordinator review/evaluate calls and results.
- Read all review pages. Honor the reporter's continuation instructions and verify complete changed tests, required guidance and material helper context arrived without byte, line or column elision. Do not confuse a transcript viewer's shortened preview with actual tool-result truncation; inspect the stored result and transport metadata.
- Confirm a validated FAIL for the mixed case, its native blocker delivery, and a fresh validated PASS after correction. Separately establish the no-local-opt-in multi-expect failure, focused rollback correction, controller exception, and native-framework/matcher cases. Preserve invalid assessments and unrelated check diagnostics separately; they are not successful target-check results.
- A later inconsistent or stale assessment does not erase a separately correlated earlier valid result. Conversely, never infer a valid verdict from a PASS/FAIL word in a prompt, draft JSON, or primary summary.
- For released-artifact QA, repeat the applicable checks against the installed release in a new process. Source-checkout proof alone is insufficient. Exercise actual command autocomplete separately when claiming it.

Missing required runtime, guidance or transport evidence is BLOCKED, not a hypothetical PASS. This fixture assesses test-authoring policy; it does not certify a real application's behavior. Remove only owned disposable files/processes after extracting useful evidence.

## Meaningful Scenarios and Independent Ownership

Use [Scenario-Oriented Verification](../docs/references/code-organization-reference.md#scenario-oriented-verification) for scenario policy and [Human Readability](../docs/references/code-organization-reference.md#human-readability) for expected-object layout. These are fictional review cases, not evidence that application tests ran.

### Rejection-Only Versus a Successful Setup Control

For a final-destination service that resolves the final arrival from an ordered itinerary, contrast these complete-file plans:

- **Rejection-only:** Missing departure rejects with `"Departure must be preloaded"`; missing arrival rejects with `"Arrival must be preloaded"`. Missing a successful setup control: both can pass when no fixture can produce a destination.
- **Token positive:** The same rejections plus a “positive” test that only asserts construction does not throw. Still missing a meaningful successful result for this subject.
- **Corrected:** Retain both regressions; independently arrange Whitehorse → Vancouver → Toronto with both relationships loaded on each leg and assert the exact final Toronto location. Success establishes usable itinerary setup; rejections protect the same subject's invalid-association contract.
- **Incomplete evidence:** A final-location assertion is shown, but invoked itinerary setup or subject code is unavailable. Report missing source/setup evidence; do not claim compliance.

Native assertions remain valid. For the corrected success, a project's existing Node test can use `assert.deepEqual(result, toronto)` on the actual returned location, retaining its relevant `assert.rejects` regressions. Do not migrate it to `expect`, replace the exact location with not-to-throw, or borrow a success from another file.

### Concrete Missing-Association Scenarios

Avoid hiding distinct omissions behind computed setup and generated expectations:

```typescript
test.each(["departure", "arrival", "traveller"])(
  "when %s is not preloaded, rejects serialization",
  (association) => {
    const travelOrderEvent = eventFactory.build()
    travelOrderEvent[association] = undefined

    expect(() => serializeEvent(travelOrderEvent)).toThrow(`${association} must be preloaded`)
  }
)
```

Prefer explicit scenario tests, even though each Act and assertion shape is the same:

```typescript
test("when departure is not preloaded, rejects serialization", () => {
  // Arrange
  const travelOrderEvent = eventFactory.withPreloadedAssociations().build()
  travelOrderEvent.departure = undefined

  // Act / Assert
  expect(() => serializeEvent(travelOrderEvent)).toThrow("Departure must be preloaded")
})

test("when arrival is not preloaded, rejects serialization", () => {
  // Arrange
  const travelOrderEvent = eventFactory.withPreloadedAssociations().build()
  travelOrderEvent.arrival = undefined

  // Act / Assert
  expect(() => serializeEvent(travelOrderEvent)).toThrow("Arrival must be preloaded")
})

test("when traveller is not preloaded, rejects serialization", () => {
  // Arrange
  const travelOrderEvent = eventFactory.withPreloadedAssociations().build()
  travelOrderEvent.traveller = undefined

  // Act / Assert
  expect(() => serializeEvent(travelOrderEvent)).toThrow("Traveller must be preloaded")
})
```

These illustrative snippets assume an existing factory trait loading all three associations and a serializer requiring them. Use the project's actual APIs and independently specified messages; do not invent this trait to bypass installed factory contracts. The complete serializer file also needs a meaningful successful serialization with literal expected fields. Three explicit rejections improve readability but do not themselves satisfy the successful-setup rule.

Homogeneous transformation input/output tables remain useful when they expose the actual cases:

```typescript
test.each([
  { input: " whitehorse ", expected: "WHITEHORSE" },
  { input: "Vancouver", expected: "VANCOUVER" },
  { input: "", expected: "" },
])("when normalizing '$input', returns '$expected'", ({ input, expected }) => {
  // Arrange
  // Each row supplies the literal input and expected output.

  // Act
  const result = normalizeCity(input)

  // Assert
  expect(result).toBe(expected)
})
```

Here the utility contract is trim-and-uppercase, with an empty-input outcome. The table makes its literal cases visible without association mutation, generated diagnostics, or workflow dispatch.

### Actual Subjects, Workflow Ownership, and Matcher Layout

- A file asserting `SummaryHeaderPanel`'s rendered result is named `SummaryHeaderPanel.test.ts`, with `describe("SummaryHeaderPanel", ...)`, not `TripDetailsDestination.test.ts` after a rendered child.
- Estimated and actual travel summaries have different reasons to change. Preserve their independently arranged scenarios instead of a component-parameterized helper that hides those workflows. Shared API interception, factories, or an actual shared contract can still be reused.
- Reject `expect.objectContaining({ id: cachedBookingEvent.id, deletedAt: null })` as compact multi-property expectation layout. Correct it without changing matching semantics:

```typescript
expect(result).toEqual(
  expect.objectContaining({
    id: cachedBookingEvent.id,
    deletedAt: null,
  })
)
```

The two fields stay independently readable even within formatter width. `expect.objectContaining({ id: record.id })` remains a permitted single-field argument.

### Fresh Read-Only Guidance Consumption

Start a fresh OMP process in an owned temporary directory, preserving configured routes, providers and credentials. Ask it to read the current canonical references and assess each contrasting case above without writing files, executing fictional tests, or delegating. Capture the process version, exact source revision, prompt, observed decisions and missing evidence. Require distinct explanations for rejection-only, corrected, utility-table, independent-workflow and matcher-layout cases; a repeated policy slogan is not contrast evidence.

This read-only exercise demonstrates guidance consumption only. It is not coordinator-validated semantic-check PASS, native blocker publication, installed-release proof, or application behavior evidence; use the earlier native Verifier procedure for those claims.
