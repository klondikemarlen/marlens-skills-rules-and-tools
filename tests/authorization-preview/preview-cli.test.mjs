import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { once } from "node:events"
import { createInterface } from "node:readline"
import test from "node:test"
import { fileURLToPath } from "node:url"

const executable = fileURLToPath(new URL("../../bin/authorization-preview", import.meta.url))

function loginRequest() {
  return {
    action: "Sign in using the native provider flow",
    target: [{ label: "Account", value: "Maintainer account; identity not yet verified" }],
    reason: "The authorized release needs the maintainer's npm identity.",
    context: {
      agent: "release agent",
      repository: "example/release-tool",
      task: "release issue #42",
      completionEffect: "npm can authenticate the maintainer; publication remains separate.",
    },
    destinationUrl: "https://accounts.example/login?challenge=a%2Fb%2B%3D#step",
  }
}

test("when required context is absent, the CLI rejects it before creating a browser handoff", () => {
  // Arrange
  const request = loginRequest()
  delete request.context.task

  // Act
  const result = spawnSync(process.execPath, [executable, "--manual"], {
    input: JSON.stringify(request),
    encoding: "utf8",
    timeout: 5000,
  })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.match(result.stderr, /context\.task/)
})

test("when the destination is not unambiguous credential-free HTTPS, the CLI rejects it without opening a server", () => {
  // Arrange
  const unsafeUrls = [
    "http://example.com/login",
    "javascript:alert(1)",
    "https://user:password@example.com/login",
    "https://example.com\\@other.example/login",
    "https://example.com/login\nLocation: https://other.example",
    "https:///example.com/login",
  ]

  // Act / Assert
  for (const destinationUrl of unsafeUrls) {
    const request = { ...loginRequest(), destinationUrl }
    const result = spawnSync(process.execPath, [executable, "--manual"], {
      input: JSON.stringify(request),
      encoding: "utf8",
      timeout: 5000,
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
  }
})

test("when a caller supplies hidden unknown context fields, the CLI rejects rather than omits them", () => {
  // Arrange
  const request = loginRequest()
  request.context.unshownApproval = "Do not silently authorize this."

  // Act
  const result = spawnSync(process.execPath, [executable, "--manual"], {
    input: JSON.stringify(request),
    encoding: "utf8",
    timeout: 5000,
  })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.match(result.stderr, /unknown field/)
})

test("when a private URL is passed as an unsupported argument, the error does not disclose it", () => {
  // Arrange
  const privateUrl = "https://www.npmjs.com/login?challenge=synthetic-private-marker"

  // Act
  const result = spawnSync(process.execPath, [executable, privateUrl], {
    encoding: "utf8",
    timeout: 5000,
  })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.ok(!result.stderr.includes("synthetic-private-marker"))
})

test(
  "when the executable completes local continuation, its result does not claim provider completion",
  { timeout: 5000 },
  async (t) => {
    // Arrange
    const request = loginRequest()
    const child = spawn(process.execPath, [executable, "--manual"], {
      stdio: ["pipe", "pipe", "pipe"],
    })
    const exited = once(child, "close")
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM")
        await exited
      }
    })
    const lines = createInterface({ input: child.stdout })
    const firstLine = once(lines, "line")
    child.stdin.end(JSON.stringify(request))
    const [readyLine] = await firstLine
    const ready = JSON.parse(readyLine)
    const resultLine = once(lines, "line")
    const origin = new URL(ready.previewUrl).origin

    // Act
    const response = await fetch(`${ready.previewUrl}/continue`, {
      method: "POST",
      redirect: "manual",
      headers: {
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    const [line] = await resultLine
    const [exitCode] = await exited

    // Assert
    assert.equal(response.status, 303)
    assert.equal(response.headers.get("location"), request.destinationUrl)
    assert.deepEqual(JSON.parse(line), {
      result: "continued",
      providerCompletion: "unverified",
    })
    assert.ok(!line.includes("challenge="))
    assert.equal(exitCode, 0)
  }
)

test(
  "when demo mode receives no stdin, Continue finishes locally without attempting the destination",
  { timeout: 5000 },
  async (t) => {
    // Arrange
    const child = spawn(process.execPath, [executable, "--demo", "--manual"], {
      stdio: ["pipe", "pipe", "pipe"],
    })
    const exited = once(child, "close")
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM")
        await exited
      }
    })
    const lines = createInterface({ input: child.stdout })
    const [readyLine] = await once(lines, "line")
    const { previewUrl } = JSON.parse(readyLine)
    const resultLine = once(lines, "line")

    // Act
    const response = await fetch(`${previewUrl}/continue`, {
      method: "POST",
      redirect: "manual",
      headers: {
        Origin: new URL(previewUrl).origin,
        "Sec-Fetch-Site": "same-origin",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    const [line] = await resultLine
    const [exitCode] = await exited

    // Assert
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("location"), null)
    assert.deepEqual(JSON.parse(line), {
      result: "demo-completed",
      providerCompletion: "not-attempted",
    })
    assert.equal(exitCode, 0)
  }
)
