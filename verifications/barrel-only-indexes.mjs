import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ts from "typescript"

const CONFIGURATION_FILE = ".marlens-verifications.json"
const CONFIGURATION_KEY = "barrelOnlyIndexes"
const INDEX_SOURCE_FILES = new Set([
  "index.js",
  "index.jsx",
  "index.mjs",
  "index.cjs",
  "index.ts",
  "index.tsx",
  "index.mts",
  "index.cts",
])
const NODE_MODULES_PATH = /(?:^|\/)node_modules(?:\/|$)/u
const CONFIGURATION_KEYS = new Set(["roots", "entrypoints"])
const ENTRYPOINT_KEYS = new Set(["path", "reason"])

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck }
}

function git(repositoryRoot, argumentsList, encoding = "utf8") {
  return execFileSync("git", argumentsList, {
    cwd: repositoryRoot,
    encoding,
    stdio: ["ignore", "pipe", "ignore"],
  })
}

function projectRoot(projectDirectory) {
  if (!statSync(projectDirectory).isDirectory()) {
    throw new Error("Project directory is unavailable.")
  }

  const gitRoot = git(projectDirectory, ["rev-parse", "--show-toplevel"]).trim()
  return realpathSync(gitRoot)
}

function isRepositoryRelativePath(value, allowRepositoryRoot = false) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    return false
  }

  if (allowRepositoryRoot && value === ".") return true

  const segments = value.split("/")
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
}

function isIndexSourceFile(relativePath) {
  return INDEX_SOURCE_FILES.has(path.posix.basename(relativePath))
}

function isInConfiguredScope(relativePath, roots) {
  if (roots === undefined) {
    return relativePath.split("/").includes("lib")
  }

  return roots.some((root) => root === "." || relativePath.startsWith(`${root}/`))
}

function readConfiguration(repositoryRoot) {
  const configurationPath = path.join(repositoryRoot, CONFIGURATION_FILE)
  let configurationDetails
  try {
    configurationDetails = lstatSync(configurationPath)
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw new Error(`${CONFIGURATION_FILE} cannot be inspected.`)
  }

  if (!configurationDetails.isFile() && !configurationDetails.isSymbolicLink()) {
    throw new Error(`${CONFIGURATION_FILE} must be a regular JSON file.`)
  }

  const realConfigurationPath = realpathSync(configurationPath)
  if (!isWithinRepository(repositoryRoot, realConfigurationPath)) {
    throw new Error(`${CONFIGURATION_FILE} resolves outside the Git project.`)
  }

  let configuration
  try {
    configuration = JSON.parse(readFileSync(realConfigurationPath, "utf8"))
  } catch {
    throw new Error(`${CONFIGURATION_FILE} must contain valid JSON and be readable.`)
  }

  if (!configuration || Array.isArray(configuration) || typeof configuration !== "object") {
    throw new Error(`${CONFIGURATION_FILE} must contain a JSON object.`)
  }

  return configuration[CONFIGURATION_KEY]
}

