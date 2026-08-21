import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const CONFIGURATION_FILE = ".marlens-verifications.json"
const CONFIGURATION_KEY = "typescriptRuntimeEntrypoints"
const TYPESCRIPT_EXTENSIONS = new Set([".cts", ".mts", ".ts", ".tsx"])
const LAZY_COMPILER_PATTERN = /(?:^|[^\w-])(?:ts-node(?:-dev)?|tsx|tsimp|swc-node)(?:$|[^\w-])/u
const SIDE_EFFECT_IMPORT = /^\s*import\s+["']([^"']+)["'];?/gmu

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

  return git(projectDirectory, ["rev-parse", "--show-toplevel"]).trim()
}

function parseJsonWithComments(source, sourceName) {
  let output = ""
  let quote = null
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (quote) {
      output += character
      if (escaped) {
        escaped = false
      } else if (character === "\\") {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      output += character
      continue
    }
    if (character === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1
      output += "\n"
      continue
    }
    if (character === "/" && next === "*") {
      index += 2
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1
      }
      index += 1
      continue
    }
    output += character
  }

  try {
    return JSON.parse(output.replace(/,(\s*[}\]])/gu, "$1"))
  } catch {
    throw new Error(`${sourceName} must contain valid JSON or JSON with comments.`)
  }
}

function readConfiguration(repositoryRoot) {
  const configurationPath = path.join(repositoryRoot, CONFIGURATION_FILE)
  if (!existsSync(configurationPath)) return undefined

  const configuration = parseJsonWithComments(
    readFileSync(configurationPath, "utf8"),
    CONFIGURATION_FILE
  )
  if (!configuration || Array.isArray(configuration) || typeof configuration !== "object") {
    throw new Error(`${CONFIGURATION_FILE} must contain an object.`)
  }

  return configuration[CONFIGURATION_KEY]
}

function isCommand(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((argument) => typeof argument === "string" && argument.length > 0)
  )
}

function isProjectWrapper(repositoryRoot, command) {
  const executable = command[0]
  if (!executable.startsWith("./") || !isProjectRelativePath(repositoryRoot, executable)) {
    return false
  }

  const relativePath = executable.slice(2)
  try {
    const wrapper = lstatSync(path.join(repositoryRoot, relativePath))
    if (!wrapper.isFile() || wrapper.isSymbolicLink() || (wrapper.mode & 0o111) === 0) {
      return false
    }

    git(repositoryRoot, ["ls-files", "--error-unmatch", "--", relativePath])
    return true
  } catch {
    return false
  }
}

function isProjectRelativePath(repositoryRoot, value) {
  if (path.isAbsolute(value)) return false

  const relative = path.relative(repositoryRoot, path.resolve(repositoryRoot, value))
  return relative !== ".." && !relative.startsWith(`..${path.sep}`)
}

function configuredEntrypoints(repositoryRoot) {
  const configuration = readConfiguration(repositoryRoot)
  if (configuration === undefined) return undefined
  if (configuration === false) return false
  if (!configuration || Array.isArray(configuration) || typeof configuration !== "object") {
    throw new Error(`${CONFIGURATION_KEY} must be false or an object.`)
  }

  const {
    commands,
    declarations = [],
    fullTypecheck,
    timeoutMs = 30000,
    tsconfig = "tsconfig.json",
  } = configuration
  if (!Array.isArray(commands) || commands.length === 0) {
    throw new Error(`${CONFIGURATION_KEY}.commands must contain at least one command.`)
  }
  if (
    !commands.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        isCommand(entry.command) &&
        isProjectWrapper(repositoryRoot, entry.command)
    )
  ) {
    throw new Error(
      `${CONFIGURATION_KEY}.commands entries must start with a tracked executable project wrapper.`
    )
  }
  if (
    fullTypecheck !== undefined &&
    (!isCommand(fullTypecheck) || !isProjectWrapper(repositoryRoot, fullTypecheck))
  ) {
    throw new Error(
      `${CONFIGURATION_KEY}.fullTypecheck must start with a tracked executable project wrapper.`
    )
  }
  if (!Array.isArray(declarations)) {
    throw new Error(`${CONFIGURATION_KEY}.declarations must be an array.`)
  }
  if (
    !declarations.every(
      (declaration) =>
        declaration &&
        typeof declaration === "object" &&
        typeof declaration.path === "string" &&
        isProjectRelativePath(repositoryRoot, declaration.path) &&
        (declaration.kind === "global" || declaration.kind === "local")
    )
  ) {
    throw new Error(
      `${CONFIGURATION_KEY}.declarations entries must name a path and kind of global or local.`
    )
  }
  if (
    typeof tsconfig !== "string" ||
    tsconfig.length === 0 ||
    !isProjectRelativePath(repositoryRoot, tsconfig)
  ) {
    throw new Error(`${CONFIGURATION_KEY}.tsconfig must be a project-relative path.`)
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) {
    throw new Error(`${CONFIGURATION_KEY}.timeoutMs must be an integer from 1 to 120000.`)
  }

  return { commands, declarations, fullTypecheck, timeoutMs, tsconfig }
}

