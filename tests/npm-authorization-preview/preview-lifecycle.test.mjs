import assert from "node:assert/strict"
import { request as httpRequest } from "node:http"
import test from "node:test"

import { startPreviewServer } from "../../lib/npm-authorization-preview/start-preview-server.js"

const npmUrl = "https://www.npmjs.com/login?challenge=a%2Fb%2B%3D#private-step"

function previewRequest() {
  return {
    operation: "staged-publication-approval",
    target: {
      package: "@example/release-tool",
      version: "2.4.0",
    },
    reason: "Approve the prepared publication after reviewing its context.",
    context: {
      agent: "release agent",
      repository: "example/release-tool",
      task: "release issue #42",
      whatHappened: "The artifact was staged.",
      completionEffect: "npm will decide whether to publish it.",
    },
    authorizationUrl: npmUrl,
  }
}

function sendAction(previewUrl, action, headers = {}) {
  const origin = new URL(previewUrl).origin
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      `${previewUrl}/${action}`,
      {
        method: "POST",
        headers: {
          Origin: origin,
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/x-www-form-urlencoded",
          ...headers,
        },
      },
      (response) => {
        const chunks = []
        response.on("data", (chunk) => chunks.push(chunk))
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        )
      }
    )
    request.once("error", reject)
    request.end()
  })
}

test("when caller text contains executable markup, the preview serves it only as escaped text", async (t) => {
  // Arrange
  const request = previewRequest()
  request.reason = '<script>alert("private")</script> & review'
  const session = await startPreviewServer(request)
  t.after(() => session.close())

  // Act
  const response = await fetch(session.previewUrl)
  const html = await response.text()

  // Assert
  assert.equal(response.status, 200)
  assert.ok(html.includes("&lt;script&gt;alert(&quot;private&quot;)&lt;/script&gt; &amp; review"))
  assert.ok(!html.includes('<script>alert("private")</script>'))
})

test("when caller data changes after creation, continuation remains paired with the original context", async (t) => {
  // Arrange
  const request = previewRequest()
  const session = await startPreviewServer(request)
  t.after(() => session.close())
  request.target.package = "@attacker/replacement"
  request.authorizationUrl = "https://www.npmjs.com/replacement"

  // Act
  const html = await (await fetch(session.previewUrl)).text()
  const continuation = await sendAction(session.previewUrl, "continue")

  // Assert
  assert.ok(html.includes("@example/release-tool"))
  assert.ok(!html.includes("@attacker/replacement"))
  assert.equal(continuation.status, 303)
  assert.equal(continuation.headers.location, npmUrl)
})

test("when an external origin submits Continue, it cannot consume the preview", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest())
  t.after(() => session.close())

  // Act
  const denied = await sendAction(session.previewUrl, "continue", {
    Origin: "https://attacker.example",
    "Sec-Fetch-Site": "cross-site",
  })
  const cancellation = await sendAction(session.previewUrl, "cancel")

  // Assert
  assert.equal(denied.status, 403)
  assert.equal(denied.headers.location, undefined)
  assert.equal(cancellation.status, 200)
  assert.deepEqual(await session.completion, { result: "cancelled" })
})

test("when a form has an opaque origin, it cannot authorize navigation", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest())
  t.after(() => session.close())

  // Act
  const denied = await sendAction(session.previewUrl, "continue", {
    Origin: "null",
  })

  // Assert
  assert.equal(denied.status, 403)
  assert.equal(denied.headers.location, undefined)
})

test("when a link requests Continue with GET, no provider redirect is returned", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest())
  t.after(() => session.close())

  // Act
  const response = await fetch(`${session.previewUrl}/continue`, {
    redirect: "manual",
  })

  // Assert
  assert.equal(response.status, 404)
  assert.equal(response.headers.get("location"), null)
})

test("when browser opening is still pending, Continue cannot navigate to npm", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest(), {
    ready: false,
  })
  t.after(() => session.close())

  // Act
  const premature = await sendAction(session.previewUrl, "continue")
  session.markReady()
  const continuation = await sendAction(session.previewUrl, "continue")

  // Assert
  assert.equal(premature.status, 425)
  assert.equal(premature.headers.location, undefined)
  assert.equal(continuation.status, 303)
  assert.equal(continuation.headers.location, npmUrl)
})

test("when the user cancels, the server closes without returning a provider destination", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest())
  t.after(() => session.close())

  // Act
  const response = await sendAction(session.previewUrl, "cancel")
  const outcome = await session.completion

  // Assert
  assert.equal(response.status, 200)
  assert.equal(response.headers.location, undefined)
  assert.deepEqual(outcome, { result: "cancelled" })
  await assert.rejects(fetch(session.previewUrl))
})

test("when an unload beacon is delivered, the preview is cancelled without redirecting", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest())
  t.after(() => session.close())

  // Act
  const response = await sendAction(session.previewUrl, "close", {
    "Content-Type": "text/plain",
  })

  // Assert
  assert.equal(response.status, 204)
  assert.equal(response.headers.location, undefined)
  assert.deepEqual(await session.completion, { result: "cancelled" })
})

test("when a page-close beacon is missed, expiry releases the server without opening npm", async (t) => {
  // Arrange
  const session = await startPreviewServer(previewRequest(), {
    ttlMs: 20,
  })
  t.after(() => session.close())

  // Act
  const outcome = await session.completion

  // Assert
  assert.deepEqual(outcome, { result: "expired" })
  await assert.rejects(fetch(session.previewUrl))
})
