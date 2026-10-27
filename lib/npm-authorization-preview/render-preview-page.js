const OPERATION_LABELS = {
  login: "Sign in to npm",
  publish: "Submit a publication to npm",
  "staged-publication-approval": "Approve an already-staged publication",
}

export function renderPreviewPage(request, { path, ready }) {
  const targetRows = renderTargetRows(request)
  const destinationRows = renderDestinationRows(request.destination)
  const contextRows = renderContextRows(request.context)
  const readiness = ready
    ? "Ready. Continue opens the supplied npm URL in this browser."
    : "Waiting for the normal-browser opener. Continue is unavailable until it succeeds."

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review npm authorization handoff</title>
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
    <h1>Review before continuing to npm</h1>
    <p class="notice"><strong>Agent-provided context.</strong> This local preview does not independently verify npm's identity, permission scope, challenge, or approval request. npm handles sign-in and any final approval.</p>
    <h2>${escapeHtml(OPERATION_LABELS[request.operation])}</h2>
    <dl>
      ${targetRows}
      ${destinationRows}
      <dt>Why this is needed</dt>
      <dd>${escapeHtml(request.reason)}</dd>
      <dt>Requesting agent</dt>
      <dd>${escapeHtml(request.context.agent)}</dd>
      <dt>Repository</dt>
      <dd>${escapeHtml(request.context.repository)}</dd>
      <dt>Task</dt>
      <dd>${escapeHtml(request.context.task)}</dd>
      ${contextRows}
    </dl>
    <p id="handoff-status" role="status" aria-live="polite">${escapeHtml(readiness)}</p>
    <div class="actions">
      <form id="continue-form" action="${escapeHtml(`${path}/continue`)}" method="post">
        <button id="continue-button" type="submit"${ready ? "" : " disabled"}>Continue to npm</button>
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

function renderTargetRows(request) {
  const target = request.target
  if (request.operation === "login")
    return [
      row("Account", target.account ?? "Not supplied"),
      row("Requested permissions", target.permissions ?? "Not supplied"),
      ...(target.description ? [row("Sign-in target", target.description)] : []),
    ].join("\n      ")

  return [
    row("Package", target.package),
    row("Version", target.version),
    row("Registry", target.registry ?? "Not supplied"),
    row("Dist-tag", target.tag ?? "Not supplied"),
    row("Prepared artifact", target.artifact ?? "Not supplied"),
  ].join("\n      ")
}
function renderDestinationRows(destination) {
  return [
    row("HTTPS destination origin", destination.origin),
    `<dt>Exact supplied npm URL (contains private challenge data)</dt>\n      <dd><code>${escapeHtml(destination.exactUrl)}</code></dd>`,
  ].join("\n      ")
}

function renderContextRows(context) {
  const rows = [
    row("What has already happened", context.whatHappened),
    row("What completing npm's step will permit", context.completionEffect),
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

function escapeHtml(value) {
  return value.replace(/[&<>"']/gu, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

export default renderPreviewPage
