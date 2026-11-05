const FILES_QUERY = `query ReviewedFiles($owner: String!, $name: String!, $number: Int!, $after: String) {
  viewer { id login }
  repository(owner: $owner, name: $name) {
    nameWithOwner
    pullRequest(number: $number) {
      id number headRefOid changedFiles
      files(first: 100, after: $after) {
        totalCount nodes { path viewerViewedState }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`

export class SnapshotError extends Error {
  constructor(message, kind = "rejected") {
    super(message)
    this.kind = kind
  }
}

export async function readSnapshot(options, callGraphql, expectedId) {
  const [owner, name] = options.repository.split("/")
  const files = new Map()
  const cursors = new Set()
  let after = null
  let snapshot
  while (true) {
    const response = await callGraphql(FILES_QUERY, {
      owner,
      name,
      number: options.pullRequest,
      after,
    })
    if (response?.errors?.length) throw new SnapshotError("GraphQL returned incomplete/error data.")
    const viewer = response?.data?.viewer
    const repository = response?.data?.repository
    const pull = repository?.pullRequest
    if (
      !viewer?.id ||
      typeof viewer.login !== "string" ||
      viewer.login.toLowerCase() !== options.viewer.toLowerCase()
    ) {
      throw new SnapshotError("Authenticated viewer does not match intended --viewer.")
    }
    if (
      repository?.nameWithOwner?.toLowerCase() !== options.repository.toLowerCase() ||
      pull?.number !== options.pullRequest ||
      typeof pull?.id !== "string" ||
      !pull.id ||
      (expectedId && pull.id !== expectedId)
    ) {
      throw new SnapshotError("Repository/PR identity could not be confirmed.")
    }
    if (pull.headRefOid !== options.head) {
      throw new SnapshotError(
        `Head mismatch: expected ${options.head}, observed ${pull.headRefOid ?? "unknown"}.`,
        "race"
      )
    }
    const connection = pull.files
    if (
      !Number.isSafeInteger(pull.changedFiles) ||
      pull.changedFiles < 0 ||
      !Number.isSafeInteger(connection?.totalCount) ||
      connection.totalCount !== pull.changedFiles ||
      !Array.isArray(connection.nodes) ||
      typeof connection.pageInfo?.hasNextPage !== "boolean"
    ) {
      throw new SnapshotError("Incomplete file connection/count/page information.")
    }
    if (
      snapshot &&
      (snapshot.id !== pull.id ||
        snapshot.viewer.id !== viewer.id ||
        snapshot.totalCount !== connection.totalCount)
    ) {
      throw new SnapshotError("PR/viewer/file count changed during pagination.")
    }
    snapshot = {
      id: pull.id,
      viewer,
      head: pull.headRefOid,
      totalCount: connection.totalCount,
      files,
    }
    for (const file of connection.nodes) {
      if (
        typeof file?.path !== "string" ||
        !file.path ||
        !["VIEWED", "UNVIEWED", "DISMISSED"].includes(file.viewerViewedState) ||
        files.has(file.path)
      ) {
        throw new SnapshotError("Incomplete or ambiguous exact file paths/states.")
      }
      files.set(file.path, file.viewerViewedState)
    }
    if (!connection.pageInfo.hasNextPage) break
    const cursor = connection.pageInfo.endCursor
    if (
      connection.nodes.length === 0 ||
      typeof cursor !== "string" ||
      !cursor ||
      cursors.has(cursor)
    ) {
      throw new SnapshotError(
        "Incomplete pagination: missing/repeated cursor or empty nonfinal page."
      )
    }
    cursors.add(cursor)
    after = cursor
  }
  if (files.size !== snapshot.totalCount)
    throw new SnapshotError("Incomplete file pagination/count mismatch.")
  for (const path of options.paths) {
    if (!files.has(path))
      throw new SnapshotError(`Approved exact path not found: ${JSON.stringify(path)}`)
  }
  return snapshot
}
