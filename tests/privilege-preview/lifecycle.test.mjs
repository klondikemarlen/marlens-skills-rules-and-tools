import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import test from "node:test"

import { runPreview } from "../../lib/privilege-preview/run-preview.js"

function request() {
  return {
    target: [{ label: "Resource", value: "/etc/example.conf" }],
    reason: "The file is owned by root and the unprivileged edit was denied.",
    context: {
      agent: "Test agent",
      task: "Update the selected configuration",
      whatHappened: "The edit received a permission error.",
      completionEffect: "The configuration will contain the requested value.",
    },
    command: {
      executable: "/usr/bin/printf",
      arguments: ["%s", "a b", "$(touch /tmp/not-executed)", "", "--flag"],
      cwd: "/",
    },
  }
}

function childProcess() {
  const child = new EventEmitter()
  child.stdin = new PassThrough()
  child.stdout = new PassThrough()
  child.exitCode = null
  child.signalCode = null
  child.killedSignals = []
  child.unreferenced = false
  child.unref = () => {
    child.unreferenced = true
  }
  child.kill = (signal) => {
    child.killedSignals.push(signal)
    child.signalCode = signal
    child.emit("close", null, signal)
  }
  return child
}

function harness(events, { executorExitCode = 0, holdExecutor = false } = {}) {
  const calls = []
  const dialog = childProcess()
  const executor = childProcess()
  const inputLines = []
  dialog.stdin.on("data", (chunk) => {
    inputLines.push(JSON.parse(chunk.toString()))
    if (inputLines.length === 1)
      queueMicrotask(() => {
        for (const event of events) dialog.stdout.write(`${JSON.stringify({ result: event })}\n`)
      })
    else
      queueMicrotask(() => {
        dialog.exitCode = 0
        dialog.emit("close", 0, null)
      })
  })
  const spawnProcess = (executable, argumentsList, options) => {
    calls.push({ executable, argumentsList, options })
    if (executable === "/usr/bin/python3") return dialog
    assert.equal(executable, "/usr/bin/pkexec")
    if (!holdExecutor) queueMicrotask(() => executor.emit("close", executorExitCode, null))
    return executor
  }
  return { calls, dialog, executor, inputLines, spawnProcess }
}

for (const result of ["cancelled", "expired"]) {
  test(`when the dialog returns ${result}, no executor launches`, async () => {
    // Arrange
    const boundary = harness(["ready", result])
    // Act / Assert
    assert.deepEqual(await runPreview(request(), boundary), { result })
    assert.equal(boundary.calls.length, 1)
  })
}

test("when approved repeatedly, the exact frozen argv executes only once without a shell", async () => {
  // Arrange
  const boundary = harness(["ready", "approved", "approved"])
  const original = request()
  // Act
  const outcome = runPreview(original, boundary)
  original.command.arguments[0] = "changed after handoff"
  // Assert
  assert.deepEqual(await outcome, { result: "command-completed", exitCode: 0, signal: null })
  assert.equal(boundary.calls.length, 2)
  const invocation = boundary.calls[1]
  assert.deepEqual(invocation.argumentsList, [
    "--disable-internal-agent",
    "--keep-cwd",
    "/usr/bin/printf",
    "%s",
    "a b",
    "$(touch /tmp/not-executed)",
    "",
    "--flag",
  ])
  assert.equal(invocation.options.cwd, "/")
  assert.equal(invocation.options.shell, false)
  assert.equal(invocation.options.stdio[0], "ignore")
  assert.deepEqual(invocation.options.env, { PATH: "/usr/bin:/bin", LANG: "C.UTF-8" })
  assert.equal(boundary.inputLines[0].request.command.arguments[0], "%s")
  assert.equal(boundary.inputLines.at(-1).result, "command-completed")
})

test("when pkexec exits nonzero, the result preserves ambiguous authorization-or-command failure", async () => {
  // Arrange
  const boundary = harness(["ready", "approved"], { executorExitCode: 126 })
  // Act / Assert
  assert.deepEqual(await runPreview(request(), boundary), {
    result: "authorization-or-command-failed",
    exitCode: 126,
    signal: null,
  })
})

for (const events of [["approved"], ["ready", "unknown"], ["ready", "demo-completed"]]) {
  test(`when the dialog sends ${events.join(" then ")}, the invalid transition fails closed`, async () => {
    // Arrange
    const boundary = harness(events)
    // Act / Assert
    assert.equal((await runPreview(request(), boundary)).result, "error")
    assert.equal(boundary.calls.length, 1)
  })
}

test("when demo completes, no executor launches", async () => {
  // Arrange
  const boundary = harness(["ready", "demo-completed"])
  // Act / Assert
  assert.deepEqual(await runPreview(request(), { ...boundary, demo: true }), {
    result: "demo-completed",
  })
  assert.equal(boundary.calls.length, 1)
})

test("when demo sends approval, execution is rejected", async () => {
  // Arrange
  const boundary = harness(["ready", "approved"])
  // Act / Assert
  assert.equal((await runPreview(request(), { ...boundary, demo: true })).result, "error")
  assert.equal(boundary.calls.length, 1)
})

test("when interrupted before approval, the UI closes without launching an executor", async () => {
  // Arrange
  const boundary = harness([])
  const controller = new AbortController()
  // Act
  const outcome = runPreview(request(), { ...boundary, signal: controller.signal })
  controller.abort()
  // Assert
  assert.deepEqual(await outcome, { result: "interrupted", executionMayContinue: false })
  assert.equal(boundary.calls.length, 1)
  assert.equal(boundary.dialog.stdin.writableEnded, true)
})

