import { calculateSnapshotId } from "./snapshot-id.js"

const SNAPSHOT_KEYS = [
  "version",
  "id",
  "repository",
  "capturedAt",
  "issue",
  "related",
  "labels",
  "metadata",
]
const ISSUE_KEYS = [
  "number",
  "url",
  "title",
  "body",
  "state",
  "updatedAt",
  "labels",
  "assignees",
  "comments",
]
const RELATED_KEYS = ["number", "url", "title", "body", "state", "updatedAt", "labels", "assignees"]
const COMMENT_KEYS = ["url", "body", "updatedAt"]
const METADATA_KEYS = [
  "searchExpression",
  "relatedLimit",
  "relatedTruncated",
  "commentsFetched",
  "commentsStored",
  "commentsTruncated",
  "commentsPages",
  "labelsFetched",
]
const ASSESSMENT_KEYS = [
  "version",
  "snapshotId",
  "summary",
  "workType",
  "readiness",
  "owner",
  "impact",
  "relationships",
  "questions",
  "nextAction",
  "evidence",
]
const RELATIONSHIP_TYPES = new Set(["duplicate", "related", "blocks", "blocked-by"])
const WORK_TYPES = new Set(["bug", "feature", "task", "documentation", "question", "unknown"])
const READINESS = new Set(["ready", "needs-info", "needs-breakdown", "blocked", "human-decision"])
const NEXT_ACTIONS = new Set([
  "clarify",
  "investigate",
  "implement",
  "link",
  "defer",
  "propose-closure",
])
const HASH_PATTERN = /^[a-f0-9]{64}$/
const REPOSITORY_PATTERN = /^[a-z0-9][a-z0-9-]{0,38}\/[a-z0-9][a-z0-9._-]{0,99}$/

