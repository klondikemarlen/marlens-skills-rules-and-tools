import assert from "node:assert/strict"
import test from "node:test"

import { reviewedFiles } from "../../lib/github-reviewed-files/reviewed-files.js"
import { approvedOptions, githubFixture, HEAD, OTHER_HEAD } from "./github-fixture.mjs"

test("when inspecting a paginated diff, removed paths are included without changing personal markers", async () => {
  // Arrange
  const { state, graphql } = githubFixture()
  const before = structuredClone(state.files)
  // Act
  const result = await reviewedFiles(approvedOptions({ mutate: false }), graphql)

  // Assert
  assert.equal(result.status, "inspected")
  assert.deepEqual(result.viewer, { id: "viewer-1", login: "maintainer" })
  assert.equal(result.observedHead, HEAD)
  assert.equal(result.totalFiles, 4)
  assert.deepEqual(
    result.files.map(({ path, state, outcome, proposedAction }) => ({
      path,
      state,
      outcome,
      proposedAction,
    })),
    [
      {
        path: "src/approved.js",
        state: "UNVIEWED",
        outcome: "wouldMark",
        proposedAction: "markViewed",
      },
      {
        path: "removed test.js",
        state: "DISMISSED",
        outcome: "wouldMark",
        proposedAction: "markViewed",
      },
      { path: "already.js", state: "VIEWED", outcome: "alreadyViewed", proposedAction: "none" },
    ]
  )
  assert.deepEqual(state.files, before)
  assert.deepEqual(state.writes, [])
})

test("when marking approved paths, prior and unrelated markers are preserved across retries", async () => {
  // Arrange
  const { state, graphql } = githubFixture()
  const options = approvedOptions()
  // Act
  const result = await reviewedFiles(options, graphql)
  const retry = await reviewedFiles(options, graphql)

  // Assert
  assert.equal(result.status, "confirmed")
  assert.deepEqual(
    result.files.map((file) => file.outcome),
    ["newlyMarked", "newlyMarked", "alreadyViewed"]
  )
  assert.deepEqual(state.writes, ["src/approved.js", "removed test.js"])
  assert.equal(
    state.files.find((file) => file.path === "unrelated.js").viewerViewedState,
    "UNVIEWED"
  )
  assert.equal(state.files.find((file) => file.path === "already.js").viewerViewedState, "VIEWED")
  assert.deepEqual(
    retry.files.map((file) => file.outcome),
    ["alreadyViewed", "alreadyViewed", "alreadyViewed"]
  )
})

for (const [name, options, fixture] of [
  ["wrong viewer", { viewer: "someone-else" }, {}],
  ["wrong head", { head: OTHER_HEAD }, {}],
  ["missing exact path instead of guessing rename alias", { paths: ["old-name.js"] }, {}],
  [
    "incomplete final page",
    {},
    {
      transformPage: (response, state, variables) => {
        if (variables.after !== null) response.data.repository.pullRequest.files.nodes.pop()
        return response
      },
    },
  ],
  [
    "ambiguous paths",
    {},
    {
      transformPage: (response, state, variables) => {
        if (variables.after !== null)
          response.data.repository.pullRequest.files.nodes[0].path = "src/approved.js"
        return response
      },
    },
  ],
  [
    "missing pagination cursor",
    {},
    {
      transformPage: (response) => {
        response.data.repository.pullRequest.files.pageInfo.endCursor = null
        return response
      },
    },
  ],
  [
    "unknown file state",
    {},
    {
      transformPage: (response) => {
        response.data.repository.pullRequest.files.nodes[0].viewerViewedState = null
        return response
      },
    },
  ],
  [
    "partial GraphQL error data",
    {},
    { transformPage: (response) => ({ ...response, errors: [{ message: "limited" }] }) },
  ],
  [
    "wrong repository",
    {},
    {
      transformPage: (response) => {
        response.data.repository.nameWithOwner = "other/repo"
        return response
      },
    },
  ],
  [
    "wrong PR number",
    {},
    {
      transformPage: (response) => {
        response.data.repository.pullRequest.number = 99
        return response
      },
    },
  ],
  [
    "head race between file pages",
    {},
    {
      transformPage: (response, state, variables) => {
        if (variables.after !== null) response.data.repository.pullRequest.headRefOid = OTHER_HEAD
        return response
      },
    },
  ],
  [
    "viewer identity change between pages",
    {},
    {
      transformPage: (response, state, variables) => {
        if (variables.after !== null) response.data.viewer.id = "another-viewer-id"
        return response
      },
    },
  ],
  [
    "repeated pagination cursor",
    {},
    {
      transformPage: (response, state, variables) => {
        if (variables.after !== null) {
          response.data.repository.pullRequest.files.pageInfo = {
            hasNextPage: true,
            endCursor: variables.after,
          }
        }
        return response
      },
    },
  ],
]) {
  test(`when ${name} invalidates the snapshot, no mutation is attempted`, async () => {
    // Arrange
    const { state, graphql } = githubFixture(fixture)
    // Act
    const result = await reviewedFiles(approvedOptions(options), graphql)

    // Assert
    assert.equal(result.status, "rejected")
    assert.ok(result.error)
    assert.ok(result.files.every((file) => file.outcome === "rejected" && !file.mutationAttempted))
    assert.deepEqual(state.writes, [])
  })
}

