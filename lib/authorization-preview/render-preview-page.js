import escapeHtml from "escape-html"

export function renderPreviewPage(request, { path, ready, demo = false }) {
  const targetRows = renderTargetRows(request)
  const readiness = ready
    ? readyMessage(demo)
    : "Opening your browser… Please wait before continuing."

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review browser handoff</title>
  <style>
    :root { color-scheme: light dark; --page: #f4f6f8; --card: #fff; --ink: #17212e; --muted: #526071; --border: #d5dce4; --accent: #2456bd; }
    @media (prefers-color-scheme: dark) {
      :root { --page: #14181f; --card: #1e2530; --ink: #edf1f7; --muted: #b7c2d2; --border: #465264; --accent: #a9c5ff; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 2.5rem 1rem; background: var(--page); color: var(--ink); font: 1rem/1.5 system-ui, sans-serif; }
    main { max-width: 40rem; margin: 0 auto; padding: 2rem; background: var(--card); border: 1px solid var(--border); border-radius: 1rem; overflow-wrap: anywhere; }
    h1 { margin: 0 0 0.75rem; font-size: clamp(1.5rem, 4vw, 2rem); line-height: 1.2; text-wrap: balance; }
    p { margin: 0; white-space: pre-wrap; }
    .eyebrow { margin-bottom: 0.75rem; color: var(--muted); font-size: 0.875rem; font-weight: 600; }
    .intro { font-size: 1.125rem; }
    .reason { margin-top: 1rem; }
    dl { margin: 1rem 0 0; }
    dt { color: var(--muted); font-size: 0.875rem; }
    dd { margin: 0.2rem 0 1rem; white-space: pre-wrap; }
    .targets { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 0.5rem 1rem; padding: 1rem 0; border-block: 1px solid var(--border); }
    .targets dd { margin: 0; }
    .destination { margin-top: 1.25rem; color: var(--muted); font-size: 0.875rem; }
    .note { margin-top: 0.75rem; color: var(--muted); font-size: 0.875rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
    button { min-height: 2.75rem; padding: 0.65rem 1.1rem; border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
    #continue-button { background: var(--accent); border-color: var(--accent); color: var(--card); }
    button:disabled { opacity: 0.5; cursor: wait; }
    button:not(:disabled):hover { filter: brightness(0.9); }
    :focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
    details { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    summary { width: fit-content; min-height: 2.75rem; padding: 0.5rem 0; cursor: pointer; color: var(--accent); }
    a { color: var(--accent); }
    code { font-size: 0.875rem; }
    @media (max-width: 480px) {
      body { padding: 1rem 0.75rem; }
      main { padding: 1.25rem; }
      .targets { grid-template-columns: minmax(0, 1fr); gap: 0.2rem; }
      .targets dd:not(:last-child) { margin-bottom: 0.75rem; }
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">${demo ? "Demo only" : "A step for you"}</p>
    <h1>${escapeHtml(request.context.task)}</h1>
    <p class="intro">${escapeHtml(request.context.whatHappened)}</p>
    <p class="reason">${escapeHtml(request.reason)}</p>
    <dl class="targets">
      ${request.context.repository ? row("Project", request.context.repository) : ""}
      ${targetRows}
    </dl>
    <p class="destination">${escapeHtml(request.action)} · <strong>${escapeHtml(request.destination.origin)}</strong></p>
    <p class="note">Check the address before continuing. This page doesn't verify the website or whether it's safe to enter credentials.</p>
    <p class="note" id="handoff-status" role="status" aria-live="polite">${escapeHtml(readiness)}</p>
    <div class="actions">
      <form id="continue-form" action="${escapeHtml(`${path}/continue`)}" method="post">
        <button id="continue-button" type="submit"${ready ? "" : " disabled"}>${demo ? "Try Continue" : "Continue"}</button>
      </form>
      <form action="${escapeHtml(`${path}/cancel`)}" method="post">
        <button type="submit">Cancel</button>
      </form>
    </div>
    <details>
      <summary>Full address and request details</summary>
      <dl>
        <dt>Full address · may contain private information</dt>
        <dd><code>${escapeHtml(request.destination.exactUrl)}</code></dd>
        ${row("After the handoff", request.context.completionEffect)}
        ${row("From", request.context.agent)}
        ${request.context.issueUrl ? linkRow("Issue", request.context.issueUrl) : ""}
        ${request.context.pullRequestUrl ? linkRow("Pull request", request.context.pullRequestUrl) : ""}
      </dl>
    </details>
    <script src="${escapeHtml(`${path}/ui.js`)}" defer></script>
  </main>
</body>
</html>`
}

export function readyMessage(demo) {
  return demo
    ? "This demo stays here. No website will open."
    : "Continuing opens the website. It does not approve anything."
}

function renderTargetRows(request) {
  return request.target.map(({ label, value }) => row(label, value)).join("\n      ")
}

function row(label, value) {
  return `<dt>${escapeHtml(label)}</dt>\n      <dd>${escapeHtml(value)}</dd>`
}

function linkRow(label, url) {
  return `<dt>${escapeHtml(label)}</dt>\n      <dd><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></dd>`
}

export default renderPreviewPage