function lazyRuntimeScripts(repositoryRoot) {
  const packagePath = path.join(repositoryRoot, "package.json")
  if (!existsSync(packagePath)) return []

  let packageJson
  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"))
  } catch {
    throw new Error("package.json must contain valid JSON.")
  }
  if (!packageJson.scripts || typeof packageJson.scripts !== "object") return []

  return Object.entries(packageJson.scripts)
    .filter(([, command]) => typeof command === "string" && LAZY_COMPILER_PATTERN.test(command))
    .map(([name]) => name)
}

function readTypeRoots(repositoryRoot, configuredPath) {
  const tsconfigPath = path.join(repositoryRoot, configuredPath)
  if (!existsSync(tsconfigPath)) {
    throw new Error(`Cannot read configured TypeScript project ${configuredPath}.`)
  }

  const tsconfig = parseJsonWithComments(readFileSync(tsconfigPath, "utf8"), configuredPath)
  const typeRoots = tsconfig?.compilerOptions?.typeRoots
  if (!Array.isArray(typeRoots) || typeRoots.some((root) => typeof root !== "string")) {
    throw new Error(
      `${configuredPath} must configure compilerOptions.typeRoots for global declarations.`
    )
  }

  return typeRoots.map((root) => path.resolve(path.dirname(tsconfigPath), root))
}

function relativePath(repositoryRoot, filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/")
}

function packageShapedDeclaration(repositoryRoot, declarationPath, typeRoots) {
  const absolutePath = path.resolve(repositoryRoot, declarationPath)
  return typeRoots.some((typeRoot) => {
    const relative = path.relative(typeRoot, absolutePath).split(path.sep)
    if (relative.some((segment) => segment === "..") || relative.at(-1) !== "index.d.ts") {
      return false
    }

    return relative.length === 2 || (relative.length === 3 && relative[0].startsWith("@"))
  })
}

