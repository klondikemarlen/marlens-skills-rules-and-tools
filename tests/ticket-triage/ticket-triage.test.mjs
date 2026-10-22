import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { calculateSnapshotId } from "../../lib/ticket-triage/snapshot-id.js"
import { renderAssessment } from "../../lib/ticket-triage/render.js"
import { createSnapshot, parseIssueNumber } from "../../lib/ticket-triage/snapshot.js"
import { validateAssessment, validateSnapshot } from "../../lib/ticket-triage/validate.js"

const REPOSITORY = "owner/project"
const PRIMARY_NUMBER = 7
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const executable = path.join(root, "bin/ticket-triage")
const timestamp = "2026-10-20T12:00:00Z"

function issue(number, overrides = {}) {
  return {
    number,
    html_url: `https://github.com/${REPOSITORY}/issues/${number}`,
    repository_url: `https://api.github.com/repos/${REPOSITORY}`,
    title: number === PRIMARY_NUMBER ? "Fix navigation routing" : "Improve navigation behavior",
    body: `Private issue body ${number}`,
    state: "open",
    updated_at: timestamp,
    labels: [{ name: number === PRIMARY_NUMBER ? "bug" : "feature" }],
    assignees: [],
    ...overrides,
  }
}

function comment(number = PRIMARY_NUMBER, id = 70, body = "First comment") {
  return {
    html_url: `https://github.com/${REPOSITORY}/issues/${number}#issuecomment-${id}`,
    body,
    updated_at: timestamp,
  }
}

function makeReadTransport({
  primary = issue(PRIMARY_NUMBER),
  comments = [comment()],
  related = [issue(9)],
  labelPages,
} = {}) {
  const repositoryLabels = labelPages ?? [[{ name: "bug" }], [{ name: "feature" }]]
  return async (endpoint) => {
    if (endpoint === `repos/${REPOSITORY}/issues/${PRIMARY_NUMBER}`) return primary
    if (endpoint.endsWith(`/issues/${PRIMARY_NUMBER}/comments?per_page=100`)) return [comments]
    if (endpoint.endsWith(`/labels?per_page=100`)) return repositoryLabels
    if (endpoint.startsWith("search/issues?")) {
      return {
        total_count: related.length + 1,
        items: [primary, ...related],
      }
    }
    throw new Error(`Unexpected fake read route: ${endpoint}`)
  }
}

async function makeSnapshot(options = {}) {
  return createSnapshot({
    repository: REPOSITORY,
    issueNumber: PRIMARY_NUMBER,
    read: makeReadTransport(options),
    ...options.createOptions,
  })
}

function assessmentFor(snapshot) {
  const relatedIssue = snapshot.related[0]
  const commentUrl = snapshot.issue.comments[0]?.url
  return {
    version: 1,
    snapshotId: snapshot.id,
    summary: "Navigation behavior should be clarified before a focused fix.",
    workType: "bug",
    readiness: "ready",
    owner: REPOSITORY,
    impact: {
      severity: "medium",
      priority: "p2",
      reason: "The behavior is visible to users.",
    },
    relationships: relatedIssue
      ? [{ type: "related", url: relatedIssue.url, reason: "Both tickets discuss navigation." }]
      : [],
    questions: [],
    nextAction: { action: "implement", reason: "The request is sufficiently clear." },
    evidence: [snapshot.issue.url, ...(commentUrl ? [commentUrl] : [])],
  }
}

test("when snapshot capture reads paginated context, it preserves complete comments and bounded related issues", async () => {
  // Arrange
  const firstComment = comment(PRIMARY_NUMBER, 70, "Page one comment")
  const secondComment = comment(PRIMARY_NUMBER, 71, "Page two comment")
  const related = [issue(9)]
  const read = async (endpoint) => {
    if (endpoint === `repos/${REPOSITORY}/issues/${PRIMARY_NUMBER}`) return issue(PRIMARY_NUMBER)
    if (endpoint.endsWith(`/issues/${PRIMARY_NUMBER}/comments?per_page=100`))
      return [[firstComment], [secondComment]]
    if (endpoint.endsWith(`/labels?per_page=100`)) return [[{ name: "bug" }], [{ name: "feature" }]]
    if (endpoint.startsWith("search/issues?"))
      return { total_count: 2, items: [issue(PRIMARY_NUMBER), ...related] }
    throw new Error("Unexpected fake read route.")
  }

  // Act
  const snapshot = await createSnapshot({ repository: REPOSITORY, issueNumber: "7", read })

  // Assert
  assert.deepEqual(
    snapshot.issue.comments.map(({ body }) => body),
    ["Page one comment", "Page two comment"]
  )
  assert.deepEqual(snapshot.labels, ["bug", "feature"])
  assert.deepEqual(
    snapshot.related.map(({ number }) => number),
    [9]
  )
  assert.equal(snapshot.metadata.commentsPages, 2)
  assert.equal(snapshot.metadata.commentsFetched, 2)
  assert.equal(snapshot.metadata.commentsStored, 2)
  assert.equal(snapshot.metadata.commentsTruncated, false)
  assert.equal(snapshot.metadata.relatedLimit, 10)
  assert.equal(snapshot.metadata.relatedTruncated, false)
  assert.equal(snapshot.id, calculateSnapshotId(snapshot))
})

