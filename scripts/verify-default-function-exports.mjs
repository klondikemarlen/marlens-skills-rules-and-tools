import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { runVerification } from "../verifications/default-function-exports.mjs"

function write(projectDirectory, relativePath, contents) {
  const filePath = path.join(projectDirectory, relativePath)
  const directory = path.dirname(filePath)
  mkdirSync(directory, { recursive: true })
  writeFileSync(filePath, contents)
}

const projectDirectory = mkdtempSync(path.join(os.tmpdir(), "marlens-default-function-exports-"))
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), "marlens-default-function-exports-"))
try {
  execFileSync("git", ["init", "--quiet"], { cwd: projectDirectory })
  write(
    projectDirectory,
    "src/request.ts",
    "export default function isRequestDatabaseCancellationError() {\n  return false;\n}\n"
  )
  write(projectDirectory, "src/anonymous.ts", "export default function () {\n  return false;\n}\n")
  write(projectDirectory, "src/value.ts", "export default class RequestError {}\n")
  write(
    projectDirectory,
    "other/checked.ts",
    "export default function checkedOutsideConfiguredPath() {}\n"
  )
  write(
    projectDirectory,
    "node_modules/package/index.d.ts",
    "export default function dependencyDeclaration() {}\n"
  )

  const failing = runVerification(projectDirectory)
  assert.equal(failing.status, "FAIL")
  assert.match(
    failing.evidence,
    /src\/request\.ts:1 exports default function isRequestDatabaseCancellationError/u
  )
  assert.match(failing.evidence, /export function isRequestDatabaseCancellationError/u)
  assert.match(
    failing.evidence,
    /other\/checked\.ts:1 exports default function checkedOutsideConfiguredPath/u
  )
  assert.doesNotMatch(failing.evidence, /anonymous|RequestError/u)
  assert.doesNotMatch(failing.evidence, /node_modules|dependencyDeclaration/u)

  const scopedPassing = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/value.ts", "removed.ts"]),
  })
  assert.equal(scopedPassing.status, "PASS")
  assert.match(scopedPassing.evidence, /Inspected 1 TypeScript module/u)

  const scopedFailing = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["src/request.ts"]),
  })
  assert.equal(scopedFailing.status, "FAIL")
  assert.match(scopedFailing.evidence, /src\/request\.ts:1/u)
  assert.doesNotMatch(scopedFailing.evidence, /other\/checked\.ts/u)

  write(
    projectDirectory,
    "api/tests/@types/vitest/index.d.ts",
    "export type VitestContext = unknown\n"
  )
  execFileSync("git", ["add", "api/tests/@types/vitest/index.d.ts"], { cwd: projectDirectory })
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
      "Track deleted verification fixture",
    ],
    { cwd: projectDirectory }
  )
  rmSync(path.join(projectDirectory, "api/tests/@types/vitest/index.d.ts"))
  write(projectDirectory, "api/tests/@types/vitest.d.ts", "export type VitestContext = unknown\n")

  const deletedPathScopedPassing = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify([
      "api/tests/@types/vitest/index.d.ts",
      "api/tests/@types/vitest.d.ts",
    ]),
  })
  assert.equal(deletedPathScopedPassing.status, "PASS")
  assert.match(deletedPathScopedPassing.evidence, /Inspected 1 TypeScript module/u)

  rmSync(path.join(projectDirectory, "api/tests/@types/vitest.d.ts"))

  const unreadableRelativePath = "api/tests/@types/unreadable.d.ts"
  const unreadablePath = path.join(projectDirectory, unreadableRelativePath)
  mkdirSync(path.join(projectDirectory, "api/tests/@types/unreadable-target"))
  symlinkSync("unreadable-target", unreadablePath)

  const unreadable = runVerification(projectDirectory, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify([unreadableRelativePath]),
  })
  assert.equal(unreadable.status, "BLOCKED")
  assert.match(unreadable.evidence, /Cannot read api\/tests\/@types\/unreadable\.d\.ts/u)

  rmSync(unreadablePath)
  rmSync(path.join(projectDirectory, "api/tests/@types/unreadable-target"), { recursive: true })

  write(
    projectDirectory,
    "src/request.ts",
    "export function isRequestDatabaseCancellationError() {\n  return false;\n}\n\nexport default isRequestDatabaseCancellationError\n"
  )
  write(
    projectDirectory,
    "other/checked.ts",
    "export function checkedOutsideConfiguredPath() {}\n\nexport default checkedOutsideConfiguredPath\n"
  )
  const passing = runVerification(projectDirectory)
  assert.equal(passing.status, "PASS")
  assert.match(passing.evidence, /Inspected 4 TypeScript module/u)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify({
      defaultFunctionExports: false,
    })
  )
  const optedOut = runVerification(projectDirectory)
  assert.equal(optedOut.status, "PASS")
  assert.match(optedOut.summary, /explicitly disabled/u)
  write(
    projectDirectory,
    "src/request.ts",
    "export default function isRequestDatabaseCancellationError() {\n  return false;\n}\n"
  )
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify({
      defaultFunctionExports: { paths: ["src/**/*.ts"] },
    })
  )
  const invalid = runVerification(projectDirectory)
  assert.equal(invalid.status, "BLOCKED")
  assert.match(invalid.evidence, /must be false to opt out/u)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify({
      defaultFunctionExports: [],
    })
  )
  const invalidArray = runVerification(projectDirectory)
  assert.equal(invalidArray.status, "BLOCKED")
  assert.match(invalidArray.evidence, /must be false to opt out/u)

  assert.equal(runVerification(nonGitProject).status, "BLOCKED")

  console.log("Default function export verification checks passed")
} finally {
  rmSync(projectDirectory, { recursive: true, force: true })
  rmSync(nonGitProject, { recursive: true, force: true })
}
