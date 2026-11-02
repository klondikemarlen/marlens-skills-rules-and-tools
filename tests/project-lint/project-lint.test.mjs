import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { ESLint } from "eslint"

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url))

test("when a Node command has no extension, lint rejects unresolved identifiers", async () => {
  // Arrange
  const eslint = new ESLint({ cwd: repositoryRoot, fix: false })
  const source = "#!/usr/bin/env node\nconsole.log(missingCommandValue)\n"

  // Act
  const results = await eslint.lintText(source, { filePath: "bin/lint-coverage-probe" })

  // Assert
  assert.deepEqual(
    results.flatMap((result) => result.messages.map((message) => message.ruleId)),
    ["no-undef"]
  )
})
