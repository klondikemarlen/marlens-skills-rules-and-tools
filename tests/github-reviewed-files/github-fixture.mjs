export const HEAD = "a".repeat(40)
export const OTHER_HEAD = "b".repeat(40)

export function githubFixture({
  files = [
    { path: "src/approved.js", viewerViewedState: "UNVIEWED" },
    { path: "removed test.js", viewerViewedState: "DISMISSED" },
    { path: "already.js", viewerViewedState: "VIEWED" },
    { path: "unrelated.js", viewerViewedState: "UNVIEWED" },
  ],
  beforeRead = () => {},
  mutate = () => {},
  transformPage = (response) => response,
} = {}) {
  const state = {
    head: HEAD,
    viewer: { id: "viewer-1", login: "maintainer" },
    files: structuredClone(files),
    writes: [],
    reads: 0,
  }
  const graphql = async (query, variables) => {
    if (query.startsWith("mutation")) {
      state.writes.push(variables.path)
      const failure = mutate(state, variables.path)
      if (failure) throw failure
      const file = state.files.find((entry) => entry.path === variables.path)
      file.viewerViewedState = "VIEWED"
      return { data: { markFileAsViewed: { clientMutationId: null } } }
    }
    if (variables.after === null) {
      state.reads += 1
      beforeRead(state)
    }
    const offset = variables.after === null ? 0 : Number(variables.after)
    const end = Math.min(offset + 2, state.files.length)
    return transformPage(
      {
        data: {
          viewer: { ...state.viewer },
          repository: {
            nameWithOwner: "owner/repo",
            pullRequest: {
              id: "pr-42",
              number: 42,
              headRefOid: state.head,
              changedFiles: state.files.length,
              files: {
                totalCount: state.files.length,
                nodes: structuredClone(state.files.slice(offset, end)),
                pageInfo: { hasNextPage: end < state.files.length, endCursor: String(end) },
              },
            },
          },
        },
      },
      state,
      variables
    )
  }
  return { state, graphql }
}

export function approvedOptions(overrides = {}) {
  return {
    repository: "owner/repo",
    pullRequest: 42,
    viewer: "maintainer",
    head: HEAD,
    paths: ["src/approved.js", "removed test.js", "already.js"],
    mutate: true,
    ...overrides,
  }
}
