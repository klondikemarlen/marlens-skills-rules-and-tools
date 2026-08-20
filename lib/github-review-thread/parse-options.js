import { normalizeOptionName } from "./normalize-option-name.js"

const BOOLEAN_OPTIONS = new Set(["help", "dryRun"])

export function parseOptions(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index]
    if (arg === "--help" || arg === "-h") {
      parsed.help = true
      continue
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional arg: ${arg}`)
    }

    const normalized = arg.slice(2)
    const [name, inlineValue] = normalized.split("=", 2)
    const key = normalizeOptionName(name)
    const next = values[index + 1]

    if (BOOLEAN_OPTIONS.has(key)) {
      parsed[key] = inlineValue === undefined ? true : !/^(false|0)$/u.test(inlineValue)
      continue
    }

    const value = inlineValue ?? next
    const missingValue =
      inlineValue === undefined && (value === undefined || value.startsWith("--"))
    if (missingValue) {
      throw new Error(`Missing value for --${name}.`)
    }

    parsed[key] = value
    if (inlineValue === undefined) index += 1
  }
  return parsed
}
