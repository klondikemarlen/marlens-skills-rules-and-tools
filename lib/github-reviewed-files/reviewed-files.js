import { readSnapshot } from "./read-snapshot.js"

const MARK_VIEWED = `mutation MarkReviewedFile($pullRequestId: ID!, $path: String!) {
  markFileAsViewed(input: {pullRequestId: $pullRequestId, path: $path}) {
    clientMutationId
  }
}`

export async function reviewedFiles(options, callGraphql) {
  const result = {
    repository: options.repository,
    pullRequest: options.pullRequest,
    intendedViewer: options.viewer,
    expectedHead: options.head,
    dryRun: !options.mutate,
    status: "rejected",
    warning:
      "markFileAsViewed has no expected-head input. Checks are not atomic or revision-conditioned; they cannot prevent head races or guarantee future stability. No review/test PASS is inferred. No rollback or automatic unmark is performed.",
    files: options.paths.map((path) => ({ path, outcome: "rejected", mutationAttempted: false })),
  }
  let initial
  try {
    initial = await readSnapshot(options, callGraphql)
  } catch (error) {
    result.error = error.message
    result.reason = error.kind ?? "readFailed"
    return result
  }
  result.viewer = initial.viewer
  result.observedHead = initial.head
  result.totalFiles = initial.totalCount
  for (const file of result.files) {
    file.state = initial.files.get(file.path)
    file.stateSource = "preflight"
    file.proposedAction = file.state === "VIEWED" ? "none" : "markViewed"
    file.outcome = file.state === "VIEWED" ? "alreadyViewed" : "wouldMark"
  }
  if (!options.mutate) {
    result.status = "inspected"
    return result
  }

  for (let index = 0; index < result.files.length; index += 1) {
    const file = result.files[index]
    if (file.outcome === "alreadyViewed") continue
    let before
    try {
      before = await readSnapshot(options, callGraphql, initial.id)
      if (before.viewer.id !== initial.viewer.id)
        throw new Error("Authenticated viewer identity changed.")
    } catch (error) {
      file.outcome = error.kind === "race" ? "race" : "rejected"
      file.error = error.message
      stopRemaining(result, index, error)
      return result
    }
    file.state = before.files.get(file.path)
    file.stateSource = "preMutation"
    if (before.files.get(file.path) === "VIEWED") {
      file.state = "VIEWED"
      file.outcome = "alreadyViewed"
      continue
    }
    file.mutationAttempted = true
    file.mutationMayHaveSucceeded = true
    try {
      const response = await callGraphql(MARK_VIEWED, {
        pullRequestId: initial.id,
        path: file.path,
      })
      if (response?.errors?.length || !response?.data?.markFileAsViewed) {
        throw new Error("Mutation returned an incomplete/error response.")
      }
    } catch (error) {
      // A lost response does not prove that GitHub rejected the write.
      file.mutationError = error.message
    }
    try {
      const after = await readSnapshot(options, callGraphql, initial.id)
      if (after.viewer.id !== initial.viewer.id)
        throw new Error("Readback viewer identity changed.")
      file.state = after.files.get(file.path)
      file.stateSource = "readback"
      file.observedHead = after.head
      if (file.state !== "VIEWED") {
        file.outcome = file.mutationError ? "failed" : "unconfirmed"
        throw new Error(`Fresh readback state is ${file.state}, not VIEWED.`)
      }
      file.outcome = "newlyMarked"
      file.confirmed = true
    } catch (error) {
      if (error.kind === "race") file.outcome = "race"
      else if (file.outcome !== "failed") file.outcome = "unconfirmed"
      file.error = error.message
      stopRemaining(result, index, error)
      return result
    }
  }
  result.status = "confirmed"
  return result
}

function stopRemaining(result, index, error) {
  result.status = "stopped"
  result.error = error.message
  for (const file of result.files.slice(index + 1)) {
    if (file.outcome === "wouldMark") {
      file.outcome = "notAttempted"
      file.reason = "Stopped after unsafe or unconfirmed result; no rollback attempted."
    }
  }
}
