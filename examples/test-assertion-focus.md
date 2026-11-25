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

### Acceptance Is Sometimes the Whole Contract

Suppose `validateQuantity` accepts a positive quantity or rejects with a `RangeError`, and promises no return value. These tests protect the same decision:

```javascript
test("accepts a positive quantity", async () => {
  await assert.doesNotReject(() => validateQuantity(1))
})

test("rejects zero", async () => {
  await assert.rejects(() => validateQuantity(0), {
    name: "RangeError",
    message: "Quantity must be positive",
  })
})
```

Returning the input instead of `undefined` should not break the acceptance test; silently accepting zero should break the rejection test. By contrast, an operation that *saves* the quantity does promise an effect: completion without persistence is a failure, not a passing positive case.

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

### Flag-Selected Business Workflows

Reject this matrix: the flag changes the business state and accepted payload, not merely an input to one homogeneous transformation.

```typescript
test.each([false, true])("updates travel when isActual=%s", async (isActual) => {
  // Arrange
  const travelAuthorization = await travelAuthorizationFactory.create({
    status: isActual ? "APPROVED" : "DRAFT",
  })
  const attributes = isActual
    ? { travelSegmentActualsAttributes: [{ arrivalLocationId: 9 }] }
    : { travelSegmentEstimatesAttributes: [{ arrivalLocationId: 9 }] }

  // Act
  const result = await updateTravel(travelAuthorization, attributes)

  // Assert
  expect(isActual ? result.travelSegmentActuals : result.travelSegmentEstimates).toEqual([
    expect.objectContaining({
      arrivalLocationId: 9,
    }),
  ])
})
```

Prefer two explicit scenarios with the same observations:

```typescript
test("when a draft itinerary is edited, updates its estimated destination", async () => {
  // Arrange
  const travelAuthorization = await travelAuthorizationFactory.create({
    status: "DRAFT",
  })
  const attributes = {
    travelSegmentEstimatesAttributes: [
      {
        arrivalLocationId: 9,
      },
    ],
  }

  // Act
  const result = await updateTravel(travelAuthorization, attributes)

  // Assert
  expect(result.travelSegmentEstimates).toEqual([
    expect.objectContaining({
      arrivalLocationId: 9,
    }),
  ])
})

test("when an approved itinerary is edited, updates its actual destination", async () => {
  // Arrange
  const travelAuthorization = await travelAuthorizationFactory.create({
    status: "APPROVED",
  })
  const attributes = {
    travelSegmentActualsAttributes: [
      {
        arrivalLocationId: 9,
      },
    ],
  }

  // Act
  const result = await updateTravel(travelAuthorization, attributes)

  // Assert
  expect(result.travelSegmentActuals).toEqual([
    expect.objectContaining({
      arrivalLocationId: 9,
    }),
  ])
})
```

These fictional excerpts assume an existing authorized factory, a valid location `9`, and an `updateTravel` operation returning preloaded segments. A real suite must arrange those prerequisites locally using its supported factories and retain its invalid-state/authorization regressions; do not claim these excerpts form a complete executable suite. Intentional repetition exposes workflow ownership. An equivalent helper receiving `isActual` would preserve the original problem. The homogeneous normalization table above remains accepted.

Expected semantic decisions: FAIL the flag-selected workflow matrix, PASS the two explicit scenarios for workflow ownership and assertion shape, and PASS the homogeneous transformation table. Assess complete-file success/negative coverage separately. Inline partial matchers in the expected arrays are permitted; do not introduce one-use matcher aliases solely to satisfy the construction default.

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

The two fields stay independently readable even within formatter width. Expand single-property expected objects such as `expect.objectContaining({ id: record.id })` too; assertion data is not covered by the small ordinary-call-argument exception.

### CLI Scenario Ownership and Shared Mechanics

