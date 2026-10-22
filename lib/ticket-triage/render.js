import { validateAssessment } from "./validate.js"

function renderText(value) {
  const flattened = String(value)
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/@/gu, "@\u200b")
    .replace(/[&<>]/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character])
    .replace(/([\\`*_{}\[\]()#+\-.!|>~])/gu, "\\$1")
    .replace(/\s+/gu, " ")
    .trim()
  return flattened
}

function renderList(items, formatItem) {
  if (items.length === 0) return "- None supplied."
  return items.map((item) => `- ${formatItem(item)}`).join("\n")
}

function renderUrl(url) {
  return `<${url}>`
}

export function renderAssessment(snapshot, assessment) {
  validateAssessment(snapshot, assessment)

  const issue = snapshot.issue
  const lines = [
    `> **Advisory only:** This assessment is tied to snapshot \`${snapshot.id}\`. It is not a live-state check or authorization to change GitHub.`,
    "",
    `# Ticket Triage: #${issue.number} — ${renderText(issue.title)}`,
    "",
    `- Repository: ${renderText(snapshot.repository)}`,
    `- Captured: ${renderText(snapshot.capturedAt)}`,
    `- Related search: ${snapshot.metadata.searchExpression === null ? "Not performed (no searchable terms)" : renderText(snapshot.metadata.searchExpression)}`,
    `- Context: ${snapshot.issue.comments.length} comments; ${snapshot.related.length} related issues (limit ${snapshot.metadata.relatedLimit})${snapshot.metadata.relatedTruncated ? "; additional matches omitted" : ""}. Search matches are candidates, not established relationships.`,
    `- State: ${renderText(issue.state)}`,
    `- Readiness: ${renderText(assessment.readiness)}`,
    `- Work type: ${renderText(assessment.workType)}`,
    `- Proposed owner: ${assessment.owner === null ? "Unknown" : renderText(assessment.owner)}`,
    `- Labels: ${issue.labels.length ? issue.labels.slice(0, 20).map(renderText).join(", ") : "None"}${issue.labels.length > 20 ? `; ${issue.labels.length - 20} more omitted` : ""}`,
    "",
    "## Summary",
    "",
    renderText(assessment.summary),
    "",
    "## Impact",
    "",
    `- Severity: ${assessment.impact.severity === null ? "Not assessed" : renderText(assessment.impact.severity)}`,
    `- Priority: ${assessment.impact.priority === null ? "Not assessed" : renderText(assessment.impact.priority)}`,
    `- Rationale: ${renderText(assessment.impact.reason)}`,
    "",
    "## Proposed Next Action",
    "",
    `- ${renderText(assessment.nextAction.action)}: ${renderText(assessment.nextAction.reason)}`,
    "",
    "## Questions",
    "",
    renderList(assessment.questions, renderText),
    "",
    "## Relationships",
    "",
    renderList(assessment.relationships, (relationship) => {
      const related = snapshot.related.find((candidate) => candidate.url === relationship.url)
      return `${renderText(relationship.type)} — ${renderUrl(relationship.url)} — ${renderText(related.title)}: ${renderText(relationship.reason)}`
    }),
    "",
    "## Evidence",
    "",
    assessment.evidence.map((url) => `- ${renderUrl(url)}`).join("\n"),
  ]

  return `${lines.join("\n")}\n`
}
