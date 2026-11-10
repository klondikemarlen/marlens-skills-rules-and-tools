import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ts from "typescript"

const DIRECTIVES = {
  "test-name-when": {
    summary: "Test names use `when [condition], [behavior]`.",
    check: checkTestName,
    remediation: "Rename the test to `when [condition], [behavior]`.",
  },
  "arrange-act-assert": {
    summary: "Tests use ordered Arrange, Act, and Assert comments.",
    check: checkArrangeActAssert,
    remediation: "Add ordered Arrange, Act, and Assert comments to the test.",
  },
  "one-direct-expect": {
    summary: "Non-controller expect-based tests contain exactly one direct `expect(...)` call.",
    check: checkExpectationCount,
    remediation:
      "Use exactly one direct expect per non-controller test; split independent outcomes without hiding or weakening assertions.",
  },
  "no-mock-calls": {
    summary: "Tests do not assert against bundled `.mock.calls` objects.",
    check: checkMockCalls,
    remediation: "Assert the relevant mocked call directly instead of `.mock.calls`.",
  },
  "describe-file-class-method": {
    summary: "Tests are nested under file, class, and method `describe` blocks.",
    check: checkDescribeDepth,
    remediation: "Nest this test under file, class, and method `describe` blocks.",
  },
}

const BASELINE_DIRECTIVES = ["test-name-when", "arrange-act-assert", "one-direct-expect"]
const CHECK_ID = "marlens-rules:test-alignment"
const SUPPRESSION_FILE = ".marlens-verifications.json"

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

function repositoryRoot(projectDirectory) {
  return git(projectDirectory, ["rev-parse", "--show-toplevel"]).trim()
}

function automaticTestPaths(root, environment) {
  const value = environment.OMP_VERIFIER_CHANGED_PATHS
  if (value === undefined) return undefined

  const paths = JSON.parse(value)
  if (!Array.isArray(paths) || paths.some((filePath) => typeof filePath !== "string")) {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must be a JSON array of paths")
  }

  return [...new Set(paths)]
    .filter(isTestPath)
    .filter((filePath) => existsSync(path.join(root, filePath)))
    .sort()
}

function changedTestFiles(root, environment) {
  const automaticPaths = automaticTestPaths(root, environment)
  if (automaticPaths) return automaticPaths

  const base = environment.MARLENS_TEST_ALIGNMENT_BASE
  const comparison = base
    ? ["diff", "--name-only", "-z", "--diff-filter=ACMR", `${base}...HEAD`]
    : ["diff", "--name-only", "-z", "--diff-filter=ACMR", "HEAD"]
  const committed = git(root, comparison).split("\0").filter(Boolean)
  const worktree = base
    ? git(root, ["diff", "--name-only", "-z", "--diff-filter=ACMR", "HEAD"])
        .split("\0")
        .filter(Boolean)
    : []
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)

  return [...new Set([...committed, ...worktree, ...untracked])].filter(isTestPath).sort()
}

function isTestPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/")

  return (
    /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)/u.test(normalized) ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(normalized)
  )
}

function isControllerTestPath(testPath) {
  const normalized = testPath.replaceAll("\\", "/")
  const filename = path.posix.basename(normalized)

  return (
    /(?:^|\/)controllers?\//iu.test(normalized) ||
    /(?:[._-]controller|Controller)\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(filename)
  )
}

function lineNumber(source, offset) {
  let line = 1
  for (let index = 0; index < offset; index += 1) {
    if (source[index] === "\n") line += 1
  }

  return line
}

function lineAt(source, line) {
  return source.split("\n")[line - 1]?.trim() ?? ""
}

function parseGuidance(source, relativePath) {
  const rules = new Map()
  const lines = source.split("\n")

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*<!--\s*marlens-test-alignment:\s*([a-z-]+)\s*-->\s*$/u)
    if (!match || !DIRECTIVES[match[1]]) continue

    rules.set(match[1], {
      path: relativePath,
      line: index + 1,
      directive: match[1],
    })
  }

  return rules
}