Apply the [CLI goal and bounded caveat](../docs/references/test-alignment-verifier-reference.md#cli-scenario-ownership-and-shared-mechanics). These are evaluation fixtures, not executed evidence or a request to introduce another permanent harness.

The [pinned Verifier preparation suite](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/test/semantic-preparation-cli.test.js) provides the concrete contrast: `preparationFixture` accepts `checkIds`, `includeBlockedCheck`, `pagedReview`, `policySource`, `changedPolicySource`, and `deletedSource`; it also commits the baseline, edits paging inputs, and deletes `obsolete.js`. Even its default invocation creates a deletion. This is a scenario-ownership concern, not a finding based on file length or multiple native assertions. Its temporary-root cleanup, isolated agent directory, subprocess runners, page parser, and assessment transport are useful mechanics. Retain the skipped-page recovery, renewal/old-receipt rejection, retained-selector error/recovery, and exact-retry observations rather than treating their sequential commands as unrelated tests.

**Negative fixture:** A fictional caller using the real builder's controls, `await preparationFixture(t, { pagedReview: true, includeBlockedCheck: true })`, silently chooses both a large-context Git transition and a final blocked provider. Moving that same dispatch into `withScenario("paged-and-blocked")` does not fix it. A reviewer needs the actual builder and commands before deciding which scenario choices to expose.

**Corrected ownership fixture:** This standalone native-test example makes a historical deletion's baseline and change visible. Its local `git` function only executes the named command; the real CLI, not a copied preparation algorithm, produces the review. Run it only in the compatible consumer checkout with its dependencies available; adapt the CLI path if its public entry changes.

```javascript
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const CLI = join(process.cwd(), "bin", "omp-verifier.js");

test("when tracked source is deleted, preparation retains its historical content", async t => {
  // Arrange
  const root = await mkdtemp(join(tmpdir(), "verifier-deletion-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const packageDirectory = join(root, "plugins", "node_modules");
  const provider = join(packageDirectory, "publisher");
  await mkdir(provider, { recursive: true });
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "obsolete.js"), "export const obsolete = true;\n");
  await writeFile(join(provider, "standard.md"), "Review the changed source, including deletions.\n");
  await writeFile(join(provider, "alignment.json"), JSON.stringify({
    version: 1,
    standardId: "publisher:alignment",
    source: "./standard.md",
    gold: "Changed source remains available for review.",
    requiredContext: ["changed-code"],
    rubric: [
      {
        id: "source",
        question: "Is the changed source available for review?",
      },
    ],
  }));
  await writeFile(join(provider, "package.json"), JSON.stringify({
    name: "publisher",
    version: "1.0.0",
    omp: {
      extensions: ["./index.js"],
      verifications: [
        {
          id: "publisher:alignment",
          label: "Source Review",
          description: "Reviews changed source.",
          mode: "agentic",
          contract: "./alignment.json",
          pathTriggers: ["src/*.js"],
        },
      ],
    },
  }));
  const git = args => execFileSync("git", args, { cwd: root });
  git(["init", "--quiet"]);
  git(["add", "."]);
  git(["-c", "user.name=Verifier Tests", "-c", "user.email=test@example.com",
    "commit", "--quiet", "-m", "baseline"]);
  await rm(join(root, "src", "obsolete.js"));

  // Act
  const prepared = spawnSync(process.execPath, [CLI, "automatic", "src/obsolete.js"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PI_CODING_AGENT_DIR: join(root, "agent"),
      OMP_VERIFIER_PACKAGE_DIRECTORY: packageDirectory,
    },
  });

  // Assert
  assert.equal(prepared.status, 0, prepared.stderr);
  const results = JSON.parse(prepared.stdout);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "publisher:alignment");
  assert.equal(results[0].status, "PENDING");
  assert.deepEqual(results[0].reviewRequest.scope.changedPaths, ["src/obsolete.js"]);
  const deletion = results[0].reviewRequest.context.changedCode.find(
    record => record.path === "src/obsolete.js",
  );
  assert.ok(deletion, "The review must contain the deleted source.");
  assert.equal(deletion.state, "deleted");
  assert.equal(deletion.content, "export const obsolete = true;\n");
});
```

These assertions would establish a plausible preparation-consumer outcome: the only selected review contains the actual deleted file's historical source, rather than merely exiting successfully. This unexecuted example does not prove semantic acceptance or constitute a complete suite; retain relevant rejection/recovery scenarios in the complete changed file. The explicit package-directory override prevents inherited provider-discovery configuration from selecting an unrelated installation. Shared support may own these mechanical operations without choosing source, provider contract, commit timing, deletion, or expectations for the caller.

Proposed contrasting review cases:

1. **FAIL ownership:** Supply the complete multi-mode builder and tests above; require a finding naming hidden baseline/changes/provider choices and a correction exposing them. Do not cite the number of `assert` calls as a violation.
2. **Accept ownership:** Supply the corrected fixture and the consumer boundaries; accept its visible baseline/deletion and direct native observations. Assess full-file successful/negative coverage separately, not by pretending this excerpt alone is a complete suite.
3. **Accept bounded reuse:** Replace repeated directory/runner/cleanup mechanics with inspected support retaining per-test paths and environment; keep source, provider declarations, commit/deletion timing and assertions local. Accept a literal malformed-cap table such as `["15999", "32768.5"]` under the real CLI parser contract.
4. **Preserve lifecycle evidence:** Keep preparation, skipped/final page reads, pending evaluation, delivery of missing pages, completion and exact retry in the scenario that protects that sequence. Keep an invalid retained-selector observation before correction and the subsequent usable-request observation. Reject “cleanup” that removes the failure, collapses observations into `{ pending, completed }`, or moves assertions into helpers.
5. **Reject fragmentation or discovery loss:** Moving files under `test/semantic-preparation/` is not automatically valid: the pinned consumer's [test script](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/package.json) is `node --test test/*.test.js`, not recursive discovery. Prefer cohesive independently owned CLI suites discoverable by the existing command; do not mandate a new runner, file-per-assert layout, or arbitrary size threshold.
6. **BLOCKED evidence:** Omit the invoked builder, applicable local guidance, or necessary CLI/provider contract; report the specific missing prerequisite. A native-framework exception, structural PASS, or invented successful output cannot establish scenario quality.

### Fresh Read-Only Guidance Consumption

Start a fresh OMP process in an owned temporary directory, preserving configured routes, providers and credentials. Ask it to read the current canonical references and assess each contrasting case above without writing files, executing fictional tests, or delegating. Capture the process version, exact source revision, prompt, observed decisions and missing evidence. Require distinct explanations for rejection-only, corrected, utility-table, independent-workflow and matcher-layout cases; a repeated policy slogan is not contrast evidence.

This read-only exercise demonstrates guidance consumption only. It is not coordinator-validated semantic-check PASS, native blocker publication, installed-release proof, or application behavior evidence; use the earlier native Verifier procedure for those claims.

## Reviewing a Changed Provider Criterion

Run this check on the provider PR when an assertion rubric question or its governing passage changes. It tests whether the shipped evidence is sufficient, not whether the consumer tests execute. Select the affected criterion; do not replay the catalog or add a model call to ordinary consumer PRs.

1. Run the existing package parity check. Use Verifier's contract loader on the packed candidate: keep the selected rubric question and the text actually captured from its declared source fragment. Do not substitute the authoring manual. Record the provider revision, criterion ID, and contract/source hashes.
2. Pair those inputs with the complete changed consumer test, the exercised subject and material setup or exports, and the local policy that actually governs this fixture. Use separate, neutrally labeled packets. Give a fresh reviewer only one packet at a time, without checkout access, tools, earlier answers, expected verdicts, or this example page. Ask for the governing evidence, decision, and smallest correction or specific missing information.
3. Review a compliant case and a one-change violation. Repeat a compliant case using equivalent local wording or renamed symbols. In separate copies withhold (a) the material provider rule, including equivalent wording in the question, examples, and captured source, and (b) a material consumer input. Leave the other side intact. Also omit one genuinely irrelevant input. Removing a paragraph while leaving the answer elsewhere is not a missing-rule control.
4. Compare results **after** review. The complete pair must distinguish compliant behavior from a concrete violation, not just quote the rubric. Equivalent wording must preserve the decision. Missing policy on the provider side must identify that gap, not accuse the consumer; missing material consumer evidence must identify the particular input needed. Neither warrants a guess. Omitting irrelevant evidence must not block the decision. Record observed decisions and citations with the revision in the provider PR; a failed control requires fixing the evidence or fixture before claiming coverage. This supplements, not replaces, required CI and named reviews.

Use the same neutral prompt for every variant:

> Decide only the specified review question. Quote the supplied rule that establishes what is required for that decision, then cite the consumer evidence that satisfies or violates it. Do not infer a requirement from the criterion name, another criterion, or familiarity with good tests. If either premise is unavailable, report BLOCKED and identify the missing evidence and which side must supply it. Otherwise report PASS or FAIL, with a concrete correction for a violation.

- `meaningful-scenarios-and-subject-ownership`: Use the acceptance-only validator from [Acceptance Is Sometimes the Whole Contract](#acceptance-is-sometimes-the-whole-contract). Show the validator and both tests; contrast removing the successful call while retaining the rejection. Rename the validator and express acceptance in domain language. For the provider control remove the rules for meaningful success, negative coverage and the acceptance-only exception wherever supplied. For the consumer control omit the subject contract when completion versus an additional promised effect changes whether the assertion is adequate. Import-order policy is irrelevant here.
- `actual-subject-import-and-placement`: Use the direct subject from [Default-Exported Subject](#default-exported-subject), with its supported export and the actual fixture import groups. Reverse only the subject and fixture groups; retain the same Act and assertions. Contrast a real fixture-local override phrased in different words. Remove the provider's placement and precedence rules for the missing-rule control. Separately omit a referenced local ordering policy whose contents could reverse the decision. An unrelated serializer convention is not required.

## Controller Query Transport and Import Review

### Structured Query Handoff

This excerpt assumes the target project's existing authenticated `request()` support, invoice factories, installed `qs`, and an endpoint returning exactly the shown invoice projection. Adapt those existing contracts, not the server parser, to the actual project:

```typescript
// Arrange: insertion order deliberately differs from requested order.
const invoiceB = await invoiceFactory.create({ invoiceNumber: "B" })
await invoiceFactory.create({ invoiceNumber: "AA" })
const invoiceA = await invoiceFactory.create({ invoiceNumber: "A" })
const query = {
  where: { id: [invoiceB.id, invoiceA.id] },
  order: [["invoiceNumber", "ASC"]],
}

// Act: retain this handoff when the installed client flattens nested arrays.
const response = await request().get("/api/invoices").query(qs.stringify(query))

// Assert: this real HTTP result proves both ordering and distractor exclusion.
expect(response.status).toBe(200)
expect(response.body).toEqual({
  invoices: [
    {
      id: invoiceA.id,
      invoiceNumber: "A",
    },
    {
      id: invoiceB.id,
      invoiceNumber: "B",
    },
  ],
  totalCount: 2,
})
```

The excluded invoice sorts between the selected records; omitting the filter adds an unwanted row. Reversing or dropping ordering changes the literal response. The example is a consumer shape, not an observed run or universal response schema.

When the installed client preserves this same nested query, prefer `.query(query)` directly and remove unused serialization imports/temporaries. A direct object such as `.query({ format: "csv", where: { id: [record.id] }, order: [["id", "DESC"]] })` is preferred only after proving its transport equivalence. Some Superagent versions use `indices: false`; do not replace the existing `qs.stringify` form when that flattens nested arrays.

### Default-Exported Subject

For a test actually exercising the default-exported `CreateCsvService`, this is incorrect:

```typescript
import { CreateCsvService } from "@/services/downloads/travel-authorization-pre-approvals"
import { travelAuthorizationFactory } from "@/tests/factories"
```

The supported correction keeps support first and isolates the actual subject:

```typescript
import { travelAuthorizationFactory } from "@/tests/factories"

import CreateCsvService from "@/services/downloads/travel-authorization-pre-approvals/create-csv-service"
```

Confirm that module's default export and supported path. Supporting named dependencies stay named; named-only subjects do not acquire a default export for style. Explicit local import conventions win, and mixed-subject tests need actual evidence before identifying one primary subject.

### Disposable Semantic and Transport Scenarios

Use the existing `marlens-rules:test-assertion-focus` final-review contract with complete changed tests, applicable shared/local guidance, subject exports, routing, and resolved client/parser evidence. These are expected QA outcomes, not claimed results:

1. Supply a namespaced controller class scope and route-only scope; expect `FAIL` naming the bare-class and exact `#create - POST - /api/...` corrections. Correct all equivalent suites in the authorized scope, retaining outer paths, and expect a fresh assessment to accept them. Independently omit the second separator or mismatch the real action/verb/route; each remains a finding. Functional-handler and service subjects must not acquire fabricated controller names.
2. In a disposable consumer using the actual installed client, existing server parser/options, and real endpoint, send the same nested filters and two-column ordering through native `.query(query)` and existing `qs.stringify(query)`. Assert exact HTTP bodies with selected rows, a filter distractor, reversed insertion order, and tied primary-sort values requiring the secondary clause. Compare observed results, preserving escaping and array element types under the API's actual parser contract.
3. Where native serialization flattens nested arrays, expect semantic `FAIL` for a blind native migration and acceptance of existing `qs` handoff with nested scenario data. Where equivalent, expect native-object preference and a finding for unnecessary manual serialization. Keep raw malformed-wire and intentional encoding-contract tests as valid contrasts; neither requires migration or a new dependency.
4. Supply the named subject import above with confirmed default export and no local override; expect a finding citing that exact import and default/group correction. Separate probes isolate default-versus-named spelling from wrong placement. The corrected default after factories must pass this rubric.
5. Independently supply supporting named imports, a named-only actual subject, an explicit local grouping override, and a genuinely mixed-subject test without primary-subject evidence; expect no invented import findings. Include an unrelated unchanged test outside authorized scope; it must not become a finding.
6. Omit necessary export, routing, local guidance, or serialization evidence in separate assessments; expect `BLOCKED` naming the missing prerequisite. Restore it and reassess current code; a prior result, structural pass, or status-only HTTP test cannot establish semantic clearance.

Run the disposable consumer's documented focused test and test TypeScript command separately, then discard it. Record resolved versions, native-versus-serialized request evidence, final-review selection, and actual decisions. Do not claim proposed scenario outcomes as observed PASS.

## Local Dependency Groups Without a Subject Import

The [TravelAuth correction](https://github.com/icefoganalytics/travel-authorization/commit/6f64b921c1db24b7a7703e24bcc6e16883f04012) separated models from factories and put factories next to request support. This runnable fixture reproduces that grouping change without the application or its database. The request helper dispatches a real `Request` through the router; the test never imports the controller.

Create an owned temporary Git project with Node.js 22 or later. Commit the supporting files as the baseline so the only changed test is the file added below. Run these commands in Bash; keep the shell open to reuse `fixture` and `test_path`.

```bash
fixture=$(mktemp -d)
git -C "$fixture" init -q
mkdir -p "$fixture/src/controllers" "$fixture/tests/controllers"
test_path=tests/controllers/travel-requests-controller.test.mjs

cat > "$fixture/package.json" <<'JSON'
{
  "name": "travel-request-review-fixture",
  "private": true,
  "imports": {
    "#models": "./src/models.mjs",
    "#factories": "./tests/factories.mjs",
    "#support": "./tests/support.mjs"
  }
}
JSON

cat > "$fixture/tests/README.md" <<'MARKDOWN'
# Test Conventions

Keep Node.js built-in imports in their own group. Keep domain model imports in a
separate group above test dependencies. Group factories and request support
together without a blank line.
MARKDOWN

cat > "$fixture/src/models.mjs" <<'JS'
export class TravelRequest {
  static statuses = {
    pending: "pending",
  }

  constructor(status) {
    this.status = status
  }
}
JS

cat > "$fixture/src/controllers/travel-requests-controller.mjs" <<'JS'
export default class TravelRequestsController {
  static show(travelRequest) {
    if (!travelRequest) {
      return Response.json({ error: "Request not found" }, { status: 404 })
    }

    return Response.json({ status: travelRequest.status })
  }
}
JS

cat > "$fixture/src/router.mjs" <<'JS'
import TravelRequestsController from "./controllers/travel-requests-controller.mjs"

export function dispatch(request, travelRequests) {
  const { pathname } = new URL(request.url)
  const match = /^\/api\/travel-requests\/([^/]+)$/.exec(pathname)
  if (request.method !== "GET" || !match) {
    return new Response(null, { status: 404 })
  }

  return TravelRequestsController.show(travelRequests.get(match[1]))
}
JS

cat > "$fixture/tests/factories.mjs" <<'JS'
import { TravelRequest } from "#models"

export function buildTravelRequest(status) {
  return new TravelRequest(status)
}
JS

cat > "$fixture/tests/support.mjs" <<'JS'
import { dispatch } from "../src/router.mjs"

export function request(travelRequests) {
  return {
    get(path) {
      return dispatch(new Request(new URL(path, "http://fixture.test")), travelRequests)
    },
  }
}
JS

git -C "$fixture" add package.json src tests
git -C "$fixture" -c user.name=Fixture -c user.email=fixture@example.test \
  -c commit.gpgsign=false commit -qm "Add fixture context"

cat > "$fixture/$test_path" <<'JS'
import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { TravelRequest } from "#models"
import { buildTravelRequest } from "#factories"

import { request } from "#support"

describe("src/controllers/travel-requests-controller.mjs", () => {
  describe("TravelRequestsController", () => {
    describe("#show - GET - /api/travel-requests/:id", () => {
      test("when the request exists, it returns the pending status", async () => {
        // Arrange
        const travelRequest = buildTravelRequest(TravelRequest.statuses.pending)
        const travelRequests = new Map([["7", travelRequest]])

        // Act
        const response = request(travelRequests).get("/api/travel-requests/7")

        // Assert
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
          status: "pending",
        })
      })

      test("when the request does not exist, it returns not found", async () => {
        // Arrange
        const travelRequest = buildTravelRequest(TravelRequest.statuses.pending)
        const travelRequests = new Map([["7", travelRequest]])

        // Act
        const response = request(travelRequests).get("/api/travel-requests/8")

        // Assert
        assert.equal(response.status, 404)
        assert.deepEqual(await response.json(), {
          error: "Request not found",
        })
      })
    })
  })
})
JS

git -C "$fixture" add "$test_path"
node --test "$fixture/$test_path"
```

Review the complete fixture with `/verifier verify marlens-rules:test-assertion-focus` in a fresh OMP process rooted at `$fixture`. Use the [evidence procedure](#check), supplying `tests/README.md`, `package.json`, the router/controller, and the invoked factory/support modules as real source context if request preparation does not include them. Keep the following expected results out of the assessment input:

1. **Negative:** With the files as written, require a validated `FAIL` citing the model/factory grouping and the separation between factories and request support, with `tests/README.md` as authority. No controller import should be requested.
2. **Positive:** Replace only the three application imports with the header below. Require a fresh `PASS`. To check the two failure modes independently, restore each offending blank-line arrangement on its own under the same policy.
3. **Neutral:** Restore the original failing header and replace the local README's grouping guidance with `Keep Node.js built-in imports in their own group. Use the native assertion framework.` Keep the package name, aliases, router, and test cases unchanged. Require a fresh `PASS`: the project still supplied guidance, but it did not require the model/factory separation or the factory/support pairing. For an explicit alternative local policy, require that the factory stay beside the model and that request support be separate; the original header must likewise pass under that policy.

```js
import { TravelRequest } from "#models"

import { buildTravelRequest } from "#factories"
import { request } from "#support"
```

The Node.js tests should pass in every case; only semantic review should distinguish the headers. Record a fresh result for each case and keep the [direct-subject scenarios](#disposable-semantic-and-transport-scenarios) as separate regression coverage.
