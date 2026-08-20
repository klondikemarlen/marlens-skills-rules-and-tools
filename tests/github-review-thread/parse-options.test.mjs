import assert from "node:assert/strict"
import test from "node:test"

import { normalizeOptionName } from "../../lib/github-review-thread/normalize-option-name.js"
import { normalizeRepository } from "../../lib/github-review-thread/normalize-repository.js"
import { parseOptions } from "../../lib/github-review-thread/parse-options.js"
import { parseReaction } from "../../lib/github-review-thread/parse-reaction.js"

await test("when an option uses dashes, normalizes it to camel case", () => {
  // Arrange
  const optionName = "dry-run"

  // Act
  const normalizedOptionName = normalizeOptionName(optionName)

  // Assert
  assert.equal(normalizedOptionName, "dryRun")
})

await test("when options include values, parses each option", () => {
  // Arrange
  const argumentsList = ["--dry-run=false", "--repo", "OWNER/Repo", "--comment-id=42"]

  // Act
  const options = parseOptions(argumentsList)

  // Assert
  assert.deepEqual(options, {
    dryRun: false,
    repo: "OWNER/Repo",
    commentId: "42",
  })
})

await test("when a repository name has uppercase characters, normalizes it", () => {
  // Arrange
  const repository = "OWNER/Repo-ONE"

  // Act
  const normalizedRepository = normalizeRepository(repository)

  // Assert
  assert.equal(normalizedRepository, "owner/repo-one")
})

await test("when a resolve reaction is missing, rejects it", () => {
  // Arrange
  const options = {}

  // Act
  const parseMissingReaction = () => parseReaction(options)

  // Assert
  assert.throws(parseMissingReaction, /requires --reaction \+1 or --reaction -1/u)
})

await test("when feedback is rejected, accepts the rejection reaction", () => {
  // Arrange
  const options = { reaction: "-1" }

  // Act
  const reaction = parseReaction(options)

  // Assert
  assert.equal(reaction, "-1")
})
