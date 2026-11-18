import assert from "node:assert/strict"
import test from "node:test"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const bin = path.join(root, "bin/github-review-thread")
const repository = "klondikemarlen/marlens-skills-rules-and-tools"

await test("when a repository is external, rejects it before any dry-run plan", () => {
  // Arrange
  const argumentsList = [
    bin,
    "resolve",
    "--repo",
    "evil/repo",
    "--pr",
    "456",
    "--comment-id",
    "123",
    "--reaction",
    "+1",
    "--dry-run",
  ]

  // Act
  const result = spawnSync(process.execPath, argumentsList, { cwd: root, encoding: "utf8" })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(
    result.stderr.trim(),
    "github-review-thread: Refusing external target: evil/repo != checkout repository klondikemarlen/marlens-skills-rules-and-tools"
  )
})

await test("when resolving in dry-run mode, requires the reaction gate", () => {
  // Arrange
  const argumentsList = [
    bin,
    "resolve",
    "--repo",
    repository,
    "--pr",
    "456",
    "--comment-id",
    "123",
    "--dry-run",
  ]

  // Act
  const result = spawnSync(process.execPath, argumentsList, { cwd: root, encoding: "utf8" })

  // Assert
  assert.equal(result.status, 1)
  assert.equal(
    result.stderr.trim(),
    "github-review-thread: resolve requires --reaction +1 or --reaction -1."
  )
})

await test("when feedback is accepted, previews the final verification operations", () => {
  // Arrange
  const argumentsList = [
    bin,
    "resolve",
    "--repo",
    repository,
    "--pr",
    "456",
    "--comment-id",
    "123",
    "--reaction",
    "+1",
    "--dry-run",
  ]

  // Act
  const result = spawnSync(process.execPath, argumentsList, { cwd: root, encoding: "utf8" })
  const output = JSON.parse(result.stdout)

  // Assert
  assert.equal(result.status, 0)
  assert.equal(output.reaction, "+1")
  assert.equal(output.plan.length, 8)
  assert.equal(output.plan.at(-1).query, "CheckReviewThreadResolved")
})

await test("when feedback is rejected, previews the matching reaction", () => {
  // Arrange
  const argumentsList = [
    bin,
    "resolve",
    "--repo",
    repository,
    "--pr",
    "456",
    "--comment-id",
    "123",
    "--reaction",
    "-1",
    "--dry-run",
  ]

  // Act
  const result = spawnSync(process.execPath, argumentsList, { cwd: root, encoding: "utf8" })
  const output = JSON.parse(result.stdout)

  // Assert
  assert.equal(output.plan[3].body.content, "-1")
})
