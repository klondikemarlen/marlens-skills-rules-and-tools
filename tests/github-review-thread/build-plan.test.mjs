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

await test("orders resolve dry-run operations around the reaction gate", async () => {
  const plan = await buildPlan(
    "resolve",
    "owner/repo",
    123,
    { pr: 456, reaction: "+1" },
    "owner",
    "repo"
  )

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

await test("includes literal reply content in a dry-run plan", async () => {
  const plan = await buildPlan("reply", "owner/repo", 123, { pr: 456, bodyFile }, "owner", "repo")

  assert.equal(plan[0].body.body, "Addressed in abc123.\n")
})