test("when only capture time changes, the content id stays stable but current content changes it", async () => {
  // Arrange
  const original = await makeSnapshot()
  const recaptured = structuredClone(original)
  recaptured.capturedAt = "2026-10-21T00:00:00Z"
  const changedComment = await makeSnapshot({
    comments: [comment(PRIMARY_NUMBER, 70, "Edited comment")],
  })
  const changedMetadata = structuredClone(original)
  changedMetadata.metadata.labelsFetched += 1

  // Act
  const captureTimeId = calculateSnapshotId(recaptured)
  changedMetadata.id = calculateSnapshotId(changedMetadata)

  // Assert
  assert.equal(captureTimeId, original.id)
  assert.notEqual(changedComment.id, original.id)
  assert.notEqual(changedMetadata.id, original.id)
})

test("when a snapshot is edited without a matching hash, validation rejects stale and tampered data", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const tamperedSnapshot = structuredClone(snapshot)
  tamperedSnapshot.issue.body = "Changed without updating the id"
  const outdatedAssessment = assessmentFor(snapshot)
  const newerSnapshot = await makeSnapshot({
    comments: [comment(PRIMARY_NUMBER, 70, "Updated comment")],
  })

  // Act / Assert
  assert.throws(() => validateSnapshot(tamperedSnapshot), /id does not match its contents/)
  assert.throws(() => validateAssessment(newerSnapshot, outdatedAssessment), /Assessment is stale/)
})

test("when an assessment cites missing tickets or evidence, validation rejects the invented references", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const inventedEvidence = assessmentFor(snapshot)
  inventedEvidence.evidence = ["https://github.com/owner/project/issues/999"]
  const inventedRelationship = assessmentFor(snapshot)
  inventedRelationship.relationships[0].url = snapshot.issue.url

  // Act / Assert
  assert.throws(() => validateAssessment(snapshot, inventedEvidence), /not present in the snapshot/)
  assert.throws(() => validateAssessment(snapshot, inventedRelationship), /supplied related issue/)
})

test("when readiness needs information, a question is required", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const assessment = assessmentFor(snapshot)
  assessment.readiness = "needs-info"
  assessment.questions = []
  assessment.nextAction = { action: "clarify", reason: "Ask for the missing detail." }

  // Act / Assert
  assert.throws(
    () => validateAssessment(snapshot, assessment),
    /needs-info requires at least one question/
  )
})

test("when implementation is proposed, readiness, work type, and owner must all permit it", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const assessment = assessmentFor(snapshot)
  const blocked = structuredClone(assessment)
  blocked.readiness = "blocked"
  const unknownType = structuredClone(assessment)
  unknownType.workType = "unknown"
  const wrongOwner = structuredClone(assessment)
  wrongOwner.owner = "other/repository"

  // Act / Assert
  assert.throws(() => validateAssessment(snapshot, blocked), /implement requires readiness ready/)
  assert.throws(
    () => validateAssessment(snapshot, unknownType),
    /implement requires a known workType/
  )
  assert.throws(
    () => validateAssessment(snapshot, wrongOwner),
    /owner to be the current repository/
  )
})

test("when rendering untrusted assessment text, it stays compact and visibly advisory", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const assessment = assessmentFor(snapshot)
  assessment.summary = "First line\n## injected link [open](javascript:alert(1)) @everyone"

  // Act
  const markdown = renderAssessment(snapshot, assessment)

  // Assert
  assert.match(markdown, /> \*\*Advisory only:\*\*/)
  assert.match(markdown, /@\u200beveryone/)
  assert.doesNotMatch(markdown, /^## injected link/m)
  assert.ok(markdown.includes("\\[open\\]\\(javascript:"))
  assert.doesNotMatch(markdown, /Private issue body/)
  assert.match(markdown, /https:\/\/github\.com\/owner\/project\/issues\/7/)
})

