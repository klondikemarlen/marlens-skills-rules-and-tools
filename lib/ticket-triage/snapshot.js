import { calculateSnapshotId } from "./snapshot-id.js"
import { validateSnapshot } from "./validate.js"

export const RELATED_LIMIT = 10
const COMMENTS_PAGE_SIZE = 100
const SEARCH_RESULT_LIMIT = RELATED_LIMIT + 1
const SNAPSHOT_OUTPUT_LIMIT_BYTES = 16 * 1024 * 1024
const SEARCH_TOKEN_PATTERN = /^[\p{L}\p{N}]+$/u
const DEFAULT_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "being",
  "from",
  "have",
  "into",
  "issue",
  "more",
  "should",
  "that",
  "their",
  "there",
  "these",
  "this",
  "with",
])

function requireRecord(value, description) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`GitHub returned invalid ${description}; no snapshot was produced.`)
  return value
}

function requireText(value, description) {
  if (typeof value !== "string")
    throw new Error(`GitHub returned invalid ${description}; no snapshot was produced.`)
  return value
}

function normalizeRepository(repository) {
  if (typeof repository !== "string") throw new Error("Use --repo OWNER/REPO.")
  const normalized = repository.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,38}\/[a-z0-9][a-z0-9._-]{0,99}$/.test(normalized))
    throw new Error("Use --repo OWNER/REPO with a valid GitHub repository name.")
  return normalized
}

export function parseIssueNumber(value) {
  if (typeof value !== "string" || !/^[1-9]\d{0,8}$/.test(value))
    throw new Error("Use --issue with a positive whole-number issue number.")
  const number = Number(value)
  if (!Number.isSafeInteger(number)) throw new Error("Issue number is outside the supported range.")
  return number
}

function normalizeSearchTerms(text, { explicit }) {
  const tokens = text.trim().split(/\s+/u).filter(Boolean)

  if (tokens.some((token) => !SEARCH_TOKEN_PATTERN.test(token) || token.toUpperCase() === "OR")) {
    if (explicit)
      throw new Error(
        "--search accepts plain words only; GitHub search qualifiers and operators are not allowed."
      )
    return []
  }

  const meaningfulTokens = tokens.filter((token) => {
    const normalized = token.toLowerCase()
    return normalized.length >= 3 && !DEFAULT_STOP_WORDS.has(normalized)
  })
  if (explicit && meaningfulTokens.length > 12)
    throw new Error("--search can contain no more than 12 searchable words.")
  return explicit ? meaningfulTokens : meaningfulTokens.slice(0, 8)
}

function buildSearchExpression(repository, requestedSearch, issueTitle) {
  const explicitSearch = requestedSearch !== undefined
  const sourceText = explicitSearch ? requestedSearch : issueTitle.replace(/[^\p{L}\p{N}\s]/gu, " ")
  const terms = normalizeSearchTerms(sourceText, {
    explicit: explicitSearch,
  })
  if (terms.length === 0) return null

  const quotedTerms = terms.map((term) => `"${term}"`).join(" ")
  const expression = `repo:${repository} is:issue ${quotedTerms}`
  if (expression.length > 256) {
    if (explicitSearch)
      throw new Error("The scoped GitHub search expression exceeds 256 characters.")
    return null
  }
  return expression
}

function ensureIssueUrl(value, repository, number, description) {
  let parsed
  try {
    parsed = new URL(requireText(value, description))
  } catch {
    throw new Error(`GitHub returned a non-canonical ${description}; no snapshot was produced.`)
  }

  const [owner, repo, kind, issueNumber, ...extra] = parsed.pathname.split("/").filter(Boolean)
  const matches =
    parsed.protocol === "https:" &&
    parsed.hostname === "github.com" &&
    !parsed.username &&
    !parsed.password &&
    !parsed.search &&
    !parsed.hash &&
    owner?.toLowerCase() === repository.split("/")[0] &&
    repo?.toLowerCase() === repository.split("/")[1] &&
    kind === "issues" &&
    issueNumber === String(number) &&
    extra.length === 0
  if (!matches)
    throw new Error(`GitHub returned a non-canonical ${description}; no snapshot was produced.`)
  return parsed.href
}

