import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { runVerification } from "../verifications/barrel-only-indexes.mjs"

function write(projectDirectory, relativePath, contents) {
  const filePath = path.join(projectDirectory, relativePath)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, contents)
}

function configure(projectDirectory, configuration) {
  write(projectDirectory, ".marlens-verifications.json", JSON.stringify(configuration))
}

const projectDirectory = mkdtempSync(path.join(os.tmpdir(), "marlens-barrel-only-indexes-"))
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), "marlens-barrel-only-indexes-"))
try {
  execFileSync("git", ["init", "--quiet"], { cwd: projectDirectory })
  write(projectDirectory, ".gitignore", "src/lib/ignored/\n")

  // Static barrels may re-export modules, import bindings, and bundle imported defaults.
  write(
    projectDirectory,
    "src/lib/grouping/index.ts",
    [
      'export { group } from "./group.js"',
      'export type { GroupOptions } from "./types.js"',
      'export * as grouping from "./grouping.js"',
      'export * from "./all.js"',
      'import defaultThing, { namedThing as localThing } from "./things.js"',
      'import * as namespace from "./namespace.js"',
      "export { localThing, defaultThing, namespace }",
      "export default { defaultThing, alias: localThing, namespace }",
      "export {}",
      "",
    ].join("\n")
  )
  write(projectDirectory, "src/lib/grouping/index.mts", 'export { type Shape } from "./shape.js"\n')
  write(
    projectDirectory,
    "src/lib/grouping/index.d.ts",
    "export function declarationOnly(): void\n"
  )
  write(projectDirectory, "node_modules/dep/lib/index.ts", "export function dependencyCode() {}\n")
  write(projectDirectory, "src/lib/ignored/index.ts", "export function ignoredCode() {}\n")
  write(projectDirectory, "src/not-lib/index.ts", "export function outsideDefaultScope() {}\n")

  const acceptedBarrels = runVerification(projectDirectory)
  assert.equal(acceptedBarrels.status, "PASS")
  assert.match(acceptedBarrels.evidence, /src\/lib\/grouping\/index\.ts/u)
  assert.match(acceptedBarrels.evidence, /src\/lib\/grouping\/index\.mts/u)
  assert.doesNotMatch(
    acceptedBarrels.evidence,
    /node_modules\/dep|outsideDefaultScope|ignoredCode/u
  )

  // Executable exports and implementation statements must fail with a useful source location.
  write(projectDirectory, "src/lib/functions/index.ts", "export function run() {}\n")
  write(projectDirectory, "src/lib/variables/index.ts", "export const version = 1\n")
  write(projectDirectory, "src/lib/side-effect/index.ts", 'import "./register.js"\n')
  write(projectDirectory, "src/lib/default-call/index.ts", "export default createApi()\n")
  write(
    projectDirectory,
    "src/lib/non-import-export/index.ts",
    "const value = 1\nexport { value }\n"
  )
  const executableCode = runVerification(projectDirectory)
  assert.equal(executableCode.status, "FAIL")
  for (const relativePath of [
    "src/lib/functions/index.ts",
    "src/lib/variables/index.ts",
    "src/lib/side-effect/index.ts",
    "src/lib/default-call/index.ts",
    "src/lib/non-import-export/index.ts",
  ]) {
    assert.ok(
      executableCode.evidence.includes(relativePath),
      `Missing offending path ${relativePath}`
    )
  }

  // Configured roots replace the default lib scope; exact, reasoned entrypoints are exempt.
  write(projectDirectory, "src/custom/index.ts", "export function customCode() {}\n")
  write(projectDirectory, "src/lib/runtime/index.ts", "export function runtimeCode() {}\n")
  configure(projectDirectory, {
    barrelOnlyIndexes: {
      roots: ["src/custom"],
      entrypoints: [
        { path: "src/custom/index.ts", reason: "Runtime registration by package loader" },
      ],
    },
  })
  const reasonedEntrypoint = runVerification(projectDirectory)
  assert.equal(reasonedEntrypoint.status, "PASS")
  assert.match(reasonedEntrypoint.evidence, /src\/custom\/index\.ts/u)
  assert.match(reasonedEntrypoint.evidence, /Runtime registration by package loader/u)
  assert.doesNotMatch(reasonedEntrypoint.evidence, /src\/lib\/runtime\/index\.ts/u)
  // An empty configured scope is explicitly reported as N/A, not as inspected code.
  configure(projectDirectory, { barrelOnlyIndexes: { roots: ["empty-scope"] } })
  const emptyScope = runVerification(projectDirectory)
  assert.equal(emptyScope.status, "PASS")
  assert.match(`${emptyScope.summary}\n${emptyScope.evidence}`, /N\/A|no applicable/u)

  configure(projectDirectory, { barrelOnlyIndexes: { roots: ["src/custom"] } })
  const customRootScanned = runVerification(projectDirectory)
  assert.equal(customRootScanned.status, "FAIL")
  assert.match(customRootScanned.evidence, /src\/custom\/index\.ts/u)

  // Changed-path filtering limits the scan; touching config forces a full rescan.
  configure(projectDirectory, { barrelOnlyIndexes: { roots: ["src/custom", "src/lib"] } })
  const changedPathPassing = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/lib/grouping/index.ts"]),
  })
  assert.equal(changedPathPassing.status, "PASS")
  assert.doesNotMatch(changedPathPassing.evidence, /src\/custom\/index\.ts/u)
  const configChangeFullScan = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify([".marlens-verifications.json"]),
  })
  assert.equal(configChangeFullScan.status, "FAIL")
  assert.match(configChangeFullScan.evidence, /src\/custom\/index\.ts/u)

  // Deleted tracked entries are not read as eligible source files.
  write(projectDirectory, "src/lib/deleted/index.ts", "export function deletedCode() {}\n")
  execFileSync("git", ["add", "src/lib/deleted/index.ts"], { cwd: projectDirectory })
  execFileSync(
    "git",
    [
      "-c",
      "user.email=verification@example.test",
      "-c",
      "user.name=Verification",
      "commit",
      "--quiet",
      "-m",
      "Track deletion fixture",
    ],
    { cwd: projectDirectory }
  )
  rmSync(path.join(projectDirectory, "src/lib/deleted/index.ts"))
  const deletedPathSkipped = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/lib/deleted/index.ts"]),
  })
  assert.equal(deletedPathSkipped.status, "PASS")
  assert.doesNotMatch(deletedPathSkipped.evidence, /src\/lib\/deleted\/index\.ts/u)

  // Invalid changed-path input and invalid config must block rather than silently pass.
  for (const changedPaths of [
    "{",
    "[1]",
    JSON.stringify(["../outside.ts"]),
    JSON.stringify(["C:\\outside.ts"]),
  ]) {
    const invalidChangedPaths = runVerification(projectDirectory, {
      OMP_VERIFIER_CHANGED_PATHS: changedPaths,
    })
    assert.equal(invalidChangedPaths.status, "BLOCKED")
  }
  for (const invalidConfiguration of [
    "{",
    JSON.stringify({ barrelOnlyIndexes: { unexpected: true } }),
    JSON.stringify({ barrelOnlyIndexes: { roots: ["../outside"] } }),
    JSON.stringify({
      barrelOnlyIndexes: { entrypoints: [{ path: "src/lib/runtime/index.ts", reason: " " }] },
    }),
  ]) {
    write(projectDirectory, ".marlens-verifications.json", invalidConfiguration)
    const invalidConfig = runVerification(projectDirectory)
    assert.equal(invalidConfig.status, "BLOCKED")
  }

  // Parser and filesystem errors retain the precise path and block the result.
  configure(projectDirectory, { barrelOnlyIndexes: {} })
  write(projectDirectory, "src/lib/syntax/index.ts", "export { from } from ;\n")
  const syntaxError = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/lib/syntax/index.ts"]),
  })
  assert.equal(syntaxError.status, "BLOCKED")
  assert.match(syntaxError.evidence, /src\/lib\/syntax\/index\.ts/u)

  const unreadableRelativePath = "src/lib/unreadable/index.ts"
  const unreadablePath = path.join(projectDirectory, unreadableRelativePath)
  mkdirSync(path.join(projectDirectory, "src/lib/unreadable/target"), { recursive: true })
  symlinkSync("target", unreadablePath)
  const readFailure = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify([unreadableRelativePath]),
  })
  assert.equal(readFailure.status, "BLOCKED")
  assert.match(readFailure.evidence, /src\/lib\/unreadable\/index\.ts/u)

  // A shorthand initializer is malformed object syntax even when parsing defers the error.
  write(
    projectDirectory,
    "src/lib/shorthand-initializer/index.ts",
    'import { item } from "./item.js"\nexport default { item = initialize() }\n'
  )
  const shorthandInitializer = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/lib/shorthand-initializer/index.ts"]),
  })
  assert.equal(shorthandInitializer.status, "BLOCKED")
  assert.match(shorthandInitializer.evidence, /src\/lib\/shorthand-initializer\/index\.ts:2/u)

  // Existing dangling links are unreadable source, not deleted candidates.
  for (const kind of ["tracked", "untracked"]) {
    const relativePath = `src/lib/dangling-${kind}/index.ts`
    const sourcePath = path.join(projectDirectory, relativePath)
    mkdirSync(path.dirname(sourcePath), { recursive: true })
    symlinkSync("missing.ts", sourcePath)
    if (kind === "tracked") {
      execFileSync("git", ["add", relativePath], { cwd: projectDirectory })
    }

    const danglingSource = runVerification(projectDirectory, {
      OMP_VERIFIER_CHANGED_PATHS: JSON.stringify([relativePath]),
    })
    assert.equal(danglingSource.status, "BLOCKED")
    assert.ok(danglingSource.evidence.includes(relativePath))
  }

  // Existing source links are unsupported even when their targets are valid static barrels.
  const linkedSource = path.join(projectDirectory, "src/lib/linked/index.ts")
  mkdirSync(path.dirname(linkedSource), { recursive: true })
  symlinkSync("../grouping/index.ts", linkedSource)
  const indirectSource = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/lib/linked/index.ts"]),
  })
  assert.equal(indirectSource.status, "BLOCKED")
  assert.match(indirectSource.evidence, /src\/lib\/linked\/index\.ts.*regular file/u)

  // Reject indirect configuration rather than miss edits to an untriggered symlink target.
  write(projectDirectory, "config/verifications.json", '{"barrelOnlyIndexes": {}}\n')
  rmSync(path.join(projectDirectory, ".marlens-verifications.json"))
  symlinkSync(
    "config/verifications.json",
    path.join(projectDirectory, ".marlens-verifications.json")
  )
  const indirectConfiguration = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["config/verifications.json"]),
  })
  assert.equal(indirectConfiguration.status, "BLOCKED")
  assert.match(indirectConfiguration.evidence, /\.marlens-verifications\.json/u)

  assert.equal(runVerification(nonGitProject).status, "BLOCKED")
  console.log("Barrel-only index verification checks passed")
} finally {
  rmSync(projectDirectory, { recursive: true, force: true })
  rmSync(nonGitProject, { recursive: true, force: true })
}
