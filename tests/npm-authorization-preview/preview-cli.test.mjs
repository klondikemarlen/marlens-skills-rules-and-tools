import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { once } from "node:events"
import { createInterface } from "node:readline"
import test from "node:test"
import { fileURLToPath } from "node:url"

const executable = fileURLToPath(new URL("../../bin/npm-authorization-preview", import.meta.url))

function loginRequest() {
  return {
    operation: "login",
    target: {
      description: "Sign in using the native npm flow.",
    },
    reason: "The authorized release needs the maintainer's npm identity.",
    context: {
      agent: "release agent",
      repository: "example/release-tool",
      task: "release issue #42",
      whatHappened: "Local release checks passed; publication has not started.",
      completionEffect: "npm can authenticate the maintainer; publication remains separate.",
    },
    authorizationUrl: "https://www.npmjs.com/login?challenge=a%2Fb%2B%3D#step",
  }
}

test("when required context is absent, the CLI rejects it before creating a browser handoff", () => {
  // Arrange
  const request = loginRequest()
  delete request.context.whatHappened

  // Act
  const result = spawnSync(process.execPath, [executable, "--manual"], {
    input: JSON.stringify(request),
    encoding: "utf8",
    timeout: 5000,
  })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.match(result.stderr, /context\.whatHappened/)
})

test("when the destination is not the exact HTTPS npm host, the CLI rejects it without opening a server", () => {
  // Arrange
  const unsafeUrls = [
    "http://www.npmjs.com/login",
    "https://www.npmjs.com.evil.example/login",
    "https://www.npmjs.com@evil.example/login",
    "https://user@www.npmjs.com/login",
    "https://www.npmjs.com:443/login",
    "https://www.npmjs.com\\@evil.example/login",
    "https://registry.npmjs.org/login",
  ]

  // Act / Assert
  for (const authorizationUrl of unsafeUrls) {
    const request = { ...loginRequest(), authorizationUrl }
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

test(
  "when the executable completes local continuation, its result does not claim npm completion",
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
    assert.equal(response.headers.get("location"), request.authorizationUrl)
    assert.deepEqual(JSON.parse(line), {
      result: "continued",
      providerCompletion: "unverified",
    })
    assert.ok(!line.includes("challenge="))
    assert.equal(exitCode, 0)
  }
)