function ensureRepositoryUrl(value, repository) {
  let parsed
  try {
    parsed = new URL(requireText(value, "related issue repository URL"))
  } catch {
    return false
  }
  const [resource, owner, name, ...extra] = parsed.pathname.split("/").filter(Boolean)
  return (
    parsed.protocol === "https:" &&
    parsed.hostname === "api.github.com" &&
    resource === "repos" &&
    owner?.toLowerCase() === repository.split("/")[0] &&
    name?.toLowerCase() === repository.split("/")[1] &&
    extra.length === 0 &&
    !parsed.search &&
    !parsed.hash
  )
}

function normalizeLabel(label, description) {
  requireRecord(label, description)
  return requireText(label.name, `${description} name`)
}

function normalizeIssueFields(issue, repository, { includeComments }) {
  requireRecord(issue, "issue metadata")
  if (!Number.isSafeInteger(issue.number) || issue.number < 1)
    throw new Error("GitHub returned an invalid issue number; no snapshot was produced.")

  const labels = issue.labels ?? []
  const assignees = issue.assignees ?? []
  if (!Array.isArray(labels) || !Array.isArray(assignees))
    throw new Error("GitHub returned invalid issue labels or assignees; no snapshot was produced.")

  const normalized = {
    number: issue.number,
    url: ensureIssueUrl(issue.html_url, repository, issue.number, "issue URL"),
    title: requireText(issue.title, "issue title"),
    body: typeof issue.body === "string" ? issue.body : "",
    state: issue.state,
    updatedAt: issue.updated_at,
    labels: labels.map((label, index) => normalizeLabel(label, `issue label ${index}`)).sort(),
    assignees: assignees
      .map((assignee, index) => {
        requireRecord(assignee, `issue assignee ${index}`)
        return requireText(assignee.login, `issue assignee ${index} login`)
      })
      .sort(),
  }

  if (includeComments) normalized.comments = []
  return normalized
}

function unwrapPages(response, description) {
  if (!Array.isArray(response))
    throw new Error(`GitHub returned invalid paginated ${description}; no snapshot was produced.`)
  if (response.length === 0) return { pages: [[]], pageCount: 1 }
  if (response.every(Array.isArray)) return { pages: response, pageCount: response.length }
  if (response.every((item) => item !== null && typeof item === "object"))
    return { pages: [response], pageCount: 1 }
  throw new Error(`GitHub returned invalid paginated ${description}; no snapshot was produced.`)
}

async function readAllPages(read, endpoint, description) {
  const response = await read(endpoint, { paginate: true })
  const { pages, pageCount } = unwrapPages(response, description)
  const items = []
  for (const page of pages) {
    if (!Array.isArray(page))
      throw new Error(`GitHub returned invalid ${description} page; no snapshot was produced.`)
    items.push(...page)
  }
  return { items, pageCount }
}

function normalizeComment(comment, repository, issueNumber, index) {
  requireRecord(comment, `issue comment ${index}`)
  const url = requireText(comment.html_url, `issue comment ${index} URL`)
  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error("GitHub returned an invalid issue comment URL; no snapshot was produced.")
  }
  const canonicalUrl = ensureIssueUrl(
    `${parsedUrl.origin}${parsedUrl.pathname}`,
    repository,
    issueNumber,
    `issue comment ${index} parent URL`
  )
  if (!/^#issuecomment-\d+$/.test(parsedUrl.hash))
    throw new Error("GitHub returned an invalid issue comment URL; no snapshot was produced.")
  return {
    url: `${canonicalUrl}${parsedUrl.hash}`,
    body: typeof comment.body === "string" ? comment.body : "",
    updatedAt: comment.updated_at,
  }
}

function normalizeRelatedResult(issue, repository) {
  if (issue.pull_request) return null
  if (!ensureRepositoryUrl(issue.repository_url, repository)) return null
  return normalizeIssueFields(issue, repository, { includeComments: false })
}