test("when the requested number is a pull request, snapshot capture reports that distinction", async () => {
  // Arrange
  const pullRequest = issue(PRIMARY_NUMBER, {
    html_url: `https://github.com/${REPOSITORY}/pull/${PRIMARY_NUMBER}`,
    pull_request: { url: "https://api.github.com/repos/owner/project/pulls/7" },
  })
  const read = async () => pullRequest

  // Act / Assert
  await assert.rejects(
    createSnapshot({ repository: REPOSITORY, issueNumber: "7", read }),
    /pull request, not an issue/
  )
})

test("when related search returns a non-canonical same-repository URL, capture fails closed", async () => {
  // Arrange
  const invalidRelated = issue(9, { html_url: "https://github.com.evil/owner/project/issues/9" })
  const read = makeReadTransport({ related: [invalidRelated] })

  // Act / Assert
  await assert.rejects(
    createSnapshot({ repository: REPOSITORY, issueNumber: "7", read }),
    /non-canonical issue URL/
  )
})

test("when users provide invalid repository, issue, or search input, parsing rejects it", async () => {
  // Arrange
  const invalidNumbers = ["0", "-2", "1.5", "01", "999999999999"]

  // Act / Assert
  for (const number of invalidNumbers)
    assert.throws(() => parseIssueNumber(number), /positive whole-number/)
  await assert.rejects(
    createSnapshot({ repository: "owner/other?repo", issueNumber: "7", read: makeReadTransport() }),
    /valid GitHub repository/
  )
  await assert.rejects(
    createSnapshot({
      repository: REPOSITORY,
      issueNumber: "7",
      search: "repo:elsewhere OR is:pr",
      read: makeReadTransport(),
    }),
    /plain words only/
  )
})

test("when validate and render commands are run offline, both consume local JSON only", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const assessment = assessmentFor(snapshot)
  const directory = await mkdtemp(path.join(os.tmpdir(), "ticket-triage-"))
  const snapshotFile = path.join(directory, "snapshot.json")
  const assessmentFile = path.join(directory, "assessment.json")
  await writeFile(snapshotFile, JSON.stringify(snapshot))
  await writeFile(assessmentFile, JSON.stringify(assessment))

  // Act
  const validation = spawnSync(
    process.execPath,
    [executable, "validate", "--snapshot", snapshotFile, "--assessment", assessmentFile],
    { cwd: root, encoding: "utf8" }
  )
  const rendering = spawnSync(
    process.execPath,
    [executable, "render", "--snapshot", snapshotFile, "--assessment", assessmentFile],
    { cwd: root, encoding: "utf8" }
  )

  // Assert
  try {
    assert.equal(validation.status, 0, validation.stderr)
    assert.equal(JSON.parse(validation.stdout).valid, true)
    assert.equal(rendering.status, 0, rendering.stderr)
    assert.match(rendering.stdout, /Advisory only/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("when GitHub search is incomplete, capture rejects misleading partial context", async () => {
  // Arrange
  const readComplete = makeReadTransport()
  const read = async (endpoint, options) => {
    const response = await readComplete(endpoint, options)
    if (endpoint.startsWith("search/issues?")) return { ...response, incomplete_results: true }

    return response
  }

  // Act / Assert
  await assert.rejects(
    createSnapshot({ repository: REPOSITORY, issueNumber: "7", read }),
    /issue search was incomplete/
  )
})

test("when the title contains punctuation, capture still searches for related issues", async () => {
  // Arrange
  const primary = issue(PRIMARY_NUMBER, { title: "Navigation: wrong-route failure!" })
  const read = makeReadTransport({ primary })

  // Act
  const snapshot = await createSnapshot({ repository: REPOSITORY, issueNumber: "7", read })

  // Assert
  assert.equal(
    snapshot.metadata.searchExpression,
    'repo:owner/project is:issue "Navigation" "wrong" "route" "failure"'
  )
})

test("when JSON object keys are reordered, the same content still validates", async () => {
  // Arrange
  const snapshot = await makeSnapshot()
  const reordered = Object.fromEntries(Object.entries(snapshot).reverse())
  reordered.issue = Object.fromEntries(Object.entries(snapshot.issue).reverse())

  // Act
  const result = validateAssessment(reordered, assessmentFor(snapshot))

  // Assert
  assert.equal(result.snapshotId, snapshot.id)
})
