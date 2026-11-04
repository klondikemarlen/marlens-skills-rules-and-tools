import { statSync } from "node:fs"
import { isAbsolute } from "node:path"

export const MAX_REQUEST_BYTES = 65_536

const INVALID_TEXT =
  // eslint-disable-next-line no-control-regex -- Prevent invisible controls and bidi overrides in approval text.
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u
// eslint-disable-next-line no-control-regex -- Command strings must contain no control characters.
const INVALID_COMMAND = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u

export function validateRequest(input) {
  requireFields(input, ["target", "reason", "context", "command"], "request")
  if (!Array.isArray(input.target) || input.target.length < 1 || input.target.length > 20)
    throw new Error("target must contain 1 to 20 labeled details.")

  const target = input.target.map((detail) => {
    requireFields(detail, ["label", "value"], "target detail")
    return {
      label: requireText(detail.label, "target.label", 100),
      value: requireText(detail.value, "target.value", 2_000),
    }
  })

  requireFields(
    input.context,
    ["agent", "task", "whatHappened", "completionEffect", "repository"],
    "context"
  )
  const context = {
    agent: requireText(input.context.agent, "context.agent", 500),
    task: requireText(input.context.task, "context.task", 1_000),
    whatHappened: requireText(input.context.whatHappened, "context.whatHappened", 2_000),
    completionEffect: requireText(
      input.context.completionEffect,
      "context.completionEffect",
      2_000
    ),
  }
  if (Object.hasOwn(input.context, "repository"))
    context.repository = requireText(input.context.repository, "context.repository", 2_000)

  requireFields(input.command, ["executable", "arguments", "cwd"], "command")
  const executable = requireAbsolutePath(input.command.executable, "command.executable")
  const cwd = requireAbsolutePath(input.command.cwd, "command.cwd")
  if (!statSync(cwd).isDirectory()) throw new Error("command.cwd must be an existing directory.")
  if (!Array.isArray(input.command.arguments) || input.command.arguments.length > 256)
    throw new Error("command.arguments must be an array with at most 256 strings.")

  const argumentsList = input.command.arguments.map((argument) => {
    if (typeof argument !== "string" || argument.length > 8_192 || INVALID_COMMAND.test(argument))
      throw new Error(
        "Each command argument must be a control-free string of at most 8192 characters."
      )
    return argument
  })

  return Object.freeze({
    target: Object.freeze(target.map(Object.freeze)),
    reason: requireText(input.reason, "reason", 2_000),
    context: Object.freeze(context),
    command: Object.freeze({ executable, arguments: Object.freeze(argumentsList), cwd }),
  })
}

function requireFields(value, fields, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object.`)
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) throw new Error(`${label} contains an unknown field: ${key}.`)
  }
}

function requireText(value, label, limit) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > limit ||
    INVALID_TEXT.test(value)
  )
    throw new Error(`${label} must be readable nonempty text of at most ${limit} characters.`)
  return value
}

function requireAbsolutePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length > 4_096 ||
    INVALID_COMMAND.test(value) ||
    !isAbsolute(value)
  )
    throw new Error(`${label} must be an absolute, control-free path of at most 4096 characters.`)
  return value
}
