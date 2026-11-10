# Project-Aware Test Review

## Task

Exercise the supported OMP code-review consumer against complete changed tests, their nearest local test conventions, and a compliant sibling. This is semantic review QA, not execution of the fictional application tests.

## Without

A structural test-alignment PASS does not establish that recipients are asserted, independent effects are separated, or expectations hidden in helpers and Act have been reviewed. Existing shared guidance already expresses these contracts; a wording-only assertion would not prove consumer behavior.

## With

### Test Selection

Choose permanent tests for the uncovered behavior or invariant and the risk they reduce, not for a one-file/one-suite layout. For a small pure utility, a cheap exhaustive input/output table with literal expected values is useful; avoid adding framework or infrastructure setup to the algorithm. For cross-module workflows, prefer representative consumer-facing feature/boundary scenarios over forwarding tests in every file or mocks that merely echo the same result. Retain lower-level coverage when it protects a distinct uncovered authorization, concurrency, security, data-integrity, compatibility, or error invariant. Check existing consumer coverage and compare setup, runtime, and maintenance cost before adding or consolidating tests; do not remove meaningful coverage without evidence that the remaining checks still protect its risk.

Review these proposed additions as well as the changed test below. Recommend keep, consolidate, or remove, naming the distinct risk and the least costly owning test boundary.

| Proposed Coverage                                              | Existing Protection                                                                 | Execution Cost                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Exhaustive literal cases for a small pure allocation utility.  | No equivalent algorithm-boundary table.                                             | In-memory, bounded input table; no services.         |
| Three helper suites whose mocks echo the same checkout result. | A feature test already exercises the real helpers and verifies the completed order. | Each helper suite starts a database and queue.       |
| A cross-organization authorization rejection.                  | The feature suite exercises only an allowed same-organization checkout.             | Focused policy/boundary check.                       |
| A regression for concurrent reservations exceeding stock.      | Existing checkout scenarios run serially.                                           | Real transactional integration; a demonstrated race. |

This is bounded read-only release QA for the supplied fictional application, not implementation. Invoke the installed code-review skill and use the current checkout's code-review workflow. Review ONLY the proposed test additions above and the complete supplied fictional changed test, nearest test README, service contract, and compliant sibling. No repository/GitHub writes, test execution, browser interaction, memory writes, delegation, model changes, or release workflow. Do not inspect unrelated project files. Findings must identify the test/location, independent outcome or unproven behavior, and a concrete correction. Identify clean cases without inventing findings. Numeric expectation counts alone are not a semantic review. Source line numbers are the lines inside each named code block.

### Nearest applicable test README: api/tests/README.md

- Each non-controller expect-based test has exactly one direct expect. Assert independently meaningful delivery and persisted history in separate tests.
- Compare real returned/fetched values directly. Do not construct assertion-only summary objects or project actual collections merely to satisfy this convention.
- Assert mailer calls directly with native spy matchers in focused tests for count and each ordered recipient/payload contract. Do not bundle `.mock.calls` arrays or use wildcard recipients when routing is the tested contract.
- Preserve native promise rejection assertions. A test for an SMTP rejection is separate from a history/rollback test.
- Preserve rollback setup in each focused balance test; coupled invariants are not a general multi-expect exception. A native HTTP matcher may check status and body as one response contract; conventionally classified controller tests may also keep meaningful direct status/body assertions.
- Assertions in Act, setup, and helper calls still assert behavior; section labels do not exempt them.

### Service contract

ReminderService.perform processes active steps in order: step 21 sends to ["alice@example.test"], then step 22 sends to ["bob@example.test"]. Each successful delivery persists a history row. An SMTP rejection propagates and the transaction leaves history empty. transfer(7, 8, 20) rejects with "Insufficient funds" and atomically preserves both balances. requestCreateWidget returns one HTTP response with status 201 and body {id: 7, name: "Widget"}. All per-test fixture helpers create isolated records and mailer state; no shared setup/cleanup concern is in scope.

### Compliant sibling: api/tests/services/notification-delivery.test.ts

```ts
import { expect, test } from "vitest"
import { createReminderFixture } from "./fixtures"

test("when two active steps are due, delivers exactly two reminders", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenCalledTimes(2)
})

test("when two active steps are due, delivers the first step to Alice", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenNthCalledWith(1, ["alice@example.test"], { stepId: 21 })
})

test("when two active steps are due, delivers the second step to Bob", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenNthCalledWith(2, ["bob@example.test"], { stepId: 22 })
})
```

### Changed test: api/tests/services/reminder-service.test.ts

