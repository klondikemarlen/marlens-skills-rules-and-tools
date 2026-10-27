import { randomBytes } from "node:crypto"
import { createServer } from "node:http"

import { renderPreviewPage } from "./render-preview-page.js"
import { validateRequest } from "./validate-request.js"

export const DEFAULT_PREVIEW_TTL_MS = 5 * 60 * 1_000
export const MAX_PREVIEW_TTL_MS = 15 * 60 * 1_000
const MAX_POST_BYTES = 1_024
const SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self' https://www.npmjs.com; base-uri 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  Pragma: "no-cache",
  // Native form POSTs need their real Origin; external redirects still get no referrer.
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
}

export async function startPreviewServer(
  input,
  { ttlMs = DEFAULT_PREVIEW_TTL_MS, ready = true } = {}
) {
  const request = validateRequest(input)
  const destination = Object.freeze({
    origin: new URL(request.authorizationUrl).origin,
    exactUrl: request.authorizationUrl,
  })
  const presentation = Object.freeze({
    operation: request.operation,
    target: request.target,
    reason: request.reason,
    context: request.context,
    destination,
  })
  if (!Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_PREVIEW_TTL_MS)
    throw new Error("Preview expiry must be between 1 millisecond and 15 minutes.")

  const capability = randomBytes(32).toString("base64url")
  const path = `/${capability}`
  const server = createServer((incomingRequest, response) => {
    void handleRequest(incomingRequest, response)
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 10_000

  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  if (!address || typeof address === "string") {
    await closeUnstartedServer(server)
    throw new Error("Could not determine the loopback preview address.")
  }

  const origin = `http://127.0.0.1:${address.port}`
  const expectedHost = `127.0.0.1:${address.port}`
  let state = "pending"
  let openerReady = ready
  let expiryTimer
  let serverClosePromise
  let resolveCompletion
  const completion = new Promise((resolve) => {
    resolveCompletion = resolve
  })

  expiryTimer = setTimeout(() => finishWithoutResponse("expired"), ttlMs)

  async function handleRequest(incomingRequest, response) {
    try {
      if (!isLoopbackRequest(incomingRequest, expectedHost)) {
        sendText(response, 403, "Forbidden")
        return
      }

      if (incomingRequest.url === path && incomingRequest.method === "GET") {
        sendHtml(response, 200, renderPreviewPage(presentation, { path, ready: openerReady }))
        return
      }

      if (incomingRequest.url === `${path}/status` && incomingRequest.method === "GET") {
        sendJson(response, 200, { ready: openerReady, state })
        return
      }

      if (incomingRequest.url === `${path}/ui.js` && incomingRequest.method === "GET") {
        sendJavaScript(response, 200, renderClientScript(path))
        return
      }

      const action = postAction(incomingRequest.url, path)
      if (action && incomingRequest.method === "POST") {
        await handleStateChange(incomingRequest, response, action)
        return
      }

      sendText(response, 404, "Not found")
    } catch (error) {
      const status = error instanceof RequestTooLargeError ? 413 : 400
      sendText(response, status, status === 413 ? "Request too large" : "Bad request")
    }
  }

  async function handleStateChange(incomingRequest, response, action) {
    if (!hasSameOriginRequest(incomingRequest, origin, expectedHost)) {
      sendText(response, 403, "State changes require a same-origin browser request.")
      return
    }

    if (!hasExpectedContentType(incomingRequest, action)) {
      sendText(response, 415, "Unsupported request content type.")
      return
    }

    if (!(await hasEmptyBody(incomingRequest))) {
      sendText(response, 400, "Unexpected request body.")
      return
    }

    if (state !== "pending") {
      sendText(response, 410, "This preview is no longer active.")
      return
    }

    if (action === "continue") {
      if (!openerReady) {
        sendText(response, 425, "The normal-browser opener has not completed.")
        return
      }
      if (!beginOutcome("continued")) {
        sendText(response, 410, "This preview is no longer active.")
        return
      }
      respondThenClose(response, 303, "", "text/plain; charset=utf-8", {
        Location: request.authorizationUrl,
      })
      return
    }

    if (action === "cancel") {
      if (!beginOutcome("cancelled")) {
        sendText(response, 410, "This preview is no longer active.")
        return
      }
      respondThenClose(
        response,
        200,
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Cancelled</title><p>Cancelled. No npm page was opened.</p></html>',
        "text/html; charset=utf-8"
      )
      return
    }

    if (!beginOutcome("cancelled")) {
      sendText(response, 410, "This preview is no longer active.")
      return
    }
    respondThenClose(response, 204, "", "text/plain; charset=utf-8")
  }

  function beginOutcome(outcome) {
    if (state !== "pending") return false
    state = outcome
    clearTimeout(expiryTimer)
    return true
  }

  function finishWithoutResponse(outcome) {
    if (!beginOutcome(outcome)) return serverClosePromise
    return closeServer({ force: true })
  }

  function respondThenClose(response, status, body, contentType, extraHeaders = {}) {
    response.once("finish", () => void closeServer())
    response.once("close", () => void closeServer())
    respond(response, status, body, contentType, extraHeaders)
  }

  function closeServer({ force = false } = {}) {
    if (serverClosePromise) return serverClosePromise
    clearTimeout(expiryTimer)
    serverClosePromise = new Promise((resolve) => {
      if (!server.listening) {
        resolve()
        return
      }
      server.close(() => resolve())
      if (force) server.closeAllConnections?.()
    }).then(() => {
      resolveCompletion({ result: state })
    })
    return serverClosePromise
  }

  return {
    previewUrl: `${origin}${path}`,
    completion,
    markReady() {
      if (state === "pending") openerReady = true
    },
    async failLaunch() {
      await finishWithoutResponse("launch-failed")
    },
    async close() {
      if (state === "pending") await finishWithoutResponse("cancelled")
      else await closeServer()
    },
  }
}

function postAction(url, path) {
  if (url === `${path}/continue`) return "continue"
  if (url === `${path}/cancel`) return "cancel"
  if (url === `${path}/close`) return "close"
  return undefined
}

function isLoopbackRequest(request, expectedHost) {
  return (
    request.headers.host === expectedHost &&
    (request.socket.remoteAddress === "127.0.0.1" ||
      request.socket.remoteAddress === "::ffff:127.0.0.1")
  )
}

function hasSameOriginRequest(request, origin, expectedHost) {
  return (
    request.headers.host === expectedHost &&
    request.headers.origin === origin &&
    request.headers["sec-fetch-site"] === "same-origin" &&
    (request.socket.remoteAddress === "127.0.0.1" ||
      request.socket.remoteAddress === "::ffff:127.0.0.1")
  )
}

function hasExpectedContentType(request, action) {
  const contentType = request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase()
  if (action === "close")
    return contentType === "text/plain" || contentType === "application/x-www-form-urlencoded"
  return contentType === "application/x-www-form-urlencoded"
}

async function hasEmptyBody(request) {
  const declaredLength = request.headers["content-length"]
  if (declaredLength !== undefined && Number(declaredLength) > MAX_POST_BYTES)
    throw new RequestTooLargeError()

  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > MAX_POST_BYTES) throw new RequestTooLargeError()
  }
  return length === 0
}

