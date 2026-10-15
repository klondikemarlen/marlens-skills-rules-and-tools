# Project-Aware Test Review

## Task

Exercise the supported OMP code-review consumer against complete changed tests, their nearest local test conventions, and a compliant sibling. This is semantic review QA, not execution of the fictional application tests.

## Without

A structural test-alignment PASS does not establish that recipients are asserted, independent effects are separated, or expectations hidden in helpers and Act have been reviewed. Existing shared guidance already expresses these contracts; a wording-only assertion would not prove consumer behavior.

## With

This is bounded read-only release QA for MSSRT issue #470, not implementation in the fixture project. Invoke the installed code-review skill and use the current checkout's code-review workflow. Review ONLY the complete supplied fictional changed test and its supplied nearest test README, service contract, and compliant sibling. No repository/GitHub writes, test execution, browser interaction, memory writes, delegation, model changes, or release workflow. Do not inspect unrelated project files. Findings must identify test/location, the independent outcome or unproven behavior, and a concrete correction. Identify clean cases without inventing findings. Numeric expectation counts alone are not a semantic review. Source line numbers are the lines inside each named code block.

### Nearest applicable test README: api/tests/README.md

- Each test has one observable contract, using one direct expect by default. Assert independently meaningful delivery and persisted history in separate tests.
- Compare real returned/fetched values directly. Do not construct assertion-only summary objects or project actual collections merely to satisfy this convention.
- Use exact nested mailer mock.calls arrays for delivery count, order, and relevant arguments together. Do not use wildcard recipients when routing is the tested contract.
- Preserve native promise rejection assertions. A test for an SMTP rejection is separate from a history/rollback test.
- Multiple assertions are allowed for a genuinely coupled atomic rollback invariant. A native HTTP matcher may check status and body as one response contract.
- Assertions in Act, setup, and helper calls still assert behavior; section labels do not exempt them.

### Service contract

ReminderService.perform processes active steps in order: step 21 sends to ["alice@example.test"], then step 22 sends to ["bob@example.test"]. Each successful delivery persists a history row. An SMTP rejection propagates and the transaction leaves history empty. transfer(7, 8, 20) rejects with "Insufficient funds" and atomically preserves both balances. requestCreateWidget returns one HTTP response with status 201 and body {id: 7, name: "Widget"}. All per-test fixture helpers create isolated records and mailer state; no shared setup/cleanup concern is in scope.

### Compliant sibling: api/tests/services/notification-delivery.test.ts

```ts
import { expect, test } from "vitest"
import { createReminderFixture } from "./fixtures"

test("when two active steps are due, delivers to each step's recipients in order", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver.mock.calls).toEqual([
    [["alice@example.test"], { stepId: 21 }],
    [["bob@example.test"], { stepId: 22 }],
  ])
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

test("when steps are due, routes each reminder to its assigned recipients", async () => {
  // Arrange
  const { service, mailer } = await createReminderFixture()

  // Act
  await service.perform()

  // Assert
  expect(mailer.deliver.mock.calls).toEqual([
    [["alice@example.test"], { stepId: 21 }],
    [["bob@example.test"], { stepId: 22 }],
  ])
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

test("when the transfer fails, preserves the atomic balance invariant", async () => {
  // Arrange
  const { transfer, source, destination } = await createAccountFixture({
    source: 10,
    destination: 30,
  })

  // Act
  await transfer(7, 8, 20).catch(() => undefined)

  // Assert
  expect(await source.balance()).toEqual(10)
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

- Identify the delivery/history bundle and explain that arbitrary recipient arrays cannot prove routing; recommend the exact nested call array and separate persisted-history assertion.
- Identify the helper expectation reached during the history test and the rejection expectation in Act; explain the additional independent outcomes and concrete focused corrections.
- Identify the assertion-only summary object as manufactured by the test rather than a service result.
- Accept the exact mailer call array, direct fetched history, native rejection, independently inspected history rollback, coupled atomic balance invariant, and native HTTP status/body matcher. Matcher API calls are not extra independent expectations.
- Require actionable findings with test/file location, the unproven behavior or independent outcomes, and a correction. A numeric expectation count is insufficient.

Record the actual consumer/model route, supplied guidance revision, observed findings, clean cases, limitations, and PASS/FAIL/BLOCKED in the release PR or locally permitted evidence location. Re-run this bounded check after a relevant guidance change; it is not a per-tool-loop review or a new automatic syntax gate.