function fail(message) {
  throw new Error(message)
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function requireRecord(value, name) {
  if (!isRecord(value)) fail(`${name} must be a JSON object.`)
  return value
}

function requireExactKeys(value, expectedKeys, name) {
  const actualKeys = Object.keys(value).sort()
  const allowedKeys = [...expectedKeys].sort()
  const unknownKeys = actualKeys.filter((key) => !allowedKeys.includes(key))
  const missingKeys = allowedKeys.filter((key) => !actualKeys.includes(key))

  if (unknownKeys.length) fail(`${name} contains unknown field(s): ${unknownKeys.join(", ")}.`)
  if (missingKeys.length) fail(`${name} is missing field(s): ${missingKeys.join(", ")}.`)
}

function requireText(value, name, maximumLength = 10000) {
  if (typeof value !== "string") fail(`${name} must be a string.`)
  if (value.length > maximumLength) fail(`${name} exceeds ${maximumLength} characters.`)
}

function requireStringList(value, name) {
  if (!Array.isArray(value)) fail(`${name} must be an array of strings.`)
  value.forEach((item, index) => requireText(item, `${name}[${index}]`, 1000))
}

function requireTimestamp(value, name) {
  requireText(value, name, 100)
  if (Number.isNaN(Date.parse(value))) fail(`${name} must be a valid timestamp.`)
}

function validateRepository(repository) {
  requireText(repository, "snapshot.repository", 140)
  if (!REPOSITORY_PATTERN.test(repository)) fail("snapshot.repository must be OWNER/REPO.")
}

function validateGitHubIssueUrl(value, repository, number, name, commentAllowed = false) {
  requireText(value, name, 500)
  let url
  try {
    url = new URL(value)
  } catch {
    fail(`${name} must be a GitHub issue URL.`)
  }

  const [owner, repo, resource, issueNumber, ...extra] = url.pathname.split("/").filter(Boolean)
  const pathMatches =
    url.protocol === "https:" &&
    url.hostname === "github.com" &&
    !url.username &&
    !url.password &&
    !url.search &&
    owner?.toLowerCase() === repository.split("/")[0] &&
    repo?.toLowerCase() === repository.split("/")[1] &&
    resource === "issues" &&
    issueNumber === String(number) &&
    extra.length === 0
  const fragmentMatches = commentAllowed
    ? url.hash === "" || /^#issuecomment-\d+$/.test(url.hash)
    : url.hash === ""

  if (!pathMatches || !fragmentMatches)
    fail(`${name} must refer to issue #${number} in ${repository}.`)
}

function validateIssueMetadata(issue, repository, name, includeComments) {
  requireRecord(issue, name)
  const hasComments = includeComments || Object.hasOwn(issue, "comments")
  requireExactKeys(issue, hasComments ? ISSUE_KEYS : RELATED_KEYS, name)

  if (!Number.isSafeInteger(issue.number) || issue.number < 1)
    fail(`${name}.number must be a positive integer.`)
  validateGitHubIssueUrl(issue.url, repository, issue.number, `${name}.url`)
  requireText(issue.title, `${name}.title`, 1000)
  requireText(issue.body, `${name}.body`, 1000000)
  requireText(issue.state, `${name}.state`, 20)
  if (!["open", "closed"].includes(issue.state.toLowerCase()))
    fail(`${name}.state must identify an open or closed issue.`)
  requireTimestamp(issue.updatedAt, `${name}.updatedAt`)
  requireStringList(issue.labels, `${name}.labels`)
  requireStringList(issue.assignees, `${name}.assignees`)

  if (includeComments || Object.hasOwn(issue, "comments")) {
    if (!Array.isArray(issue.comments)) fail(`${name}.comments must be an array.`)
    issue.comments.forEach((comment, index) => {
      const commentName = `${name}.comments[${index}]`
      requireRecord(comment, commentName)
      requireExactKeys(comment, COMMENT_KEYS, commentName)
      validateGitHubIssueUrl(comment.url, repository, issue.number, `${commentName}.url`, true)
      if (!comment.url.includes("#issuecomment-"))
        fail(`${commentName}.url must identify a comment.`)
      requireText(comment.body, `${commentName}.body`, 1000000)
      requireTimestamp(comment.updatedAt, `${commentName}.updatedAt`)
    })
  }
}

function validateMetadata(metadata, issue, labels, relatedCount, repository) {
  requireRecord(metadata, "snapshot.metadata")
  requireExactKeys(metadata, METADATA_KEYS, "snapshot.metadata")

  if (metadata.searchExpression !== null) {
    requireText(metadata.searchExpression, "snapshot.metadata.searchExpression", 1000)
    if (!metadata.searchExpression.startsWith(`repo:${repository} is:issue `))
      fail("snapshot.metadata.searchExpression must be scoped to this repository's issues.")
  }
  if (metadata.relatedLimit !== 10) fail("snapshot.metadata.relatedLimit must be 10.")
  if (typeof metadata.relatedTruncated !== "boolean")
    fail("snapshot.metadata.relatedTruncated must be a boolean.")
  for (const key of ["commentsFetched", "commentsStored", "commentsPages", "labelsFetched"]) {
    if (!Number.isSafeInteger(metadata[key]) || metadata[key] < 0)
      fail(`snapshot.metadata.${key} must be a non-negative integer.`)
  }
  if (metadata.commentsStored !== issue.comments.length)
    fail("snapshot.metadata.commentsStored must match the stored comment count.")
  if (metadata.commentsFetched !== metadata.commentsStored)
    fail("snapshot metadata must contain every fetched comment.")
  if (metadata.commentsTruncated !== false)
    fail("snapshot.metadata.commentsTruncated must be false when comments are complete.")
  if (metadata.commentsPages < 1)
    fail("snapshot.metadata.commentsPages must record comment pagination.")
  if (metadata.labelsFetched < labels.length)
    fail("snapshot.metadata.labelsFetched cannot be less than the label vocabulary.")
  if (metadata.searchExpression === null && (relatedCount !== 0 || metadata.relatedTruncated))
    fail("A snapshot without a search expression cannot include related issues.")
  if (metadata.relatedTruncated && relatedCount !== metadata.relatedLimit)
    fail("A truncated related issue list must contain exactly relatedLimit entries.")
}

export function validateSnapshot(snapshot) {
  requireRecord(snapshot, "snapshot")
  requireExactKeys(snapshot, SNAPSHOT_KEYS, "snapshot")
  if (snapshot.version !== 1) fail("snapshot.version must be 1.")
  if (!HASH_PATTERN.test(snapshot.id)) fail("snapshot.id must be a lowercase SHA-256 hash.")
  validateRepository(snapshot.repository)
  requireTimestamp(snapshot.capturedAt, "snapshot.capturedAt")
  validateIssueMetadata(snapshot.issue, snapshot.repository, "snapshot.issue", true)
  if (!Array.isArray(snapshot.related)) fail("snapshot.related must be an array.")
  if (snapshot.related.length > 10) fail("snapshot.related cannot contain more than 10 issues.")

  const relatedNumbers = new Set()
  snapshot.related.forEach((issue, index) => {
    const name = `snapshot.related[${index}]`
    validateIssueMetadata(issue, snapshot.repository, name, false)
    if (issue.number === snapshot.issue.number)
      fail("snapshot.related cannot include the primary issue.")
    if (relatedNumbers.has(issue.number)) fail("snapshot.related cannot contain duplicate issues.")
    relatedNumbers.add(issue.number)
  })

  requireStringList(snapshot.labels, "snapshot.labels")
  if (new Set(snapshot.labels).size !== snapshot.labels.length)
    fail("snapshot.labels cannot contain duplicate vocabulary entries.")
  const vocabulary = new Set(snapshot.labels)
  for (const issue of [snapshot.issue, ...snapshot.related]) {
    for (const label of issue.labels) {
      if (!vocabulary.has(label))
        fail(`Issue label ${JSON.stringify(label)} is missing from snapshot.labels.`)
    }
  }
  validateMetadata(
    snapshot.metadata,
    snapshot.issue,
    snapshot.labels,
    snapshot.related.length,
    snapshot.repository
  )

  if (calculateSnapshotId(snapshot) !== snapshot.id)
    fail("Snapshot id does not match its contents (stale or tampered snapshot).")
  return snapshot
}

function validateImpact(impact) {
  requireRecord(impact, "assessment.impact")
  requireExactKeys(impact, ["severity", "priority", "reason"], "assessment.impact")
  if (impact.severity !== null) requireText(impact.severity, "assessment.impact.severity", 200)
  if (impact.priority !== null) requireText(impact.priority, "assessment.impact.priority", 200)
  requireText(impact.reason, "assessment.impact.reason", 1000)
}

function validateRelationships(relationships, snapshot) {
  if (!Array.isArray(relationships)) fail("assessment.relationships must be an array.")
  const relatedUrls = new Set(snapshot.related.map((issue) => issue.url))
  relationships.forEach((relationship, index) => {
    const name = `assessment.relationships[${index}]`
    requireRecord(relationship, name)
    requireExactKeys(relationship, ["type", "url", "reason"], name)
    if (!RELATIONSHIP_TYPES.has(relationship.type)) fail(`${name}.type is not supported.`)
    if (!relatedUrls.has(relationship.url))
      fail(`${name}.url must refer to a supplied related issue.`)
    requireText(relationship.reason, `${name}.reason`, 1000)
  })
}

function validateEvidence(evidence, snapshot) {
  if (!Array.isArray(evidence) || evidence.length === 0)
    fail("assessment.evidence must be a non-empty array of supplied snapshot URLs.")
  const suppliedUrls = new Set([snapshot.issue.url])
  for (const comment of snapshot.issue.comments) suppliedUrls.add(comment.url)
  for (const related of snapshot.related) {
    suppliedUrls.add(related.url)
    for (const comment of related.comments ?? []) suppliedUrls.add(comment.url)
  }
  evidence.forEach((url, index) => {
    requireText(url, `assessment.evidence[${index}]`, 500)
    if (!suppliedUrls.has(url))
      fail(`assessment.evidence[${index}] is not present in the snapshot.`)
  })
}

export function validateAssessment(snapshot, assessment) {
  validateSnapshot(snapshot)
  requireRecord(assessment, "assessment")
  requireExactKeys(assessment, ASSESSMENT_KEYS, "assessment")
  if (assessment.version !== 1) fail("assessment.version must be 1.")
  if (assessment.snapshotId !== snapshot.id)
    fail("Assessment is stale: snapshotId does not match the snapshot.")
  requireText(assessment.summary, "assessment.summary", 2000)
  if (assessment.summary.trim().length === 0) fail("assessment.summary cannot be empty.")
  if (!WORK_TYPES.has(assessment.workType)) fail("assessment.workType is not supported.")
  if (!READINESS.has(assessment.readiness)) fail("assessment.readiness is not supported.")
  if (assessment.owner !== null) {
    requireText(assessment.owner, "assessment.owner", 140)
    validateRepository(assessment.owner)
  }

  validateImpact(assessment.impact)
  validateRelationships(assessment.relationships, snapshot)
  if (assessment.relationships.length > 20)
    fail("assessment.relationships cannot contain more than 20 entries.")
  requireStringList(assessment.questions, "assessment.questions")
  if (assessment.questions.length > 20)
    fail("assessment.questions cannot contain more than 20 entries.")
  if (assessment.questions.some((question) => question.trim().length === 0))
    fail("assessment.questions cannot contain empty questions.")
  if (assessment.readiness === "needs-info" && assessment.questions.length === 0)
    fail("assessment.readiness needs-info requires at least one question.")

  requireRecord(assessment.nextAction, "assessment.nextAction")
  requireExactKeys(assessment.nextAction, ["action", "reason"], "assessment.nextAction")
  if (!NEXT_ACTIONS.has(assessment.nextAction.action))
    fail("assessment.nextAction.action is not supported.")
  requireText(assessment.nextAction.reason, "assessment.nextAction.reason", 1000)
  if (assessment.nextAction.action === "implement") {
    if (assessment.readiness !== "ready") fail("nextAction implement requires readiness ready.")
    if (assessment.workType === "unknown") fail("nextAction implement requires a known workType.")
    if (assessment.owner?.toLowerCase() !== snapshot.repository)
      fail("nextAction implement requires owner to be the current repository.")
  }

  validateEvidence(assessment.evidence, snapshot)
  if (assessment.evidence.length > 100)
    fail("assessment.evidence cannot contain more than 100 entries.")
  return assessment
}
