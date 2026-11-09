import { isUtf8 } from "node:buffer"
import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const CONFIGURATION_FILE = ".marlens-verifications.json"

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck }
}

function git(repositoryRoot, argumentsList) {
  return execFileSync("git", argumentsList, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
}

function validateRelativePath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    relativePath === "." ||
    relativePath !== path.normalize(relativePath) ||
    relativePath.split(/[\\/]/u).some((segment) => segment === ".." || segment === ".git")
  ) {
    throw new Error("Expected repository-relative file paths without traversal or Git metadata.")
  }
}

function regularFile(repositoryRoot, relativePath) {
  const filePath = path.join(repositoryRoot, relativePath)
  let metadata
  try {
    metadata = lstatSync(filePath)
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return undefined

    throw new Error(`Cannot inspect ${JSON.stringify(relativePath)}.`, { cause: error })
  }

  if (metadata.isSymbolicLink()) return undefined

  if (!metadata.isFile()) {
    throw new Error(`Not a regular file: ${JSON.stringify(relativePath)}.`)
  }

  const resolvedPath = realpathSync(filePath)
  const resolvedRelativePath = path.relative(repositoryRoot, resolvedPath)
  validateRelativePath(resolvedRelativePath)
  return filePath
}

function configuredExclusions(repositoryRoot) {
  const configurationPath = path.join(repositoryRoot, CONFIGURATION_FILE)
  let configuration
  try {
    const metadata = lstatSync(configurationPath)
    if (!metadata.isFile()) throw new Error("Configuration must be a regular file.")

    configuration = JSON.parse(readFileSync(configurationPath, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return new Map()

    throw new Error(`${CONFIGURATION_FILE} must be an accessible regular JSON file.`, {
      cause: error,
    })
  }

  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new Error(`${CONFIGURATION_FILE} must contain an object.`)
  }

  const policy = configuration.finalNewlines
  if (policy === undefined) return new Map()

  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("finalNewlines must be an object with an exclusions array.")
  }

  if (!Array.isArray(policy.exclusions)) {
    throw new Error("finalNewlines.exclusions must be an array of exact paths and reasons.")
  }

  const exclusions = new Map()
  for (const exclusion of policy.exclusions) {
    validateRelativePath(exclusion?.path)
    if (typeof exclusion.reason !== "string" || exclusion.reason.trim().length === 0) {
      throw new Error("Each final-newline exclusion needs a nonblank format-requirement reason.")
    }

    exclusions.set(exclusion.path, exclusion.reason.trim())
  }
  return exclusions
}

function textHasFinalNewline(bytes) {
  if (bytes.length === 0) return undefined

  const littleEndian = bytes[0] === 0xff && bytes[1] === 0xfe
  const bigEndian = bytes[0] === 0xfe && bytes[1] === 0xff
  if (littleEndian || bigEndian) {
    if (bytes.length % 2 !== 0) throw new Error("Incomplete UTF-16 code unit.")

    if (littleEndian) return bytes.readUInt16LE(bytes.length - 2) === 10

    return bytes.readUInt16BE(bytes.length - 2) === 10
  }

  if (bytes.includes(0) || !isUtf8(bytes)) return undefined

  return bytes[bytes.length - 1] === 10
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  let repositoryRoot
  let files
  let exclusions
  try {
    repositoryRoot = realpathSync(git(projectDirectory, ["rev-parse", "--show-toplevel"]).trim())
    exclusions = configuredExclusions(repositoryRoot)
    const changedPaths = environment.OMP_VERIFIER_CHANGED_PATHS
    let selection
    if (changedPaths !== undefined) {
      const paths = JSON.parse(changedPaths)
      if (!Array.isArray(paths)) throw new Error("Changed paths must be a JSON array.")

      paths.forEach(validateRelativePath)
      selection = new Set(paths)
      if (selection.has(CONFIGURATION_FILE)) selection = undefined
    }

    files = git(repositoryRoot, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean)
      .filter((filePath) => !selection || selection.has(filePath))
  } catch (error) {
    return result(
      "BLOCKED",
      "Final-newline scope could not be established.",
      repositoryRoot ? error.message : "An accessible Git project is required.",
      "Restore Git access or correct the verification configuration/changed-path input, then rerun."
    )
  }

  const violations = []
  const excludedPaths = []
  let inspected = 0
  let skipped = 0
  for (const relativePath of new Set(files)) {
    if (exclusions.has(relativePath)) {
      excludedPaths.push(`${JSON.stringify(relativePath)}: ${exclusions.get(relativePath)}`)
      continue
    }

    try {
      const filePath = regularFile(repositoryRoot, relativePath)
      if (!filePath) {
        skipped += 1
        continue
      }

      const hasNewline = textHasFinalNewline(readFileSync(filePath))
      if (hasNewline === undefined) {
        skipped += 1
        continue
      }

      inspected += 1
      if (!hasNewline) violations.push(JSON.stringify(relativePath))
    } catch {
      return result(
        "BLOCKED",
        "A selected file could not be inspected safely.",
        `Cannot read ${JSON.stringify(relativePath)} as an accessible regular file within the repository.`,
        "Restore access or resolve the file type/encoding problem, then rerun."
      )
    }
  }

  const evidence = `Inspected ${inspected} non-empty text file(s); skipped ${skipped} empty, binary, deleted, or symbolic-link path(s). Explicit exclusions: ${excludedPaths.join("; ") || "none"}.`
  if (violations.length > 0) {
    return result(
      "FAIL",
      `${violations.length} text file(s) lack a final newline.`,
      `${evidence} Missing final newline: ${violations.join(", ")}.`,
      "Append the existing format's LF or CRLF terminator only to affected files. For verbatim snapshots, reconcile live-state parity through the owning workflow; do not silently change live configuration."
    )
  }

  return result(
    "PASS",
    inspected > 0
      ? "Selected text files end with a newline."
      : "No applicable non-empty text files.",
    evidence,
    "No follow-up check is required."
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`)
}
