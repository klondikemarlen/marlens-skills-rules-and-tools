import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { promisify } from "node:util"

const run = promisify(execFile)
const READ_PULL_REQUEST = `query($owner: String!, $repo: String!, $number: Int!) {
  viewer { login }
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      id url state body viewerCanUpdate lastEditedAt
      userContentEdits(first: 20) {
        pageInfo { hasNextPage }
        nodes { id editedAt deletedAt editor { login } diff }
      }
    }
  }
}`

export function normalizeMarkdown(markdown) {
  return markdown.replaceAll("\r\n", "\n")
}

export function markdownHash(markdown) {
  return createHash("sha256").update(normalizeMarkdown(markdown)).digest("hex")
}

export async function readScreenshotPullRequest({ owner, repo, number, prUrl }) {
  let response

  try {
    const { stdout } = await run(
      "gh",
      [
        "api",
        "graphql",
        "--hostname",
        "github.com",
        "-f",
        `query=${READ_PULL_REQUEST}`,
        "-f",
        `owner=${owner}`,
        "-f",
        `repo=${repo}`,
        "-F",
        `number=${number}`,
      ],
      { timeout: 15_000, maxBuffer: 8 * 1024 * 1024 }
    )
    response = JSON.parse(stdout)
  } catch {
    throw new Error(
      "GitHub read/history failed. Check `gh auth status --hostname github.com` and access to this PR."
    )
  }

  const pullRequest = response.data?.repository?.pullRequest
  const actor = response.data?.viewer?.login
  if (
    response.errors?.length ||
    !actor ||
    !pullRequest ||
    pullRequest.url?.toLowerCase() !== prUrl.toLowerCase() ||
    typeof pullRequest.body !== "string"
  ) {
    throw new Error(
      "GitHub did not return the exact pull request body and edit history. Confirm access to the selected PR."
    )
  }

  return {
    id: pullRequest.id,
    url: pullRequest.url,
    writable: pullRequest.viewerCanUpdate && pullRequest.state === "OPEN",
    actor,
    markdown: normalizeMarkdown(pullRequest.body),
    hash: markdownHash(pullRequest.body),
    latestEditedAt: pullRequest.lastEditedAt,
    history: pullRequest.userContentEdits,
  }
}

export function screenshotBodyVersion(pr) {
  const latest = pr.history?.nodes?.[0]
  if (
    !latest ||
    !snapshotIsAvailable(latest) ||
    markdownHash(latest.diff) !== pr.hash ||
    (pr.latestEditedAt && latest.editedAt !== pr.latestEditedAt)
  ) {
    throw new Error(
      "Edit history does not expose the current complete body revision. Inspect the description history before publishing."
    )
  }

  return {
    id: pr.id,
    actor: pr.actor,
    hash: pr.hash,
    editId: latest.id,
  }
}

export function requireFreshScreenshotBody(pr, expected) {
  const version = screenshotBodyVersion(pr)
  if (
    !pr.writable ||
    version.id !== expected.id ||
    version.actor !== expected.actor ||
    version.hash !== expected.hash ||
    version.editId !== expected.editId
  ) {
    throw new Error(
      "The pull request body or its edit revision changed. No save was attempted; inspect the description before resuming."
    )
  }
}

export function auditScreenshotHistory(pr, before, submittedHash, batchMarker) {
  const version = screenshotBodyVersion(pr)
  if (version.id !== before.id || version.actor !== before.actor) {
    throw new Error(
      "Read-back resolved a different pull request or GitHub account. Check the exact target before resuming."
    )
  }

  const nodes = pr.history.nodes
  const baselineIndex = nodes.findIndex(({ id }) => id === before.editId)
  if (baselineIndex === 0 && pr.hash === before.hash) {
    return { status: "unchanged" }
  }

  if (
    baselineIndex < 1 ||
    !nodes.slice(0, baselineIndex + 1).every(snapshotIsAvailable) ||
    markdownHash(nodes[baselineIndex].diff) !== before.hash ||
    pr.hash !== submittedHash ||
    nodes[0].editor?.login !== before.actor ||
    !normalizeMarkdown(nodes[0].diff).includes(batchMarker)
  ) {
    return { status: "ambiguous" }
  }

  if (baselineIndex === 1) {
    return { status: "verified" }
  }

  const baseline = normalizeMarkdown(nodes[baselineIndex].diff)
  const intervening = normalizeMarkdown(nodes[1].diff)
  // GitHub describes diff as a summary. Only accept a single complete-looking append to a known snapshot.
  if (
    baselineIndex !== 2 ||
    !baseline ||
    !intervening.startsWith(baseline) ||
    intervening.length === baseline.length ||
    intervening.includes(batchMarker)
  ) {
    return { status: "ambiguous" }
  }

  return {
    status: "repairable",
    intervening,
  }
}

function snapshotIsAvailable(edit) {
  return (
    typeof edit?.id === "string" &&
    edit.deletedAt === null &&
    typeof edit.diff === "string" &&
    !edit.diff.startsWith("diff --git ") &&
    !/^@@ -\d/u.test(edit.diff)
  )
}