function configuredRules(repositoryRoot) {
  const setting = readConfiguration(repositoryRoot)
  if (setting === undefined) return { roots: undefined, entrypoints: [] }
  if (setting === false) return false

  if (!setting || Array.isArray(setting) || typeof setting !== "object") {
    throw new Error(`${CONFIGURATION_KEY} must be false or an object.`)
  }

  for (const key of Object.keys(setting)) {
    if (!CONFIGURATION_KEYS.has(key)) {
      throw new Error(`${CONFIGURATION_KEY} has unknown key ${JSON.stringify(key)}.`)
    }
  }

  let roots
  if (setting.roots !== undefined) {
    if (!Array.isArray(setting.roots) || setting.roots.length === 0) {
      throw new Error(`${CONFIGURATION_KEY}.roots must be a nonempty array of directories.`)
    }
    if (!setting.roots.every((root) => isRepositoryRelativePath(root, true))) {
      throw new Error(
        `${CONFIGURATION_KEY}.roots must contain normalized repository-relative directories.`
      )
    }
    roots = [...new Set(setting.roots)]
  }

  const entrypoints = setting.entrypoints === undefined ? [] : setting.entrypoints
  if (!Array.isArray(entrypoints)) {
    throw new Error(`${CONFIGURATION_KEY}.entrypoints must be an array.`)
  }

  const validatedEntrypoints = entrypoints.map((entrypoint) => {
    if (!entrypoint || Array.isArray(entrypoint) || typeof entrypoint !== "object") {
      throw new Error(`${CONFIGURATION_KEY}.entrypoints entries must be objects.`)
    }
    for (const key of Object.keys(entrypoint)) {
      if (!ENTRYPOINT_KEYS.has(key)) {
        throw new Error(`${CONFIGURATION_KEY}.entrypoints has unknown key ${JSON.stringify(key)}.`)
      }
    }
    if (!isRepositoryRelativePath(entrypoint.path) || !isIndexSourceFile(entrypoint.path)) {
      throw new Error(
        `${CONFIGURATION_KEY}.entrypoints paths must name repository-relative index source files.`
      )
    }
    if (typeof entrypoint.reason !== "string" || entrypoint.reason.trim().length === 0) {
      throw new Error(`${CONFIGURATION_KEY}.entrypoints reasons must be nonblank strings.`)
    }
    if (!isInConfiguredScope(entrypoint.path, roots)) {
      throw new Error(
        `${CONFIGURATION_KEY}.entrypoints path ${entrypoint.path} is outside the configured library scope.`
      )
    }

    return { path: entrypoint.path, reason: entrypoint.reason.trim() }
  })

  return { roots, entrypoints: validatedEntrypoints }
}

function isWithinRepository(repositoryRoot, targetPath) {
  const relativePath = path.relative(repositoryRoot, targetPath)
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  )
}

function changedPaths(environment) {
  if (!environment || Array.isArray(environment) || typeof environment !== "object") {
    throw new Error("The verifier environment must be an object.")
  }

  const value = environment.OMP_VERIFIER_CHANGED_PATHS
  if (value === undefined) return undefined
  if (typeof value !== "string") {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must be a JSON string.")
  }

  let parsedPaths
  try {
    parsedPaths = JSON.parse(value)
  } catch {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must contain valid JSON.")
  }

  if (!Array.isArray(parsedPaths) || !parsedPaths.every((item) => typeof item === "string")) {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must be a JSON array of paths.")
  }
  if (!parsedPaths.every((item) => isRepositoryRelativePath(item))) {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must contain safe repository-relative paths.")
  }

  if (parsedPaths.includes(CONFIGURATION_FILE)) return undefined
  return new Set(parsedPaths)
}

function projectIndexFiles(repositoryRoot, roots, selectedPaths) {
  const listedPaths = git(
    repositoryRoot,
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    "buffer"
  )
    .toString("utf8")
    .split("\0")
    .filter(Boolean)

  return [...new Set(listedPaths)]
    .filter((relativePath) => !NODE_MODULES_PATH.test(relativePath))
    .filter(isIndexSourceFile)
    .filter((relativePath) => isInConfiguredScope(relativePath, roots))
    .filter((relativePath) => !selectedPaths || selectedPaths.has(relativePath))
}

function sourceFileFor(relativePath, source) {
  const extension = path.posix.extname(relativePath).toLowerCase()
  let scriptKind = ts.ScriptKind.TS
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    scriptKind = ts.ScriptKind.JS
  } else if (extension === ".jsx") {
    scriptKind = ts.ScriptKind.JSX
  } else if (extension === ".tsx") {
    scriptKind = ts.ScriptKind.TSX
  }

  return ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, scriptKind)
}

function sourceLine(sourceFile, nodeOrPosition) {
  const position =
    typeof nodeOrPosition === "number" ? nodeOrPosition : nodeOrPosition.getStart(sourceFile)
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1
}

function importedBindings(sourceFile) {
  const bindings = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue

    const clause = statement.importClause
    if (clause.name) bindings.add(clause.name.text)

    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      bindings.add(clause.namedBindings.name.text)
    } else if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        bindings.add(element.name.text)
      }
    }
  }
  return bindings
}

function isBindingImport(statement) {
  const clause = statement.importClause
  if (!clause) return false
  if (clause.name) return true
  if (!clause.namedBindings) return false
  if (ts.isNamespaceImport(clause.namedBindings)) return true
  return clause.namedBindings.elements.length > 0
}