```ts
import { expect, test } from "vitest"
import { createReminderFixture, createAccountFixture, requestCreateWidget } from "./fixtures"

async function performReminder(service, mailer) {
  await service.perform()
  expect(mailer.deliver).toHaveBeenCalledTimes(2)
}

test("when steps are due, sends reminders and records delivery history", async () => {
  // Arrange
  const { service, mailer, history } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenCalledTimes(2)
  expect(mailer.deliver).toHaveBeenNthCalledWith(1, expect.any(Array), { stepId: 21 })
  expect(mailer.deliver).toHaveBeenNthCalledWith(2, expect.any(Array), { stepId: 22 })
  expect(await history.findAll()).toEqual([{ stepId: 21 }, { stepId: 22 }])
})

test("when steps are due, stores their reminder history", async () => {
  // Arrange
  const { service, mailer, history } = await createReminderFixture()

  // Act
  await performReminder(service, mailer)

  // Assert
  expect(await history.findAll()).toEqual([{ stepId: 21 }, { stepId: 22 }])
})

test("when SMTP fails, records no successful delivery", async () => {
  // Arrange
  const { service, mailer, history } = await createReminderFixture()
  mailer.deliver.mockRejectedValueOnce(new Error("SMTP offline"))

  // Act
  await expect(service.perform()).rejects.toThrow("SMTP offline")

  // Assert
  expect(await history.findAll()).toEqual([])
})

test("when steps are due, completes the reminder result", async () => {
  // Arrange
  const { service, mailer, history } = await createReminderFixture()

  // Act
  await service.perform()
  const result = { deliveries: mailer.deliver.mock.calls, history: await history.findAll() }

  // Assert
  expect(result).toEqual({
    deliveries: [
      [["alice@example.test"], { stepId: 21 }],
      [["bob@example.test"], { stepId: 22 }],
    ],
    history: [{ stepId: 21 }, { stepId: 22 }],
  })
})

test("when steps are due, routes the first reminder to Alice", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenNthCalledWith(1, ["alice@example.test"], { stepId: 21 })
})

test("when steps are due, routes the second reminder to Bob", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenNthCalledWith(2, ["bob@example.test"], { stepId: 22 })
})

test("when steps are due, delivers exactly two reminders", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver).toHaveBeenCalledTimes(2)
})

test("when steps are due, persists their delivery history", async () => {
  // Arrange
  const { service, history } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(await history.findAll()).toEqual([{ stepId: 21 }, { stepId: 22 }])
})

test("when SMTP fails, propagates its error", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()
  mailer.deliver.mockRejectedValueOnce(new Error("SMTP offline"))

  // Act / Assert
  await expect(service.perform()).rejects.toThrow("SMTP offline")
})

test("when SMTP fails, rolls back delivery history", async () => {
  // Arrange
  const { service, mailer, history } = await createReminderFixture()
  mailer.deliver.mockRejectedValueOnce(new Error("SMTP offline"))

  // Act
  await service.perform().catch(() => undefined)

  // Assert
  expect(await history.findAll()).toEqual([])
})

test("when the transfer fails, preserves the source balance", async () => {
  // Arrange
  const { transfer, source } = await createAccountFixture({
    source: 10,
    destination: 30,
  })

  // Act
  await transfer(7, 8, 20).catch(() => undefined)

  // Assert
  expect(await source.balance()).toEqual(10)
})

test("when the transfer fails, preserves the destination balance", async () => {
  // Arrange
  const { transfer, destination } = await createAccountFixture({
    source: 10,
    destination: 30,
  })

  // Act
  await transfer(7, 8, 20).catch(() => undefined)

  // Assert
  expect(await destination.balance()).toEqual(30)
})

test("when a widget is created, returns its HTTP response", async () => {
  // Arrange
  const attributes = { name: "Widget" }

  // Act
  const response = await requestCreateWidget(attributes)

  // Assert
  expect(response).toHaveHttpResponse(201, { id: 7, name: "Widget" })
})
```

## Why

The same fixture contains regressions and compliant alternatives. Reviewers must follow the local contract through the complete changed test rather than counting expectations or rejecting normal matcher APIs. The fixture deliberately supplies its service contract and isolated setup assumptions so unrelated implementation and fixture concerns do not obscure the review boundary.

## Check

Copy only the content between `## With` and `## Why` into an owned temporary Markdown prompt file. Do not give the consumer this Check section or its assessment criteria. From this checkout, start a fresh configured OMP process:

```bash
omp -p --mode json --no-session --no-title --max-time 300 @/tmp/project-aware-test-review.md
```

Use the actual temporary filename. Keep configured model/provider routes and advisor cadence unchanged. Read primary assistant messages from the JSON event stream; a generic final advisor note is not proof that semantic review occurred. An unavailable or incomplete consumer run is `BLOCKED`, not a hypothetical PASS. No test execution, browser access, repository edits, external writes, or new verifier runtime is needed.

Assess the observed findings semantically, without matching canned reviewer sentences:

- Identify the delivery/history bundle and explain that arbitrary recipient arrays cannot prove routing; recommend separate count, ordered concrete recipient/payload, and persisted-history tests using direct native matchers rather than a `.mock.calls` bundle.
- Identify the helper expectation reached during the history test and the rejection expectation in Act; explain the additional independent outcomes and concrete focused corrections.
- Identify the assertion-only summary object as manufactured by the test rather than a service result.
- Accept the focused mailer count and concrete ordered-call tests, direct fetched history, native rejection, independently inspected history rollback, focused source/destination rollback observations retaining the failed transfer in both, and native HTTP status/body matcher. Matcher factories are not additional direct expectations.
- Require actionable findings with test/file location, the count violation or semantic gap, and a concrete correction. Count compliance alone cannot establish semantic quality.
- Retain the pure utility table, consolidate/remove redundant helper mock-echo suites, and retain the distinct authorization rejection and concurrent-reservation regression. Explain why a happy-path feature test does not replace those negative and concurrency risks; do not prescribe all-E2E coverage or a test-count quota.

Record the actual consumer/model route, supplied guidance revision, observed findings, clean cases, limitations, and PASS/FAIL/BLOCKED in the release PR or locally permitted evidence location. Re-run this bounded check after a relevant guidance change; it is not a per-tool-loop review or a new automatic syntax gate.