function trackedTypescriptFiles(repositoryRoot) {
  return git(
    repositoryRoot,
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    "buffer"
  )
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((filePath) => TYPESCRIPT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
}

function sideEffectImportViolations(repositoryRoot, declarations) {
  const declaredPaths = new Set(declarations.map((declaration) => declaration.path))
  const violations = []
  for (const sourcePath of trackedTypescriptFiles(repositoryRoot)) {
    const source = readFileSync(path.join(repositoryRoot, sourcePath), "utf8")
    for (const match of source.matchAll(SIDE_EFFECT_IMPORT)) {
      const specifier = match[1]
      if (!specifier.startsWith(".")) continue

      const basePath = path.resolve(repositoryRoot, path.dirname(sourcePath), specifier)
      const candidates = [basePath, `${basePath}.d.ts`, path.join(basePath, "index.d.ts")].map(
        (candidate) => relativePath(repositoryRoot, candidate)
      )
      const declarationPath = candidates.find((candidate) => declaredPaths.has(candidate))
      if (declarationPath) violations.push(`${sourcePath} side-effect imports ${declarationPath}.`)
    }
  }

  return violations
}

function runCommand(repositoryRoot, command, timeoutMs, environment) {
  try {
    const output = execFileSync(command[0], command.slice(1), {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...process.env, ...environment },
      timeout: timeoutMs,
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { success: true, output }
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim()
    return { success: false, output: output || error.message }
  }
}

function declarationEvidence(declarations) {
  if (declarations.length === 0) return "No declaration ownership was configured."

  return declarations
    .map((declaration) =>
      declaration.kind === "global"
        ? `${declaration.path} is a package-shaped global declaration.`
        : `${declaration.path} is configured as local; keep it as an imported local/intersection type.`
    )
    .join(" ")
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  let repositoryRoot
  try {
    repositoryRoot = projectRoot(projectDirectory)
  } catch {
    return result(
      "BLOCKED",
      "Git metadata is unavailable for the active project.",
      "Cannot discover TypeScript runtime entry points.",
      "Run the check from a Git project."
    )
  }

  let scripts
  let configured
  try {
    scripts = lazyRuntimeScripts(repositoryRoot)
    configured = configuredEntrypoints(repositoryRoot)
  } catch (error) {
    return result(
      "BLOCKED",
      "TypeScript runtime entrypoint configuration is invalid.",
      error.message,
      `Fix ${CONFIGURATION_FILE} or the project package metadata, then run the check again.`
    )
  }

  if (configured === false) {
    return result(
      "PASS",
      "TypeScript runtime entrypoint verification is explicitly disabled.",
      `${CONFIGURATION_KEY} is false in ${CONFIGURATION_FILE}.`,
      "No follow-up check is required."
    )
  }

  if (configured === undefined) {
    if (scripts.length === 0) {
      return result(
        "PASS",
        "No lazy TypeScript runtime entry points were discovered.",
        "package.json has no scripts using a supported lazy TypeScript compiler.",
        "No follow-up check is required."
      )
    }

    return result(
      "BLOCKED",
      "Lazy TypeScript runtime entry points need finite wrapper commands.",
      `Discovered package scripts: ${scripts.join(", ")}.`,
      `Configure ${CONFIGURATION_KEY}.commands in ${CONFIGURATION_FILE} with repository-owned finite wrapper command arrays.`
    )
  }

  for (const declaration of configured.declarations) {
    if (!existsSync(path.join(repositoryRoot, declaration.path))) {
      return result(
        "BLOCKED",
        "A configured TypeScript declaration is unavailable.",
        `Cannot read ${declaration.path}.`,
        "Correct the configured declaration path."
      )
    }
  }

  const globalDeclarations = configured.declarations.filter(
    (declaration) => declaration.kind === "global"
  )
  if (globalDeclarations.length > 0) {
    let typeRoots
    try {
      typeRoots = readTypeRoots(repositoryRoot, configured.tsconfig)
    } catch (error) {
      return result(
        "BLOCKED",
        "Global TypeScript declaration ownership is invalid.",
        error.message,
        "Configure package-shaped typeRoots entries or classify the declaration as local."
      )
    }

    for (const declaration of globalDeclarations) {
      if (!packageShapedDeclaration(repositoryRoot, declaration.path, typeRoots)) {
        return result(
          "BLOCKED",
          "Global TypeScript declarations must be package-shaped.",
          `${declaration.path} is not an index.d.ts entry under a configured typeRoots package.`,
          "Move it under <typeRoot>/<package>/index.d.ts or classify it as a local imported type."
        )
      }
    }
  }

  let sideEffectImports
  try {
    sideEffectImports = sideEffectImportViolations(repositoryRoot, configured.declarations)
  } catch (error) {
    return result(
      "BLOCKED",
      "TypeScript side-effect imports could not be inspected.",
      error.message,
      "Restore the affected TypeScript source file and run the check again."
    )
  }
  if (sideEffectImports.length > 0) {
    return result(
      "FAIL",
      "Runtime side-effect imports force TypeScript declaration loading.",
      sideEffectImports.join(" "),
      "Use a package-shaped global declaration or an imported local/intersection type instead."
    )
  }

  for (const entrypoint of configured.commands) {
    const command = entrypoint.command
    const commandResult = runCommand(repositoryRoot, command, configured.timeoutMs, environment)
    if (commandResult.success) continue

    if (configured.fullTypecheck) {
      const fullTypecheck = runCommand(
        repositoryRoot,
        configured.fullTypecheck,
        configured.timeoutMs,
        environment
      )
      if (fullTypecheck.success && globalDeclarations.length > 0) {
        return result(
          "FAIL",
          "Lazy TypeScript runtime compilation may miss a global declaration.",
          `${entrypoint.name ?? command[0]} failed while the configured full type-check passed. ${declarationEvidence(globalDeclarations)} Runtime output: ${commandResult.output}`,
          "Keep the global declaration package-shaped under configured typeRoots and fix the runtime entrypoint loading mode."
        )
      }
      if (!fullTypecheck.success) {
        return result(
          "FAIL",
          "TypeScript runtime and full-project compilation both fail.",
          `${entrypoint.name ?? command[0]} failed: ${commandResult.output} Full type-check failed: ${fullTypecheck.output}`,
          "Fix the shared TypeScript error before treating this as a lazy-runtime declaration mismatch."
        )
      }
    }

    return result(
      "FAIL",
      "A TypeScript runtime entrypoint command failed.",
      `${entrypoint.name ?? command[0]} failed: ${commandResult.output}`,
      "Fix the runtime compiler error or configure fullTypecheck to diagnose a declaration-loading mismatch."
    )
  }

  return result(
    "PASS",
    "Configured TypeScript runtime entry points completed successfully.",
    `Ran ${configured.commands.length} finite runtime command(s). ${declarationEvidence(configured.declarations)}`,
    "No follow-up check is required."
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`)
}
