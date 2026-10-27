const OPERATION_NAMES = new Set(["login", "publish", "staged-publication-approval"])

const LOGIN_TARGET_FIELDS = new Set(["account", "permissions", "description"])
const PUBLICATION_TARGET_FIELDS = new Set(["package", "version", "registry", "tag", "artifact"])
const CONTEXT_FIELDS = new Set([
  "agent",
  "repository",
  "task",
  "whatHappened",
  "completionEffect",
  "issueUrl",
  "pullRequestUrl",
])
const REQUEST_FIELDS = new Set(["operation", "target", "reason", "context", "authorizationUrl"])

const INVALID_TEXT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u

export function validateRequest(input) {
  requireObject(input, "request")
  requireKnownFields(input, REQUEST_FIELDS, "request")

  const operation = requireText(input.operation, "operation", 80)
  if (!OPERATION_NAMES.has(operation))
    throw new Error("operation must be login, publish, or staged-publication-approval.")

  const target = validateTarget(input.target, operation)
  const reason = requireText(input.reason, "reason", 2_000)
  const context = validateContext(input.context)
  const authorizationUrl = validateNpmAuthorizationUrl(input.authorizationUrl)

  return deepFreeze({
    operation,
    target,
    reason,
    context,
    authorizationUrl,
  })
}

function validateTarget(value, operation) {
  requireObject(value, "target")
  const allowedFields = operation === "login" ? LOGIN_TARGET_FIELDS : PUBLICATION_TARGET_FIELDS
  requireKnownFields(value, allowedFields, "target")

  const target = {}
  for (const field of allowedFields) {
    if (Object.hasOwn(value, field))
      target[field] = requireText(value[field], `target.${field}`, 2_000)
  }

  if (operation === "login") {
    if (!target.account && !target.permissions && !target.description)
      throw new Error(
        "target must identify the known account, requested permissions, or sign-in target."
      )
  } else if (!target.package || !target.version) {
    throw new Error(
      "publish and staged-publication-approval require target.package and target.version."
    )
  }

  return target
}

function validateContext(value) {
  requireObject(value, "context")
  requireKnownFields(value, CONTEXT_FIELDS, "context")

  const context = {
    agent: requireText(value.agent, "context.agent", 500),
    repository: requireText(value.repository, "context.repository", 500),
    task: requireText(value.task, "context.task", 1_000),
    whatHappened: requireText(value.whatHappened, "context.whatHappened", 2_000),
    completionEffect: requireText(value.completionEffect, "context.completionEffect", 2_000),
  }

  for (const field of ["issueUrl", "pullRequestUrl"]) {
    if (Object.hasOwn(value, field)) context[field] = validateContextUrl(value[field], field)
  }

  return context
}

function validateContextUrl(value, field) {
  const url = requireText(value, `context.${field}`, 2_000)
  if (url !== url.trim() || /[\u0000-\u0020\u007F]/u.test(url))
    throw new Error(`context.${field} must be an absolute HTTPS URL.`)

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`context.${field} must be an absolute HTTPS URL.`)
  }

  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password)
    throw new Error(`context.${field} must be an absolute HTTPS URL without credentials.`)
  return url
}

function validateNpmAuthorizationUrl(value) {
  const url = requireText(value, "authorizationUrl", 8_192)
  if (url !== url.trim() || !/^[\x21-\x7E]+$/u.test(url) || url.includes("\\"))
    throw new Error("authorizationUrl must be the exact supplied printable ASCII npm URL.")

  const authority = url.slice("https://".length).match(/^[^/?#]*/u)?.[0]
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("authorizationUrl must be an HTTPS URL on www.npmjs.com.")
  }

  if (
    !url.startsWith("https://") ||
    authority !== "www.npmjs.com" ||
    parsed.protocol !== "https:" ||
    parsed.origin !== "https://www.npmjs.com" ||
    parsed.username ||
    parsed.password ||
    parsed.port
  )
    throw new Error("authorizationUrl must be an HTTPS URL on exactly www.npmjs.com.")

  return url
}

function requireObject(value, field) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${field} must be an object.`)
}

function requireKnownFields(value, knownFields, field) {
  for (const key of Object.keys(value))
    if (!knownFields.has(key)) throw new Error(`${field} contains an unknown field.`)
}

function requireText(value, field, maximumLength) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maximumLength ||
    INVALID_TEXT.test(value)
  )
    throw new Error(`${field} must be non-empty text no longer than ${maximumLength} characters.`)
  return value
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

export default validateRequest