function guidanceForTest(root, testPath) {
  const rules = new Map(
    BASELINE_DIRECTIVES.map((directive) => [
      directive,
      {
        path: "shared baseline",
        line: 1,
        directive,
      },
    ])
  )
  let directory = path.dirname(testPath)

  while (directory !== "." && directory !== path.dirname(directory)) {
    for (const name of ["README.md", "README.mdx"]) {
      const relativePath = path.join(directory, name).replaceAll("\\", "/")
      const absolutePath = path.join(root, relativePath)
      if (!existsSync(absolutePath)) continue

      for (const [directive, source] of parseGuidance(
        readFileSync(absolutePath, "utf8"),
        relativePath
      )) {
        if (!rules.has(directive)) rules.set(directive, source)
      }
    }

    directory = path.dirname(directory)
  }

  for (const name of ["README.md", "README.mdx"]) {
    const absolutePath = path.join(root, name)
    if (!existsSync(absolutePath)) continue

    for (const [directive, source] of parseGuidance(readFileSync(absolutePath, "utf8"), name)) {
      if (!rules.has(directive)) rules.set(directive, source)
    }
  }

  return rules
}

function suppressionScope(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("suppression path must be a non-empty relative path")
  }

  const normalized = path.posix.normalize(value)
  if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../")) {
    throw new Error("suppression path must stay inside the project")
  }

  return normalized
}

function suppressionExpiry(value) {
  if (value === undefined) return undefined
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new Error("suppression expiresOn must use YYYY-MM-DD")
  }

  return value
}

function readSuppressions(root) {
  const configurationPath = path.join(root, SUPPRESSION_FILE)
  if (!existsSync(configurationPath)) return []

  let configuration
  try {
    configuration = JSON.parse(readFileSync(configurationPath, "utf8"))
  } catch {
    throw new Error(`${SUPPRESSION_FILE} must contain valid JSON`)
  }

  if (!configuration || Array.isArray(configuration) || typeof configuration !== "object") {
    throw new Error(`${SUPPRESSION_FILE} must contain an object`)
  }

  const suppressions = configuration.suppressions ?? []
  if (!Array.isArray(suppressions)) {
    throw new Error(`${SUPPRESSION_FILE} suppressions must be an array`)
  }

  const parsedSuppressions = suppressions.map((suppression, index) => {
    if (!suppression || Array.isArray(suppression) || typeof suppression !== "object") {
      throw new Error(`suppression ${index + 1} must be an object`)
    }
    if (typeof suppression.id !== "string" || suppression.id.length === 0) {
      throw new Error(`suppression ${index + 1} id must be a non-empty string`)
    }
    if (typeof suppression.reason !== "string" || suppression.reason.trim().length === 0) {
      throw new Error(`suppression ${index + 1} reason must be a non-empty string`)
    }

    return {
      id: suppression.id,
      path: suppressionScope(suppression.path),
      reason: suppression.reason.trim(),
      expiresOn: suppressionExpiry(suppression.expiresOn),
    }
  })

  for (const suppression of parsedSuppressions) {
    if (
      suppression.id === CHECK_ID &&
      suppression.expiresOn &&
      suppression.expiresOn < new Date().toISOString().slice(0, 10)
    ) {
      throw new Error(
        `suppression for ${CHECK_ID} at ${suppression.path} expired on ${suppression.expiresOn}`
      )
    }
  }

  return parsedSuppressions
}

function matchingSuppression(suppressions, testPath) {
  return suppressions.find((suppression) => {
    if (suppression.id !== CHECK_ID) return false
    return (
      suppression.path === "." ||
      testPath === suppression.path ||
      testPath.startsWith(`${suppression.path}/`)
    )
  })
}

function isTestCallee(expression) {
  if (
    ts.isCallExpression(expression) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === "each"
  ) {
    expression = expression.expression.expression
  }

  if (
    ts.isPropertyAccessExpression(expression) &&
    ["concurrent", "fails", "only", "skip"].includes(expression.name.text)
  ) {
    expression = expression.expression
  }

  return ts.isIdentifier(expression) && ["it", "test"].includes(expression.text)
}