test("when interrupted after execution starts, root cancellation is neither claimed nor attempted", async () => {
  // Arrange
  const boundary = harness(["ready", "approved"], { holdExecutor: true })
  const controller = new AbortController()
  // Act
  const outcome = runPreview(request(), { ...boundary, signal: controller.signal })
  await new Promise((resolve) => queueMicrotask(resolve))
  controller.abort()
  // Assert
  assert.deepEqual(await outcome, { result: "interrupted", executionMayContinue: true })
  assert.equal(boundary.executor.unreferenced, true)
  assert.deepEqual(boundary.executor.killedSignals, [])
})

test("when the approved preview closes, the caller still waits for the actual command result", async () => {
  // Arrange
  const boundary = harness(["ready", "approved"], { holdExecutor: true })
  let result

  // Act
  const outcome = runPreview(request(), boundary).then((status) => {
    result = status
    return status
  })
  await new Promise((resolve) => queueMicrotask(resolve))
  boundary.dialog.exitCode = 0
  boundary.dialog.emit("close", 0, null)
  await new Promise((resolve) => queueMicrotask(resolve))

  // Assert
  assert.equal(result, undefined)
  assert.deepEqual(boundary.executor.killedSignals, [])
  boundary.executor.emit("close", 126, null)
  assert.deepEqual(await outcome, {
    result: "authorization-or-command-failed",
    exitCode: 126,
    signal: null,
  })
  assert.equal(boundary.calls.length, 2)
})

test("when the dialog closes without a decision, execution fails closed", async () => {
  // Arrange
  const boundary = harness([])
  // Act
  const outcome = runPreview(request(), boundary)
  boundary.dialog.exitCode = 1
  boundary.dialog.emit("close", 1, null)
  // Assert
  assert.equal((await outcome).result, "error")
  assert.equal(boundary.calls.length, 1)
})

test("when dialog output is oversized or malformed, execution fails closed", async () => {
  for (const output of ["not JSON\n", "x".repeat(4_097)]) {
    // Arrange
    const boundary = harness([])
    // Act
    const outcome = runPreview(request(), boundary)
    boundary.dialog.stdout.write(output)
    // Assert
    assert.equal((await outcome).result, "error")
    assert.equal(boundary.calls.length, 1)
  }
})

test("when the request is invalid, no subprocess starts", () => {
  // Arrange
  const boundary = harness(["ready", "approved"])
  // Act / Assert
  assert.throws(() => runPreview({ ...request(), unexpected: true }, boundary))
  assert.equal(boundary.calls.length, 0)
})

test("when Python cannot start, execution fails closed", async () => {
  // Arrange
  const boundary = harness([])
  // Act
  const outcome = runPreview(request(), boundary)
  boundary.dialog.emit("error", new Error("ENOENT"))
  // Assert
  assert.equal((await outcome).result, "error")
  assert.equal(boundary.calls.length, 1)
})

test("when pkexec cannot start, the final result reports failure without retry", async () => {
  // Arrange
  const boundary = harness(["ready", "approved"], { holdExecutor: true })
  // Act
  const outcome = runPreview(request(), boundary)
  await new Promise((resolve) => queueMicrotask(resolve))
  boundary.executor.emit("error", new Error("ENOENT"))
  // Assert
  assert.equal((await outcome).result, "authorization-or-command-failed")
  assert.equal(boundary.calls.length, 2)
})

for (const { label, options, seconds } of [
  { label: "30-second", options: { expiresInSeconds: 30 }, seconds: 30 },
  { label: "default 30-minute", options: {}, seconds: 1_800 },
  { label: "24-hour", options: { expiresInSeconds: 86_400 }, seconds: 86_400 },
]) {
  test(`when the ${label} approval deadline elapses, expiry occurs only at the deadline without execution`, async (context) => {
    // Arrange
    context.mock.timers.enable({ apis: ["setTimeout"] })
    const boundary = harness(["ready"])
    let result

    // Act
    const outcome = runPreview(request(), { ...boundary, ...options }).then((status) => {
      result = status
      return status
    })
    await new Promise((resolve) => queueMicrotask(resolve))
    context.mock.timers.tick(seconds * 1_000 - 1)
    await new Promise((resolve) => queueMicrotask(resolve))

    // Assert
    assert.equal(result, undefined)
    context.mock.timers.tick(1)
    assert.deepEqual(await outcome, { result: "expired" })
    assert.equal(boundary.calls.length, 1)
  })
}

test("when approval starts execution, the approval deadline does not expire the running command", async (context) => {
  // Arrange
  context.mock.timers.enable({ apis: ["setTimeout"] })
  const boundary = harness(["ready", "approved"], { holdExecutor: true })
  let result

  // Act
  const outcome = runPreview(request(), { ...boundary, expiresInSeconds: 30 }).then((status) => {
    result = status
    return status
  })
  await new Promise((resolve) => queueMicrotask(resolve))
  context.mock.timers.tick(31_000)
  await new Promise((resolve) => queueMicrotask(resolve))

  // Assert
  assert.equal(result, undefined)
  boundary.executor.emit("close", 0, null)
  assert.deepEqual(await outcome, { result: "command-completed", exitCode: 0, signal: null })
})
