import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { validateRequest } from "../../lib/privilege-preview/validate-request.js"

const CLI = fileURLToPath(new URL("../../bin/privilege-preview", import.meta.url))

function request() {
  return {
    target: [
      { label: "Resource", value: "/etc/example" },
      { label: "Host", value: "workstation" },
    ],
    reason: "A root-owned configuration rejected the unprivileged change.",
    context: {
      agent: "Agent",
      task: "Update configuration",
      whatHappened: "The file could not be written.",
      completionEffect: "The requested setting will be changed.",
      repository: "example/repository",
    },
    command: {
      executable: "/usr/bin/printf",
      arguments: ["%s", "literal $(text)", "", "quote'\""],
      cwd: "/",
    },
  }
}

for (const execution of [undefined, "administrator", "current-user"]) {
  test(`when execution is ${execution ?? "omitted"}, validation freezes its normalized mode`, () => {
    // Arrange
    const original = request()
    if (execution !== undefined) original.execution = execution
    // Act
    const normalized = validateRequest(original)
    original.execution = execution === "current-user" ? "administrator" : "current-user"
    // Assert
    assert.equal(normalized.execution, execution ?? "administrator")
    assert.equal(Object.isFrozen(normalized), true)
    assert.throws(() => {
      normalized.execution = "changed"
    }, TypeError)
  })
}

test("when a current-user request supplies environment overrides, validation rejects them", () => {
  // Arrange
  const original = { ...request(), execution: "current-user" }
  // Act / Assert
  assert.throws(() => validateRequest({ ...original, env: { HOME: "/tmp" } }))
  assert.throws(() =>
    validateRequest({ ...original, command: { ...original.command, env: { GNUPGHOME: "/tmp" } } })
  )
})

const invalidMutations = [
  (value) => {
    value.extra = true
  },
  (value) => {
    value.target = []
  },
  (value) => {
    value.target[0].extra = true
  },
  (value) => {
    value.target[0].label = ""
  },
  (value) => {
    value.target[0].value = "a\u001bb"
  },
  (value) => {
    value.reason = " "
  },
  (value) => {
    delete value.context.task
  },
  (value) => {
    value.context.issueUrl = "https://example.com"
  },
  (value) => {
    value.context.agent = "a\u202eb"
  },
  (value) => {
    value.command.extra = true
  },
  (value) => {
    value.command.executable = "relative"
  },
  (value) => {
    value.command.executable = "/usr/bin/true\n"
  },
  (value) => {
    value.command.cwd = "relative"
  },
  (value) => {
    value.command.cwd = "/usr/bin/python3"
  },
  (value) => {
    value.command.cwd = "/does-not-exist-privilege-preview-test"
  },
  (value) => {
    value.command.arguments = "--not-an-array"
  },
  (value) => {
    value.command.arguments = [false]
  },
  (value) => {
    value.command.arguments = ["a\u0000b"]
  },
  (value) => {
    value.command.arguments = ["a\nb"]
  },
  (value) => {
    value.command.arguments = Array(257).fill("a")
  },
  (value) => {
    value.command.arguments = ["a".repeat(8_193)]
  },
]

for (const [index, mutate] of invalidMutations.entries()) {
  test(`when request variant ${index + 1} is invalid, validation rejects it`, () => {
    // Arrange
    const value = request()
    mutate(value)
    // Act / Assert
    assert.throws(() => validateRequest(value))
  })
}

for (const value of [null, [], true, "request", {}]) {
  test(`when the root value is ${JSON.stringify(value)}, validation rejects it`, () => {
    // Arrange: the loop supplies the invalid root value.
    // Act / Assert
    assert.throws(() => validateRequest(value))
  })
}

for (const argumentsList of [
  ["--unknown"],
  ["--demo", "--demo"],
  ["--expires-in"],
  ["--expires-in", "29"],
  ["--expires-in", "86401"],
  ["--expires-in", "NaN"],
]) {
  test(`when options are ${argumentsList.join(" ")}, the CLI rejects them before GUI startup`, () => {
    // Arrange: the loop supplies invalid CLI options.
    // Act
    const result = spawnSync(process.execPath, [CLI, ...argumentsList], {
      encoding: "utf8",
      timeout: 5_000,
    })
    // Assert
    assert.equal(result.error, undefined)
    assert.equal(result.status, 2)
    assert.equal(JSON.parse(result.stdout).result, "error")
  })
}

test("when input is malformed, the CLI fails closed without requiring a GUI", () => {
  // Arrange
  const input = "{not JSON}"
  // Act
  const result = spawnSync(process.execPath, [CLI], { input, encoding: "utf8", timeout: 5_000 })
  // Assert
  assert.equal(result.error, undefined)
  assert.equal(result.status, process.getuid() === 0 ? 1 : 2)
  assert.equal(JSON.parse(result.stdout).result, "error")
})

test(
  "when invoked as root, the CLI rejects before opening native UI",
  { skip: process.getuid() !== 0 },
  () => {
    // Arrange
    const argumentsList = [CLI, "--demo"]
    // Act
    const result = spawnSync(process.execPath, argumentsList, { encoding: "utf8", timeout: 5_000 })
    // Assert
    assert.equal(result.error, undefined)
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).result, "error")
  }
)
