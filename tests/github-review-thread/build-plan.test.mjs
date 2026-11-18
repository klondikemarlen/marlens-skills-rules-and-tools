import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { buildPlan } from "../../lib/github-review-thread/build-plan.js"
import { reviewCommentReactionEndpoint } from "../../lib/github-review-thread/review-comment-reaction-endpoint.js"

const temp = await mkdtemp(path.join(os.tmpdir(), "github-review-thread-plan-test-"))
const bodyFile = path.join(temp, "reply.md")
await writeFile(bodyFile, "Addressed in abc123.\n")

test.after(async () => {
  await rm(temp, { recursive: true, force: true })
})

await test("when resolving in dry-run mode, orders operations around the reaction gate", async () => {
  // Arrange
  const options = { pr: 456, reaction: "+1" }

  // Act
  const plan = await buildPlan("resolve", "owner/repo", 123, options, "owner", "repo")

  // Assert
  assert.deepEqual(
    plan.map((step) => step.query ?? step.endpoint),
    [
      "LocateReviewThread",
      "user",
      `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=<n>`,
      reviewCommentReactionEndpoint("owner/repo", 123),
      `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=<n>`,
      "ResolveReviewThread",
      `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=<n>`,
      "CheckReviewThreadResolved",
    ]
  )
})

await test("when a reply body file is provided, includes its literal content in the dry-run plan", async () => {
  // Arrange
  const options = { pr: 456, bodyFile }

  // Act
  const plan = await buildPlan("reply", "owner/repo", 123, options, "owner", "repo")

  // Assert
  assert.equal(plan[0].body.body, "Addressed in abc123.\n")
})

await test("when a reply body is inline, rejects the unsafe dry-run input", async () => {
  // Arrange
  const options = { pr: 456, body: "Inline reply" }

  // Act / Assert
  await assert.rejects(
    buildPlan("reply", "owner/repo", 123, options, "owner", "repo"),
    /reply rejects inline --body/u
  )
})
