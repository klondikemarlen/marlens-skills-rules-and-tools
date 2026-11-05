import assert from "node:assert/strict"
import test from "node:test"

import { runCli } from "../../lib/github-reviewed-files/run-cli.js"
import { githubFixture, HEAD } from "./github-fixture.mjs"

const argumentsFor = (...extra) => [
  "--repo",
  "owner/repo",
  "--pr",
  "42",
  "--viewer",
  "maintainer",
  "--head",
  HEAD,
  "--path",
  "removed test.js",
  ...extra,
]

function outputCapture() {
  const output = []
  const errors = []
  return {
    output,
    errors,
    dependencies: {
      output: (message) => output.push(message),
      errorOutput: (message) => errors.push(message),
      authenticate: () => "existing-auth-token",
    },
  }
}

test("when marking is not requested, inspection preserves markers until explicitly enabled", async () => {
  // Arrange
  const { state, graphql } = githubFixture()
  const capture = outputCapture()
  const dependencies = { ...capture.dependencies, graphql }
  // Act
  const inspected = await runCli(argumentsFor(), {}, dependencies)
  const dryRun = JSON.parse(capture.output[0])

  // Assert
  assert.equal(inspected, 0)
  assert.equal(dryRun.dryRun, true)
  assert.equal(dryRun.files[0].outcome, "wouldMark")
  assert.deepEqual(state.writes, [])

  // Act
  const marked = await runCli(argumentsFor("--mark-viewed"), {}, dependencies)
  const mutation = JSON.parse(capture.output[1])
  // Assert
  assert.equal(marked, 0)
  assert.equal(mutation.dryRun, false)
  assert.equal(mutation.files[0].outcome, "newlyMarked")
  assert.deepEqual(state.writes, ["removed test.js"])
  assert.deepEqual(capture.errors, [])
})

test("when help is requested, the command succeeds without authentication", async () => {
  // Arrange
  const capture = outputCapture()
  // Act
  const code = await runCli(
    ["--help"],
    {},
    {
      ...capture.dependencies,
      authenticate: () => {
        throw new Error("must not authenticate for help")
      },
    }
  )

  // Assert
  assert.equal(code, 0)
})

for (const [name, argv] of [
  ["missing target", []],
  [
    "abbreviated head",
    argumentsFor().map((argument) => (argument === HEAD ? HEAD.slice(0, 12) : argument)),
  ],
  ["implicit bulk mode", argumentsFor("--all")],
  ["unmark", argumentsFor("--unmark")],
  ["duplicate path", argumentsFor("--path", "removed test.js")],
  ["duplicate repository", argumentsFor("--repo", "other/repo")],
  ["conflicting write/read modes", argumentsFor("--dry-run", "--mark-viewed")],
  ["relative traversal", argumentsFor("--path", "../outside")],
  ["absolute path", argumentsFor("--path", "/tmp/file")],
  ["missing value", argumentsFor("--path")],
  ["empty literal path", argumentsFor("--path=")],
]) {
  test(`when arguments contain ${name}, the command rejects before authentication`, async () => {
    // Arrange
    const capture = outputCapture()
    // Act
    const code = await runCli(
      argv,
      {},
      {
        ...capture.dependencies,
        authenticate: () => {
          throw new Error("invalid arguments reached authentication")
        },
      }
    )

    // Assert
    assert.equal(code, 2)
    assert.equal(capture.output.length, 0)
    assert.match(capture.errors[0], /^github-reviewed-files:/)
    assert.doesNotMatch(capture.errors[0], /reached authentication/)
  })
}

test("when exact paths contain leading hyphens and literal punctuation, only those paths are marked", async () => {
  // Arrange
  const paths = ["removed test.js", "--fixture.js", "literal[*] name.js", " leading.js"]
  const { state, graphql } = githubFixture({
    files: paths.map((path) => ({ path, viewerViewedState: "UNVIEWED" })),
  })
  const capture = outputCapture()
  const argv = argumentsFor(
    "--path=--fixture.js",
    "--path",
    "literal[*] name.js",
    "--path",
    " leading.js",
    "--mark-viewed"
  )

  // Act
  const code = await runCli(argv, {}, { ...capture.dependencies, graphql })

  // Assert
  assert.equal(code, 0)
  assert.deepEqual(state.writes, paths)
  assert.deepEqual(
    state.files.map((file) => file.viewerViewedState),
    paths.map(() => "VIEWED")
  )
})

test("when viewer identity differs, the command rejects without changing markers", async () => {
  // Arrange
  const capture = outputCapture()
  const { graphql, state } = githubFixture()
  state.viewer.login = "wrong-account"
  // Act
  const code = await runCli(argumentsFor("--mark-viewed"), {}, { ...capture.dependencies, graphql })
  const result = JSON.parse(capture.output[0])

  // Assert
  assert.equal(code, 1)
  assert.equal(result.status, "rejected")
  assert.equal(result.files[0].outcome, "rejected")
  assert.deepEqual(state.writes, [])
})

test("when authentication is missing, the command reports an actionable error without querying GitHub", async () => {
  // Arrange
  const capture = outputCapture()
  // Act
  const code = await runCli(
    argumentsFor(),
    {},
    {
      ...capture.dependencies,
      authenticate: () => undefined,
      graphql: () => {
        throw new Error("must not query without authentication")
      },
    }
  )

  // Assert
  assert.equal(code, 1)
  assert.match(capture.errors[0], /gh auth login/)
  assert.equal(capture.output.length, 0)
})