test("when the head changes before the second write, continuation stops and prior success is disclosed", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    beforeRead: (state) => {
      if (state.reads === 4) state.head = OTHER_HEAD
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions(), graphql)

  // Assert
  assert.equal(result.status, "stopped")
  assert.deepEqual(
    result.files.map((file) => file.outcome),
    ["newlyMarked", "race", "alreadyViewed"]
  )
  assert.deepEqual(state.writes, ["src/approved.js"])
  assert.equal(state.files[0].viewerViewedState, "VIEWED")
  assert.equal(state.files[1].viewerViewedState, "DISMISSED")
})

test("when the head changes after a write, the helper reports the race without rollback or further writes", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    beforeRead: (state) => {
      if (state.reads === 3) state.head = OTHER_HEAD
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions(), graphql)

  // Assert
  assert.equal(result.status, "stopped")
  assert.equal(result.files[0].outcome, "race")
  assert.equal(result.files[0].mutationMayHaveSucceeded, true)
  assert.equal(result.files[1].outcome, "notAttempted")
  assert.deepEqual(state.writes, ["src/approved.js"])
  assert.equal(state.files[0].viewerViewedState, "VIEWED")
})

test("when a later mutation fails, confirmed changes remain and subsequent paths are untouched", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    mutate: (state, path) => {
      if (path === "removed test.js") return new Error("permission denied")
    },
  })
  // Act
  const result = await reviewedFiles(
    approvedOptions({ paths: ["src/approved.js", "removed test.js", "unrelated.js"] }),
    graphql
  )

  // Assert
  assert.equal(result.status, "stopped")
  assert.deepEqual(
    result.files.map((file) => file.outcome),
    ["newlyMarked", "failed", "notAttempted"]
  )
  assert.equal(result.files[1].mutationError, "permission denied")
  assert.equal(result.files[1].state, "DISMISSED")
  assert.deepEqual(
    state.files.map((file) => file.viewerViewedState),
    ["VIEWED", "DISMISSED", "VIEWED", "UNVIEWED"]
  )
})

test("when a mutation response is lost, fresh same-head viewed readback confirms the result", async () => {
  // Arrange
  const { graphql } = githubFixture({
    mutate: (state, path) => {
      state.files.find((file) => file.path === path).viewerViewedState = "VIEWED"
      return new Error("connection closed after sending")
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions({ paths: ["src/approved.js"] }), graphql)

  // Assert
  assert.equal(result.status, "confirmed")
  assert.equal(result.files[0].confirmed, true)
  assert.equal(result.files[0].outcome, "newlyMarked")
  assert.equal(result.files[0].mutationError, "connection closed after sending")
})

test("when post-write reads fail or are incomplete, successful mutations remain unconfirmed", async () => {
  for (const mode of ["network", "incomplete"]) {
    // Arrange
    const { state, graphql } = githubFixture({
      transformPage: (response, state, variables) => {
        if (state.reads === 3) {
          if (mode === "network") throw new Error("read timed out")
          if (variables.after !== null) response.data.repository.pullRequest.files.nodes.pop()
        }
        return response
      },
    })
    // Act
    const result = await reviewedFiles(approvedOptions(), graphql)

    // Assert
    assert.equal(result.status, "stopped")
    assert.equal(result.files[0].outcome, "unconfirmed")
    assert.equal(result.files[0].mutationMayHaveSucceeded, true)
    assert.equal(result.files[1].outcome, "notAttempted")
    assert.deepEqual(state.writes, ["src/approved.js"])
    assert.equal(state.files[0].viewerViewedState, "VIEWED")
  }
})

test("when another client marks an approved file viewed, the helper preserves it without another mutation", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    beforeRead: (state) => {
      if (state.reads === 2) state.files[0].viewerViewedState = "VIEWED"
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions(), graphql)

  // Assert
  assert.equal(result.status, "confirmed")
  assert.equal(result.files[0].outcome, "alreadyViewed")
  assert.deepEqual(state.writes, ["removed test.js"])
})

test("when mutation returns success but readback is unviewed, the result remains unconfirmed", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    beforeRead: (state) => {
      if (state.reads === 3) state.files[0].viewerViewedState = "UNVIEWED"
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions(), graphql)

  // Assert
  assert.equal(result.status, "stopped")
  assert.equal(result.files[0].outcome, "unconfirmed")
  assert.equal(result.files[0].state, "UNVIEWED")
  assert.equal(result.files[0].stateSource, "readback")
  assert.equal(result.files[1].outcome, "notAttempted")
  assert.deepEqual(state.writes, ["src/approved.js"])
})

test("when viewer identity changes after preflight, unchanged login and head do not permit mutation", async () => {
  // Arrange
  const { state, graphql } = githubFixture({
    beforeRead: (state) => {
      if (state.reads === 2) state.viewer.id = "unexpected-identity"
    },
  })
  // Act
  const result = await reviewedFiles(approvedOptions(), graphql)

  // Assert
  assert.equal(result.status, "stopped")
  assert.equal(result.files[0].outcome, "rejected")
  assert.equal(result.files[0].mutationAttempted, false)
  assert.equal(result.files[1].outcome, "notAttempted")
  assert.deepEqual(state.writes, [])
})
