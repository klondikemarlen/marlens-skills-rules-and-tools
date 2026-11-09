const TARGET_FIELDS = new Set(["label", "value"])
const CONTEXT_FIELDS = new Set([
  "agent",
  "repository",
  "task",
  "whatHappened",
  "completionEffect",
  "issueUrl",
  "pullRequestUrl",
])
const REQUEST_FIELDS = new Set(["action", "target", "reason", "context", "destinationUrl"])

// eslint-disable-next-line no-control-regex -- Reject controls while retaining tabs and line breaks in text.
const INVALID_TEXT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u

export function validateRequest(input) {
  requireObject(input, "request")
  requireKnownFields(input, REQUEST_FIELDS, "request")

  const action = requireText(input.action, "action", 200)
  const target = validateTarget(input.target)
  const reason = requireText(input.reason, "reason", 2_000)
  const context = validateContext(input.context)
  const destinationUrl = validateDestinationUrl(input.destinationUrl)

  return deepFreeze({
    action,
    target,
    reason,
    context,
    destinationUrl,
  })
}

function validateTarget(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20)
    throw new Error("target must contain between 1 and 20 labeled details.")

  return value.map((detail) => {
    requireObject(detail, "target detail")
    requireKnownFields(detail, TARGET_FIELDS, "target detail")
    return {
      label: requireText(detail.label, "target.label", 100),
      value: requireText(detail.value, "target.value", 2_000),
    }
  })
}

function validateContext(value) {
  requireObject(value, "context")
  requireKnownFields(value, CONTEXT_FIELDS, "context")

  const context = {
    agent: requireText(value.agent, "context.agent", 500),
    task: requireText(value.task, "context.task", 1_000),
    completionEffect: requireText(value.completionEffect, "context.completionEffect", 2_000),
  }

  if (Object.hasOwn(value, "repository"))
    context.repository = requireText(value.repository, "context.repository", 500)

  if (Object.hasOwn(value, "whatHappened"))
    context.whatHappened = requireText(value.whatHappened, "context.whatHappened", 2_000)

  for (const field of ["issueUrl", "pullRequestUrl"]) {
    if (Object.hasOwn(value, field)) context[field] = validateContextUrl(value[field], field)
  }

  return context
}

function validateContextUrl(value, field) {
  const url = requireText(value, `context.${field}`, 2_000)
  // eslint-disable-next-line no-control-regex -- Reject URL controls and whitespace at this boundary.
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

function validateDestinationUrl(value) {
  const url = requireText(value, "destinationUrl", 8_192)
  if (url !== url.trim() || !/^[\x21-\x7E]+$/u.test(url) || url.includes("\\"))
    throw new Error("destinationUrl must be an exact printable ASCII HTTPS URL.")

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("destinationUrl must be an absolute HTTPS URL.")
  }

  if (
    !/^https:\/\/[^/?#]+/u.test(url) ||
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  )
    throw new Error("destinationUrl must be an absolute HTTPS URL without credentials.")

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