function validateIssueResponse(issue, repository, issueNumber) {
  requireRecord(issue, "issue response")
  if (issue.pull_request || issue.html_url?.includes("/pull/")) {
    throw new Error("The requested number is a pull request, not an issue.")
  }
  if (issue.number !== issueNumber)
    throw new Error("GitHub returned a different issue number; no snapshot was produced.")
  if (!ensureRepositoryUrl(issue.repository_url, repository))
    throw new Error(
      "GitHub returned an issue from a different repository; no snapshot was produced."
    )
  return normalizeIssueFields(issue, repository, { includeComments: true })
}

export async function createSnapshot({ repository, issueNumber, search, read }) {
  const normalizedRepository = normalizeRepository(repository)
  const number = typeof issueNumber === "number" ? issueNumber : parseIssueNumber(issueNumber)
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error("Issue number must be a positive whole number.")
  if (search !== undefined) {
    if (typeof search !== "string" || search.trim().length === 0 || search.length > 200)
      throw new Error("--search must contain 1 to 200 plain-text characters.")
    if (/[\u0000-\u001f\u007f]/u.test(search))
      throw new Error("--search cannot contain control characters.")
    normalizeSearchTerms(search, { explicit: true })
  }
  if (typeof read !== "function") throw new Error("A GitHub read transport is required.")

  const issueResponse = await read(`repos/${normalizedRepository}/issues/${number}`)
  const issue = validateIssueResponse(issueResponse, normalizedRepository, number)
  const commentsResponse = await readAllPages(
    read,
    `repos/${normalizedRepository}/issues/${number}/comments?per_page=${COMMENTS_PAGE_SIZE}`,
    "issue comments"
  )
  issue.comments = commentsResponse.items.map((comment, index) =>
    normalizeComment(comment, normalizedRepository, number, index)
  )

  const labelsResponse = await readAllPages(
    read,
    `repos/${normalizedRepository}/labels?per_page=${COMMENTS_PAGE_SIZE}`,
    "repository labels"
  )
  const labels = [
    ...new Set(
      labelsResponse.items.map((label, index) => normalizeLabel(label, `repository label ${index}`))
    ),
  ].sort()

  const searchExpression = buildSearchExpression(normalizedRepository, search, issue.title)
  let related = []
  let relatedTruncated = false
  if (searchExpression !== null) {
    const endpoint =
      `search/issues?q=${encodeURIComponent(searchExpression)}` + `&per_page=${SEARCH_RESULT_LIMIT}`
    const searchResponse = requireRecord(await read(endpoint), "issue search response")
    if (searchResponse.incomplete_results === true)
      throw new Error(
        "GitHub issue search was incomplete; no snapshot was produced. Retry with a narrower --search."
      )
    if (!Number.isSafeInteger(searchResponse.total_count) || searchResponse.total_count < 0)
      throw new Error("GitHub returned an invalid issue search count; no snapshot was produced.")
    if (!Array.isArray(searchResponse.items))
      throw new Error("GitHub returned invalid issue search results; no snapshot was produced.")

    const candidates = []
    for (const result of searchResponse.items) {
      requireRecord(result, "issue search result")
      if (
        result.number === number &&
        ensureRepositoryUrl(result.repository_url, normalizedRepository)
      )
        continue
      const normalized = normalizeRelatedResult(result, normalizedRepository)
      if (normalized !== null) candidates.push(normalized)
    }
    relatedTruncated =
      candidates.length > RELATED_LIMIT || searchResponse.total_count > searchResponse.items.length
    related = candidates.slice(0, RELATED_LIMIT)
  }

  const snapshot = {
    version: 1,
    id: "",
    repository: normalizedRepository,
    capturedAt: new Date().toISOString(),
    issue,
    related,
    labels,
    metadata: {
      searchExpression,
      relatedLimit: RELATED_LIMIT,
      relatedTruncated,
      commentsFetched: issue.comments.length,
      commentsStored: issue.comments.length,
      commentsTruncated: false,
      commentsPages: commentsResponse.pageCount,
      labelsFetched: labelsResponse.items.length,
    },
  }

  snapshot.id = calculateSnapshotId(snapshot)
  validateSnapshot(snapshot)
  if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > SNAPSHOT_OUTPUT_LIMIT_BYTES)
    throw new Error(
      "Snapshot would exceed the 16 MiB output safety limit; no snapshot was produced."
    )
  return snapshot
}
