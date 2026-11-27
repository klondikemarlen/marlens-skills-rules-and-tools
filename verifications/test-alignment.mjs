import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

import ts from "typescript"

import { isMainModule } from "../lib/is-main-module.mjs"
import createPrComparison from "../lib/test-alignment-pr-comparison.mjs"

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
const MAX_EVIDENCE_LENGTH = 4000

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

function selectedPaths(value) {
  if (value === undefined) {
    return undefined
  }

  const paths = JSON.parse(value)
  if (!Array.isArray(paths) || paths.some((filePath) => typeof filePath !== "string")) {
    throw new Error("OMP_VERIFIER_CHANGED_PATHS must be a JSON array of paths")
  }

  return new Set(paths)
}

function isProjectPath(filePath) {
  return (
    filePath.trim() &&
    !filePath.includes("\0") &&
    !path.isAbsolute(filePath) &&
    !(path.sep === "\\" && (filePath.includes("\\") || /^[a-z]:/iu.test(filePath))) &&
    filePath.split("/").every((part) => part && part !== "." && part !== "..")
  )
}

function validLineRanges(ranges) {
  if (!Array.isArray(ranges)) {
    return false
  }

  let previousLast = 0
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2) {
      return false
    }

    const [first, last] = range
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(last) ||
      first <= previousLast ||
      last < first
    ) {
      return false
    }

    previousLast = last
  }

  return true
}

function readPrScope(environment) {
  let scope
  let matchingPaths
  try {
    scope = JSON.parse(environment.OMP_VERIFIER_PR_SCOPE)
    matchingPaths = selectedPaths(environment.OMP_VERIFIER_CHANGED_PATHS)
  } catch {
    throw new Error("Expected JSON scope and matching paths from OMP Verifier.")
  }

  if (!matchingPaths || ![...matchingPaths].every(isProjectPath)) {
    throw new Error("Expected project-relative paths in OMP_VERIFIER_CHANGED_PATHS.")
  }

  if (scope?.version !== 1) {
    throw new Error("Expected PR scope version 1.")
  }

  for (const key of ["baseCommit", "mergeBaseCommit", "headCommit"]) {
    if (typeof scope[key] !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(scope[key])) {
      throw new Error(`Expected a full Git commit ID in ${key}.`)
    }
  }

  const { mode, lineRanges, deletedPaths, wholeFilePaths } = scope
  const expectedMode = wholeFilePaths?.length ? "changed-lines-and-files" : "changed-lines"
  if (
    mode !== expectedMode ||
    !lineRanges ||
    typeof lineRanges !== "object" ||
    Array.isArray(lineRanges) ||
    !Array.isArray(deletedPaths) ||
    !Array.isArray(wholeFilePaths)
  ) {
    throw new Error("Expected a matching mode and lineRanges, deletedPaths, and wholeFilePaths.")
  }

  const rangesByPath = new Map(Object.entries(lineRanges))
  for (const [filePath, ranges] of rangesByPath) {
    if (!matchingPaths.has(filePath) || !validLineRanges(ranges)) {
      throw new Error(`Expected ordered one-based line ranges for a matching path: ${filePath}.`)
    }
  }

  for (const filePath of deletedPaths) {
    if (!matchingPaths.has(filePath) || rangesByPath.has(filePath)) {
      throw new Error("Deleted paths must be matching paths without line ranges.")
    }
  }

  for (const filePath of wholeFilePaths) {
    if (!rangesByPath.has(filePath)) {
      throw new Error("Whole-file paths must be matching paths with a lineRanges entry.")
    }
  }

  return {
    matchingPaths,
    rangesByPath,
    wholeFiles: new Set(wholeFilePaths),
    mergeBaseCommit: scope.mergeBaseCommit,
    headCommit: scope.headCommit,
  }
}

function scopedTestFiles(root, { matchingPaths, rangesByPath, wholeFiles }) {
  const files = []

  for (const testPath of [...matchingPaths].filter(isTestPath).sort()) {
    const lineRanges = rangesByPath.get(testPath)
    const wholeFile = wholeFiles.has(testPath)
    const entry = scopedFileEntry(root, testPath)

    if (!lineRanges) {
      // A removed rename source is absent from both lineRanges and deletedPaths.
      if (entry && !entry.isDirectory()) {
        throw new Error(`No lineRanges entry for present test file ${testPath}.`)
      }
      continue
    }

    if (!entry || ((wholeFile || lineRanges.length > 0) && !entry.isFile())) {
      throw new Error(`The captured scope does not match the test file at ${testPath}.`)
    }

    if (wholeFile || lineRanges.length > 0) {
      files.push({ testPath, lineRanges, wholeFile })
    }
  }

  return files
}