function renderClientScript(path) {
  return `const continueButton = document.querySelector("#continue-button");
const statusText = document.querySelector("#handoff-status");
let stateChangeSubmitted = false;

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", () => {
    stateChangeSubmitted = true;
  });
});

window.addEventListener("pagehide", () => {
  if (stateChangeSubmitted) return;
  navigator.sendBeacon("${path}/close", new Blob([], { type: "text/plain" }));
});

async function waitUntilReady() {
  if (!continueButton.disabled) return;
  while (true) {
    try {
      const response = await fetch("${path}/status", {
        cache: "no-store",
        credentials: "omit",
      });
      if (!response.ok) throw new Error("Preview ended");
      const current = await response.json();
      if (current.ready) {
        continueButton.disabled = false;
        statusText.textContent = "Ready. Continue opens the supplied npm URL in this browser.";
        return;
      }
      if (current.state !== "pending") {
        statusText.textContent = "This preview is no longer active.";
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch {
      statusText.textContent = "This preview is unavailable. No npm page was opened.";
      return;
    }
  }
}

void waitUntilReady();
`
}

function sendHtml(response, status, body) {
  respond(response, status, body, "text/html; charset=utf-8")
}

function sendJson(response, status, body) {
  respond(response, status, JSON.stringify(body), "application/json; charset=utf-8")
}

function sendJavaScript(response, status, body) {
  respond(response, status, body, "text/javascript; charset=utf-8")
}

function sendText(response, status, body) {
  respond(response, status, body, "text/plain; charset=utf-8")
}

function respond(response, status, body, contentType, extraHeaders = {}) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    Connection: "close",
    "Content-Type": contentType,
    ...extraHeaders,
  })
  response.end(body)
}

async function closeUnstartedServer(server) {
  if (server.listening) await new Promise((resolve) => server.close(resolve))
}

class RequestTooLargeError extends Error {}

export default startPreviewServer