function nativeAssertionBindings(sourceFile) {
  const bindings = new Set()
  const nativeModules = new Set(["node:assert", "node:assert/strict", "assert", "assert/strict"])

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      nativeModules.has(statement.moduleSpecifier.text)
    ) {
      const clause = statement.importClause
      if (clause?.name) bindings.add(clause.name.text)
      const namedBindings = clause?.namedBindings
      if (namedBindings && ts.isNamespaceImport(namedBindings)) {
        bindings.add(namedBindings.name.text)
      } else if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) bindings.add(element.name.text)
      }
    }

    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer
      if (
        !initializer ||
        !ts.isCallExpression(initializer) ||
        !ts.isIdentifier(initializer.expression) ||
        initializer.expression.text !== "require" ||
        !initializer.arguments[0] ||
        !ts.isStringLiteral(initializer.arguments[0]) ||
        !nativeModules.has(initializer.arguments[0].text)
      ) {
        continue
      }

      if (ts.isIdentifier(declaration.name)) {
        bindings.add(declaration.name.text)
      } else if (ts.isObjectBindingPattern(declaration.name)) {
        for (const element of declaration.name.elements) {
          if (ts.isIdentifier(element.name)) bindings.add(element.name.text)
        }
      }
    }
  }

  return bindings
}

function assertionCounts(callback, nativeBindings) {
  let expectations = 0
  let nativeAssertions = 0

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isIdentifier(callee) && callee.text === "expect") expectations += 1

      let root = callee
      while (ts.isPropertyAccessExpression(root) || ts.isElementAccessExpression(root)) {
        root = root.expression
      }
      if (ts.isIdentifier(root) && nativeBindings.has(root.text)) nativeAssertions += 1
    }
    ts.forEachChild(node, visit)
  }

  if (callback) visit(callback)
  return { expectations, nativeAssertions }
}