function localExportViolations(statement, sourceFile, bindings) {
  const exportClause = statement.exportClause
  if (!exportClause || !ts.isNamedExports(exportClause)) {
    return [
      {
        line: sourceLine(sourceFile, statement),
        construct: "local export without an imported binding list",
      },
    ]
  }

  if (exportClause.elements.length === 0) return []

  const violations = []
  for (const element of exportClause.elements) {
    const localName = element.propertyName?.text ?? element.name.text
    if (!bindings.has(localName)) {
      violations.push({
        line: sourceLine(sourceFile, element),
        construct: `local export of ${JSON.stringify(localName)} that is not an imported binding`,
      })
    }
  }
  return violations
}

function isStaticPropertyName(name) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
}

function defaultObjectViolations(expression, sourceFile, bindings) {
  const violations = []
  for (const property of expression.properties) {
    if (ts.isShorthandPropertyAssignment(property)) {
      if (!bindings.has(property.name.text)) {
        violations.push({
          line: sourceLine(sourceFile, property),
          construct: `default object shorthand ${JSON.stringify(property.name.text)} that is not an imported binding`,
        })
      }
      continue
    }

    if (!ts.isPropertyAssignment(property)) {
      const construct = ts.isSpreadAssignment(property)
        ? "spread property in default object"
        : "method or accessor in default object"
      violations.push({ line: sourceLine(sourceFile, property), construct })
      continue
    }

    if (
      property.name.kind === ts.SyntaxKind.ComputedPropertyName ||
      !isStaticPropertyName(property.name)
    ) {
      violations.push({
        line: sourceLine(sourceFile, property),
        construct: "computed or unsupported property name in default object",
      })
      continue
    }

    if (!ts.isIdentifier(property.initializer) || !bindings.has(property.initializer.text)) {
      violations.push({
        line: sourceLine(sourceFile, property),
        construct: "default object property whose value is not an imported identifier",
      })
    }
  }
  return violations
}

function statementViolations(sourceFile) {
  const bindings = importedBindings(sourceFile)
  const violations = []

  for (const statement of sourceFile.statements) {
    if (ts.isEmptyStatement(statement)) continue

    if (ts.isImportDeclaration(statement)) {
      if (!isBindingImport(statement)) {
        violations.push({
          line: sourceLine(sourceFile, statement),
          construct: "side-effect-only import",
        })
      } else if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        violations.push({
          line: sourceLine(sourceFile, statement),
          construct: "import without a string module specifier",
        })
      }
      continue
    }

    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier !== undefined) {
        if (!ts.isStringLiteral(statement.moduleSpecifier)) {
          violations.push({
            line: sourceLine(sourceFile, statement),
            construct: "re-export without a string module specifier",
          })
        }
      } else {
        violations.push(...localExportViolations(statement, sourceFile, bindings))
      }
      continue
    }

    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      if (ts.isIdentifier(statement.expression) && bindings.has(statement.expression.text)) continue
      if (ts.isObjectLiteralExpression(statement.expression)) {
        violations.push(...defaultObjectViolations(statement.expression, sourceFile, bindings))
        continue
      }
      const construct = ts.isCallExpression(statement.expression)
        ? "default call expression"
        : "default expression that is not an imported identifier or static object"
      violations.push({ line: sourceLine(sourceFile, statement), construct })
      continue
    }

    violations.push({
      line: sourceLine(sourceFile, statement),
      construct: `${ts.SyntaxKind[statement.kind]} statement`,
    })
  }

  return violations
}

function sourceSyntaxErrors(sourceFile) {
  return sourceFile.parseDiagnostics.map((diagnostic) => ({
    line: sourceLine(sourceFile, diagnostic.start ?? 0),
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
  }))
}

function formatPaths(paths) {
  return paths.length === 0 ? "None." : paths.join(", ")
}

