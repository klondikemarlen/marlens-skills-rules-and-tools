import escapeHtml from "escape-html"

export function renderPreviewPage(request, { path, ready, demo = false }) {
  const targetRows = renderTargetRows(request)
  const destinationRows = renderDestinationRows(request.destination)
  const contextRows = renderContextRows(request.context)
  const readiness = ready
    ? readyMessage(demo)
    : "Waiting for the normal-browser opener. Continue is unavailable until it succeeds."

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review browser handoff</title>
  <style>
    body { font: 1rem/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 48rem; padding: 0 1rem; }
    h1 { line-height: 1.2; }
    dt { font-weight: 700; margin-top: 0.75rem; }
    dd { margin-left: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .notice { border-left: 0.3rem solid #8a4b00; padding: 0.75rem 1rem; }
    .actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    button { font: inherit; padding: 0.65rem 1rem; }
  </style>
</head>
<body>
  <main>
    <h1>Review before continuing</h1>
    ${demo ? '<p class="notice"><strong>Demo only.</strong> Sample context, not a real request. Try Continue finishes here without opening the destination.</p>' : ""}
    <p class="notice"><strong>Agent-provided context, not a safety check.</strong> This page explains the handoff. It does not verify the destination, its identity, or whether it is safe to enter credentials. Continuing only opens the supplied URL; it does not approve or complete the described action.</p>
    <h2>${escapeHtml(request.action)}</h2>
    <dl>
      ${targetRows}
      ${destinationRows}
      <dt>Why this is needed</dt>
      <dd>${escapeHtml(request.reason)}</dd>
      <dt>Requesting agent</dt>
      <dd>${escapeHtml(request.context.agent)}</dd>
      ${request.context.repository ? row("Repository", request.context.repository) : ""}
      <dt>Task</dt>
      <dd>${escapeHtml(request.context.task)}</dd>
      ${contextRows}
    </dl>
    <p id="handoff-status" role="status" aria-live="polite">${escapeHtml(readiness)}</p>
    <div class="actions">
      <form id="continue-form" action="${escapeHtml(`${path}/continue`)}" method="post">
        <button id="continue-button" type="submit"${ready ? "" : " disabled"}>${demo ? "Try Continue" : "Continue"}</button>
      </form>
      <form action="${escapeHtml(`${path}/cancel`)}" method="post">
        <button type="submit">Cancel</button>
      </form>
    </div>
    <script src="${escapeHtml(`${path}/ui.js`)}" defer></script>
  </main>
</body>
</html>`
}

export function readyMessage(demo) {
  return demo
    ? "Demo ready. Try Continue finishes locally without opening another page."
    : "Ready. Continue opens the supplied URL in this browser."
}

function renderTargetRows(request) {
  return request.target.map(({ label, value }) => row(label, value)).join("\n      ")
}

function renderDestinationRows(destination) {
  return [
    row("HTTPS destination origin", destination.origin),
    `<dt>Exact supplied URL (may contain private data)</dt>\n      <dd><code>${escapeHtml(destination.exactUrl)}</code></dd>`,
  ].join("\n      ")
}

function renderContextRows(context) {
  const rows = [
    row("What has already happened", context.whatHappened),
    row("What the destination step is intended to do", context.completionEffect),
  ]
  if (context.issueUrl) rows.push(linkRow("Issue", context.issueUrl))
  if (context.pullRequestUrl) rows.push(linkRow("Pull request", context.pullRequestUrl))
  return rows.join("\n      ")
}

function row(label, value) {
  return `<dt>${escapeHtml(label)}</dt>\n      <dd>${escapeHtml(value)}</dd>`
}

function linkRow(label, url) {
  return `<dt>${escapeHtml(label)}</dt>\n      <dd><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></dd>`
}

export default renderPreviewPage