function testBlocks(source, testPath) {
  const blocks = []
  const sourceFile = ts.createSourceFile(testPath, source, ts.ScriptTarget.Latest)
  const nativeBindings = nativeAssertionBindings(sourceFile)

  function visit(node) {
    if (ts.isCallExpression(node) && isTestCallee(node.expression)) {
      const [title, secondArgument, thirdArgument] = node.arguments
      const callback =
        secondArgument &&
        (ts.isArrowFunction(secondArgument) || ts.isFunctionExpression(secondArgument))
          ? secondArgument
          : thirdArgument
      if (title && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) {
        const offset = node.getStart(sourceFile)
        const line = lineNumber(source, offset)
        const body =
          callback &&
          (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
          ts.isBlock(callback.body)
            ? source.slice(callback.body.getStart(sourceFile) + 1, callback.body.end - 1)
            : ""

        const counts = assertionCounts(callback, nativeBindings)
        blocks.push({
          name: title.text,
          line,
          code: lineAt(source, line),
          body,
          offset,
          expectations: counts.expectations,
          nativeAssertions: counts.nativeAssertions,
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return blocks
}

function checkTestName(block) {
  return /^when\s+.+,\s+.+$/iu.test(block.name)
    ? null
    : "does not use `when [condition], [behavior]` naming"
}

function checkArrangeActAssert(block) {
  const arrange = block.body.search(/(?:\/\/|\/\*)\s*Arrange\b/u)
  const act = block.body.search(/(?:\/\/|\/\*)\s*Act\b/u)
  const assert = block.body.search(/(?:\/\/|\/\*)\s*Assert\b/u)
  const combined = block.body.search(/(?:\/\/|\/\*)\s*Act\s*(?:\/|&|and)\s*Assert\b/u)
  const orderedSeparatePhases = arrange !== -1 && act > arrange && assert > act
  const orderedCombinedPhases = arrange !== -1 && combined > arrange

  return orderedSeparatePhases || orderedCombinedPhases
    ? null
    : "does not contain ordered Arrange, Act, and Assert comments"
}

// Native node:assert tests keep their framework; a native import alone cannot
// exempt an empty or expect-based test from the shared expectation count.

function checkExpectationCount(block, source, testPath) {
  if (isControllerTestPath(testPath)) return null
  if (block.expectations === 0 && block.nativeAssertions > 0) return null

  return block.expectations === 1
    ? null
    : `test ${JSON.stringify(block.name)} contains ${block.expectations} direct \`expect(...)\` calls; expected exactly 1`
}

function checkMockCalls(block) {
  return /\.mock\s*\.calls\b/gu.test(block.body) ? "asserts against `.mock.calls`" : null
}

function describeDepth(source, offset) {
  const tokens = /\bdescribe\s*\(|[{}]/gu
  const stack = []
  let describesNextBlock = false

  for (const match of source.slice(0, offset).matchAll(tokens)) {
    if (match[0].startsWith("describe")) {
      describesNextBlock = true
    } else if (match[0] === "{") {
      stack.push(describesNextBlock)
      describesNextBlock = false
    } else {
      stack.pop()
    }
  }

  return stack.filter(Boolean).length
}

function checkDescribeDepth(block, source) {
  return describeDepth(source, block.offset) >= 3
    ? null
    : "is not nested under file, class, and method `describe` blocks"
}

function formatViolation(testPath, block, source, reason) {
  return `${testPath}:${block.line}: \`${block.code}\` — ${reason}; source ${source.path}:${source.line} (\`marlens-test-alignment: ${source.directive}\`).`
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  let root
  try {
    if (!statSync(projectDirectory).isDirectory()) {
      return result(
        "BLOCKED",
        "The active project directory is unavailable.",
        `Cannot inspect ${projectDirectory}.`,
        "Run the check from an accessible project directory."
      )
    }

    root = repositoryRoot(projectDirectory)
  } catch {
    return result(
      "BLOCKED",
      "Git metadata is unavailable for the active project.",
      "Cannot determine which changed test files to inspect.",
      "Run the check from a Git project."
    )
  }

  let testPaths
  try {
    testPaths = changedTestFiles(root, environment)
  } catch {
    return result(
      "BLOCKED",
      "Changed files could not be inspected.",
      "Git returned an unexpected error while reading the configured base diff or worktree diff.",
      "Set MARLENS_TEST_ALIGNMENT_BASE to an accessible PR base ref, or confirm Git can inspect the active project."
    )
  }

  if (testPaths.length === 0) {
    return result(
      "PASS",
      "No changed test files require alignment review.",
      "The worktree diff contains no changed test files.",
      "No follow-up check is required."
    )
  }

  let suppressions
  try {
    suppressions = readSuppressions(root)
  } catch (error) {
    return result(
      "BLOCKED",
      "Test-alignment suppression configuration is invalid.",
      error.message,
      `Fix ${SUPPRESSION_FILE} before running ${CHECK_ID}.`
    )
  }

  const configured = []
  const suppressed = []
  const violations = []

  for (const testPath of testPaths) {
    const suppression = matchingSuppression(suppressions, testPath)
    if (suppression) {
      suppressed.push(`${testPath} (${suppression.path}: ${suppression.reason})`)
      continue
    }

    const guidance = guidanceForTest(root, testPath)
    const source = readFileSync(path.join(root, testPath), "utf8")
    const blocks = testBlocks(source, testPath)
    configured.push(`${testPath} (${guidance.size} rule${guidance.size === 1 ? "" : "s"})`)

    for (const block of blocks) {
      for (const [directive, ruleSource] of guidance) {
        const reason = DIRECTIVES[directive].check(block, source, testPath)
        if (!reason) continue

        violations.push({
          evidence: formatViolation(testPath, block, ruleSource, reason),
          remediation: DIRECTIVES[directive].remediation,
        })
      }
    }
  }

  if (violations.length > 0) {
    const suppressionEvidence =
      suppressed.length > 0 ? `\nSuppressed ${CHECK_ID} for ${suppressed.join(", ")}.` : ""
    return result(
      "FAIL",
      `${violations.length} test-alignment violation(s) found.`,
      `${violations.map(({ evidence }) => evidence).join("\n")}${suppressionEvidence}`,
      [...new Set(violations.map(({ remediation }) => remediation))].join(" ")
    )
  }

  const inspected = configured.length > 0 ? `Inspected ${configured.join(", ")}.` : ""
  const skipped =
    suppressed.length > 0 ? ` Suppressed ${CHECK_ID} for ${suppressed.join(", ")}.` : ""
  return result(
    "PASS",
    configured.length > 0
      ? "Changed test files follow shared baseline and local alignment guidance."
      : "Changed test files are covered by a scoped test-alignment suppression.",
    `${inspected}${skipped}`.trim(),
    "No follow-up check is required."
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const verification = runVerification()
  process.stdout.write(`${JSON.stringify(verification)}\n`)
  if (verification.status !== "PASS") process.exitCode = 1
}