function exclusionEvidence(entrypoints, candidatePaths) {
  const candidates = new Set(candidatePaths)
  if (entrypoints.length === 0) return "Configured exclusions: none."

  return `Configured entrypoint exclusions: ${entrypoints
    .map(({ path: relativePath, reason }) => {
      const selection = candidates.has(relativePath)
        ? "excluded from parsing"
        : "not selected as a source candidate"
      return `${relativePath} (${selection}; reason: ${reason})`
    })
    .join("; ")}.`
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  let repositoryRoot
  try {
    repositoryRoot = projectRoot(projectDirectory)
  } catch {
    return result(
      "BLOCKED",
      "Git metadata is unavailable for the active project.",
      "Cannot inspect application-library index files.",
      "Run the check from a Git project with an accessible root directory."
    )
  }

  let rules
  try {
    rules = configuredRules(repositoryRoot)
  } catch (error) {
    return result(
      "BLOCKED",
      "The barrel-only index configuration is invalid.",
      error.message,
      `Correct ${CONFIGURATION_KEY} in ${CONFIGURATION_FILE}, or remove the invalid setting.`
    )
  }

  if (rules === false) {
    return result(
      "PASS",
      "N/A: barrel-only index checks are explicitly disabled.",
      `${CONFIGURATION_KEY} is false in ${CONFIGURATION_FILE}; no index files were inspected.`,
      "No follow-up check is required."
    )
  }

  let selectedPaths
  let candidates
  try {
    selectedPaths = changedPaths(environment)
    candidates = projectIndexFiles(repositoryRoot, rules.roots, selectedPaths)
  } catch (error) {
    return result(
      "BLOCKED",
      "Application-library index files could not be selected safely.",
      error.message,
      "Correct the changed-path context and confirm Git can list the active project files."
    )
  }

  const exclusions = exclusionEvidence(rules.entrypoints, candidates)
  const entrypoints = new Map(
    rules.entrypoints.map((entrypoint) => [entrypoint.path, entrypoint.reason])
  )
  const inspectedPaths = []
  const violations = []
  const blocked = []

  for (const relativePath of candidates) {
    if (!isRepositoryRelativePath(relativePath) || NODE_MODULES_PATH.test(relativePath)) {
      blocked.push(`${relativePath}: Git returned an unsafe project path.`)
      continue
    }

    let realFilePath
    try {
      realFilePath = realpathSync(path.join(repositoryRoot, relativePath))
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") continue
      blocked.push(`${relativePath}: cannot resolve the source path safely.`)
      continue
    }

    if (!isWithinRepository(repositoryRoot, realFilePath)) {
      blocked.push(`${relativePath}: source symlink resolves outside the Git project.`)
      continue
    }

    if (entrypoints.has(relativePath)) continue

    let source
    try {
      source = readFileSync(realFilePath, "utf8")
    } catch {
      blocked.push(`${relativePath}: source file cannot be read.`)
      continue
    }
    inspectedPaths.push(relativePath)

    try {
      const sourceFile = sourceFileFor(relativePath, source)
      const syntaxErrors = sourceSyntaxErrors(sourceFile)
      if (syntaxErrors.length > 0) {
        blocked.push(
          ...syntaxErrors.map(
            ({ line, message }) => `${relativePath}:${line}: TypeScript parser error: ${message}`
          )
        )
        continue
      }

      violations.push(
        ...statementViolations(sourceFile).map((violation) => ({
          path: relativePath,
          ...violation,
        }))
      )
    } catch {
      blocked.push(
        `${relativePath}: source could not be parsed as a TypeScript or JavaScript module.`
      )
    }
  }

  const inspectedEvidence = `Inspected paths: ${formatPaths(inspectedPaths)}`
  if (blocked.length > 0) {
    return result(
      "BLOCKED",
      "One or more application-library index files or their context could not be inspected safely.",
      `${inspectedEvidence}. ${exclusions} Blocked: ${blocked.join("; ")}.`,
      "Correct the blocked configuration, path, permissions, or source syntax, then run the check again."
    )
  }

  if (violations.length > 0) {
    const violationEvidence = violations
      .map(({ path: relativePath, line, construct }) => `${relativePath}:${line}: ${construct}`)
      .join("; ")
    return result(
      "FAIL",
      `${violations.length} application-library index construct(s) are not static barrels.`,
      `${inspectedEvidence}. ${exclusions} Offending constructs: ${violationEvidence}.`,
      "Keep application-library indexes to static exports and imports, or document an exact runtime entrypoint exception with its reason."
    )
  }

  if (inspectedPaths.length === 0) {
    return result(
      "PASS",
      "N/A: no applicable application-library index files were selected.",
      `No source files were inspected. ${exclusions}`,
      "No follow-up check is required."
    )
  }

  return result(
    "PASS",
    "Application-library index files contain only static barrel constructs.",
    `${inspectedEvidence}. ${exclusions}`,
    "No follow-up check is required."
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`)
}