function scopedFileEntry(root, testPath) {
  try {
    return lstatSync(path.join(root, testPath), { throwIfNoEntry: false })
  } catch (error) {
    if (error.code === "ENOTDIR") {
      return undefined
    }

    throw new Error(`Cannot inspect the captured test file ${testPath}.`, { cause: error })
  }
}

function automaticTestPaths(root, environment) {
  const paths = selectedPaths(environment.OMP_VERIFIER_CHANGED_PATHS)
  if (!paths) {
    return undefined
  }

  return [...paths]
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

function sourceLineStarts(source) {
  const starts = [0]

  for (
    let newline = source.indexOf("\n");
    newline !== -1;
    newline = source.indexOf("\n", newline + 1)
  ) {
    starts.push(newline + 1)
  }

  return starts
}

function lineAtOffset(lineStarts, offset) {
  let first = 0
  let last = lineStarts.length

  while (first + 1 < last) {
    const middle = Math.floor((first + last) / 2)
    if (lineStarts[middle] <= offset) {
      first = middle
    } else {
      last = middle
    }
  }

  return first + 1
}

function firstChangedLine(lineRanges, start, end) {
  let first = 0
  let last = lineRanges.length

  while (first < last) {
    const middle = Math.floor((first + last) / 2)
    if (lineRanges[middle][1] < start) {
      first = middle + 1
    } else {
      last = middle
    }
  }

  const range = lineRanges[first]
  if (range && range[0] <= end) {
    return Math.max(start, range[0])
  }
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

function assertionFacts(callback, nativeBindings, sourceFile) {
  const expectationOffsets = []
  const nativeAssertionOffsets = []

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isIdentifier(callee) && callee.text === "expect") {
        expectationOffsets.push(callee.getStart(sourceFile))
      }

      let root = callee
      while (ts.isPropertyAccessExpression(root) || ts.isElementAccessExpression(root)) {
        root = root.expression
      }
      if (ts.isIdentifier(root) && nativeBindings.has(root.text)) {
        nativeAssertionOffsets.push(root.getStart(sourceFile))
      }
    }
    ts.forEachChild(node, visit)
  }

  if (callback) visit(callback)
  return { expectationOffsets, nativeAssertionOffsets }
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
        const callbackBody =
          callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
            ? callback.body
            : undefined
        const bodyStart = callbackBody?.getStart(sourceFile)
        const isBlockBody = callbackBody && ts.isBlock(callbackBody)
        const bodyOffset = isBlockBody ? bodyStart + 1 : undefined
        const body = isBlockBody ? source.slice(bodyOffset, callbackBody.end - 1) : ""
        const titleSpan = [title.getStart(sourceFile), title.end - 1]
        const { expectationOffsets, nativeAssertionOffsets } = assertionFacts(
          callback,
          nativeBindings,
          sourceFile
        )

        blocks.push({
          name: title.text,
          titleSpan,
          body,
          bodyOffset,
          callbackBodySpan: callbackBody && [bodyStart, callbackBody.end - 1],
          offset,
          expectationOffsets,
          nativeAssertionOffsets,
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return blocks
}

function checkTestName(block) {
  if (/^when\s+.+,\s+.+$/iu.test(block.name)) {
    return null
  }

  return {
    reason: "does not use `when [condition], [behavior]` naming",
    spans: [block.titleSpan],
  }
}

function checkArrangeActAssert(block) {
  const arrange = /(?:\/\/|\/\*)\s*Arrange\b/u.exec(block.body)
  const act = /(?:\/\/|\/\*)\s*Act\b/u.exec(block.body)
  const assert = /(?:\/\/|\/\*)\s*Assert\b/u.exec(block.body)
  const combined = /(?:\/\/|\/\*)\s*Act\s*(?:\/|&|and)\s*Assert\b/u.exec(block.body)
  const orderedSeparatePhases =
    arrange && act && assert && act.index > arrange.index && assert.index > act.index
  const orderedCombinedPhases = arrange && combined && combined.index > arrange.index

  if (orderedSeparatePhases || orderedCombinedPhases) {
    return null
  }

  const spans = [arrange, act, assert, combined]
    .filter(Boolean)
    .map((match) => bodyMatchSpan(block.bodyOffset, match))
  return { reason: "does not contain ordered Arrange, Act, and Assert comments", spans }
}

// Native node:assert tests keep their framework; a native import alone cannot
// exempt an empty or expect-based test from the shared expectation count.

function checkExpectationCount(block, source, testPath) {
  const expectationCount = block.expectationOffsets.length
  if (
    isControllerTestPath(testPath) ||
    expectationCount === 1 ||
    (expectationCount === 0 && block.nativeAssertionOffsets.length > 0)
  ) {
    return null
  }

  return {
    reason: `test ${JSON.stringify(block.name)} contains ${expectationCount} direct \`expect(...)\` calls; expected exactly 1`,
    spans: block.expectationOffsets.map((offset) => [offset, offset]),
  }
}

function checkMockCalls(block) {
  const matches = [...block.body.matchAll(/\.mock\s*\.calls\b/gu)]
  if (!matches.length) {
    return null
  }

  const spans = matches.map((match) => bodyMatchSpan(block.bodyOffset, match))
  return { reason: "asserts against `.mock.calls`", spans }
}

function bodyMatchSpan(bodyOffset, match) {
  const start = bodyOffset + match.index
  return [start, start + match[0].length - 1]
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
    : { reason: "is not nested under file, class, and method `describe` blocks", spans: [] }
}

function eligibleFindingLine(block, spans, lineStarts, lineRanges) {
  if (!lineRanges) {
    return lineAtOffset(lineStarts, block.offset)
  }

  // Prefer rule-specific evidence. For rules about missing structure, the
  // declaration is the only anchor; an arbitrary callback edit is not evidence.
  if (!spans.length) {
    const declarationLine = lineAtOffset(lineStarts, block.offset)
    return firstChangedLine(lineRanges, declarationLine, declarationLine)
  }

  let earliestLine

  for (const [start, end] of spans) {
    const startLine = lineAtOffset(lineStarts, start)
    const endLine = lineAtOffset(lineStarts, end)
    const changedLine = firstChangedLine(lineRanges, startLine, endLine)

    if (changedLine !== undefined && (earliestLine === undefined || changedLine < earliestLine)) {
      earliestLine = changedLine
    }
  }

  return earliestLine
}

function prepareAssertionPreimage({ basePath, baseSource, hunks }) {
  const baseLineStarts = sourceLineStarts(baseSource)
  const blocksByOffset = new Map(testBlocks(baseSource, basePath).map((block) => [block.offset, block]))
  return { baseLineStarts, blocksByOffset, hunks }
}

function removedAssertionLine(
  block,
  lineStarts,
  bodyLines,
  { baseLineStarts, blocksByOffset, hunks }
) {
  // The unchanged call start maps to one exact preimage offset, even when
  // multiple calls have the same title or share a physical line.
  const declaration = lineAtOffset(lineStarts, block.offset)
  let lineShift = 0

  for (const { baseEnd, headBefore, headEnd } of hunks) {
    if (declaration <= headBefore) break
    if (declaration <= headEnd) return

    lineShift = baseEnd - headEnd
  }

  const declarationColumn = block.offset - lineStarts[declaration - 1]
  const previous = blocksByOffset.get(baseLineStarts[declaration + lineShift - 1] + declarationColumn)
  if (!previous?.callbackBodySpan || previous.name !== block.name) return

  const { expectationOffsets, nativeAssertionOffsets } = previous
  let assertionOffsets
  if (expectationOffsets.length === 1) {
    assertionOffsets = expectationOffsets
  } else if (expectationOffsets.length === 0 && nativeAssertionOffsets.length > 0) {
    assertionOffsets = nativeAssertionOffsets
  } else {
    return
  }

  const [baseBodyStart, baseBodyEnd] = previous.callbackBodySpan
  const [headBodyFirst, headBodyLast] = bodyLines

  for (const { baseBefore, baseEnd, headBefore, headEnd } of hunks) {
    const line = Math.max(headBefore + 1, headBodyFirst)
    if (line > Math.min(headEnd, headBodyLast)) continue

    // An unrelated changed line in the callback is not evidence. The old
    // side of this same replacement hunk must contain the assertion.
    for (const offset of assertionOffsets) {
      if (offset < baseBodyStart || offset > baseBodyEnd) continue

      const baseLine = lineAtOffset(baseLineStarts, offset)
      if (baseBefore < baseLine && baseLine <= baseEnd) return line
    }
  }
}

function formatViolation(testPath, line, code, ruleSource, reason) {
  return `${testPath}:${line}: \`${code}\` — ${reason}; source ${ruleSource.path}:${ruleSource.line} (\`marlens-test-alignment: ${ruleSource.directive}\`).`
}

function invalidPrScope(evidence) {
  return result(
    "BLOCKED",
    "OMP_VERIFIER_PR_SCOPE is invalid for test alignment.",
    evidence,
    "Capture a fresh PR scope with OMP Verifier against the actual PR base."
  )
}

function readTestSource(root, testPath, lineRanges) {
  let source
  try {
    source = readFileSync(path.join(root, testPath), "utf8")
  } catch (error) {
    throw new Error(`Cannot read test file ${testPath}.`, { cause: error })
  }

  const lineStarts = sourceLineStarts(source)
  const lineCount = lineStarts.at(-1) === source.length ? lineStarts.length - 1 : lineStarts.length
  if (lineRanges?.at(-1)?.[1] > lineCount) {
    throw new Error(`Line ranges exceed the length of ${testPath}.`)
  }

  return { source, lineStarts }
}

function collectVerification(projectDirectory, environment) {
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

  const scoped = environment.OMP_VERIFIER_PR_SCOPE !== undefined
  let scope
  let testFiles
  let compareTestSource
  try {
    if (scoped) {
      scope = readPrScope(environment)
      testFiles = scopedTestFiles(root, scope)
    } else {
      testFiles = changedTestFiles(root, environment).map((testPath) => ({ testPath }))
    }
  } catch (error) {
    if (scoped) {
      return invalidPrScope(error.message)
    }

    return result(
      "BLOCKED",
      "Changed files could not be inspected.",
      "Git returned an unexpected error while reading the configured base diff or worktree diff.",
      "Set MARLENS_TEST_ALIGNMENT_BASE to an accessible PR base ref, or confirm Git can inspect the active project."
    )
  }

  if (testFiles.length === 0) {
    return result(
      "PASS",
      "No changed test files require alignment review.",
      scoped
        ? "The captured PR scope contains no eligible test source lines or whole files."
        : "The worktree diff contains no changed test files.",
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

  for (const { testPath, lineRanges, wholeFile } of testFiles) {
    const suppression = matchingSuppression(suppressions, testPath)
    let testSource
    if (!suppression || lineRanges?.length) {
      try {
        testSource = readTestSource(root, testPath, lineRanges)
      } catch (error) {
        if (scoped) {
          return invalidPrScope(error.message)
        }

        throw error.cause ?? error
      }
    }

    if (suppression) {
      suppressed.push(`${testPath} (${suppression.path}: ${suppression.reason})`)
      continue
    }

    const guidance = guidanceForTest(root, testPath)
    const { source, lineStarts } = testSource

    const eligibleRanges = wholeFile ? undefined : lineRanges
    const blocks = testBlocks(source, testPath)
    let assertionPreimage
    configured.push(`${testPath} (${guidance.size} rule${guidance.size === 1 ? "" : "s"})`)

    for (const block of blocks) {
      for (const [directive, ruleSource] of guidance) {
        const finding = DIRECTIVES[directive].check(block, source, testPath)
        if (!finding) continue

        let line = eligibleFindingLine(block, finding.spans, lineStarts, eligibleRanges)
        if (
          line === undefined &&
          eligibleRanges &&
          directive === "one-direct-expect" &&
          finding.spans.length === 0 &&
          block.callbackBodySpan
        ) {
          const bodyLines = block.callbackBodySpan.map((offset) => lineAtOffset(lineStarts, offset))
          if (firstChangedLine(eligibleRanges, ...bodyLines) !== undefined) {
            try {
              compareTestSource ??= createPrComparison(root, scope)
              assertionPreimage ??= prepareAssertionPreimage(compareTestSource(testPath, lineRanges))
              line = removedAssertionLine(block, lineStarts, bodyLines, assertionPreimage)
            } catch (error) {
              return invalidPrScope(error.message)
            }
          }
        }

        if (line === undefined) continue

        const code = source.slice(lineStarts[line - 1], lineStarts[line]).trim()

        violations.push({
          evidence: formatViolation(testPath, line, code, ruleSource, finding.reason),
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
    configured.length === 0
      ? "Changed test files are covered by a scoped test-alignment suppression."
      : scoped
        ? "No test-alignment violations were found at eligible PR locations."
        : "Changed test files follow shared baseline and local alignment guidance.",
    `${inspected}${skipped}`.trim(),
    "No follow-up check is required."
  )
}

export function runVerification(
  projectDirectory = process.cwd(),
  environment = process.env,
  { full = false } = {}
) {
  const verification = collectVerification(projectDirectory, environment)
  if (full || verification.evidence.length <= MAX_EVIDENCE_LENGTH) return verification

  const notice =
    `\n… Evidence shortened from ${verification.evidence.length} characters. ` +
    "For complete diagnostics, run this test-alignment.mjs entry with --full " +
    "from the same project directory and scope environment."
  const available = MAX_EVIDENCE_LENGTH - notice.length
  const lastLineEnd = verification.evidence.lastIndexOf("\n", available)
  const end = lastLineEnd > 0 ? lastLineEnd : available
  verification.evidence = verification.evidence.slice(0, end) + notice
  return verification
}

if (isMainModule(import.meta.url)) {
  const verification = runVerification(process.cwd(), process.env, {
    full: process.argv.includes("--full"),
  })
  process.stdout.write(`${JSON.stringify(verification)}\n`)
  if (verification.status !== "PASS") process.exitCode = 1
}
