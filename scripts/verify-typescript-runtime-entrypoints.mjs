import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { runVerification } from "../verifications/typescript-runtime-entrypoints.mjs"

function write(projectDirectory, relativePath, contents) {
  const filePath = path.join(projectDirectory, relativePath)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, contents)
}

function writeWrapper(projectDirectory, name, source) {
  const relativePath = `bin/${name}`
  write(projectDirectory, relativePath, `#!/usr/bin/env node\n${source}\n`)
  const wrapperPath = path.join(projectDirectory, relativePath)
  chmodSync(wrapperPath, 0o755)
  execFileSync("git", ["add", relativePath], { cwd: projectDirectory })
  return [`./${relativePath}`]
}

function configuration(runtimeCommand, fullTypecheck, overrides = {}) {
  return {
    typescriptRuntimeEntrypoints: {
      commands: [{ name: "API", command: runtimeCommand }],
      fullTypecheck,
      declarations: [
        {
          path: "types/query-options/index.d.ts",
          kind: "global",
        },
      ],
      ...overrides,
    },
  }
}

const projectDirectory = mkdtempSync(
  path.join(os.tmpdir(), "marlens-typescript-runtime-entrypoints-")
)
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), "marlens-typescript-runtime-entrypoints-"))
try {
  execFileSync("git", ["init", "--quiet"], { cwd: projectDirectory })
  const runtimeFailure = writeWrapper(
    projectDirectory,
    "runtime-failure",
    "console.error('Property signal does not exist'); process.exit(1)"
  )
  const runtimePassing = writeWrapper(projectDirectory, "runtime-passing", "process.exit(0)")
  const fullTypecheck = writeWrapper(projectDirectory, "full-typecheck", "process.exit(0)")
  const markerPath = path.join(projectDirectory, "wrapper-ran")
  const markerWrapper = writeWrapper(
    projectDirectory,
    "runtime-marker",
    `require('node:fs').writeFileSync(${JSON.stringify(markerPath)}, 'ran')`
  )

  write(
    projectDirectory,
    "package.json",
    JSON.stringify({ scripts: { api: "ts-node-dev src/app.ts" } })
  )
  write(
    projectDirectory,
    "tsconfig.json",
    JSON.stringify({ compilerOptions: { typeRoots: ["./types"] } })
  )
  write(projectDirectory, "types/query-options/index.d.ts", "declare interface QueryOptions {}\n")
  write(projectDirectory, "src/app.ts", "export const started = true\n")

  const missingConfiguration = runVerification(projectDirectory)
  assert.equal(missingConfiguration.status, "BLOCKED")
  assert.match(missingConfiguration.evidence, /api/u)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(runtimeFailure, fullTypecheck))
  )
  const lazyRuntimeFailure = runVerification(projectDirectory)
  assert.equal(lazyRuntimeFailure.status, "FAIL")
  assert.match(lazyRuntimeFailure.summary, /global declaration/u)
  assert.match(lazyRuntimeFailure.evidence, /full type-check passed/u)
  assert.match(lazyRuntimeFailure.evidence, /Property signal/u)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(runtimePassing, fullTypecheck))
  )
  const globalPassing = runVerification(projectDirectory)
  assert.equal(globalPassing.status, "PASS")
  assert.match(
    globalPassing.evidence,
    /types\/query-options\/index\.d\.ts is a package-shaped global declaration/u
  )

  write(
    projectDirectory,
    "src/request-context.ts",
    "export type RequestContext = { signal: AbortSignal }\n"
  )
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(
      configuration(runtimePassing, fullTypecheck, {
        declarations: [{ path: "src/request-context.ts", kind: "local" }],
      })
    )
  )
  const localPassing = runVerification(projectDirectory)
  assert.equal(localPassing.status, "PASS")
  assert.match(localPassing.evidence, /src\/request-context\.ts is configured as local/u)

  write(projectDirectory, "types/ambient.d.ts", "declare interface Ambient {}\n")
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(
      configuration(runtimePassing, fullTypecheck, {
        declarations: [{ path: "types/ambient.d.ts", kind: "global" }],
      })
    )
  )
  const invalidGlobal = runVerification(projectDirectory)
  assert.equal(invalidGlobal.status, "BLOCKED")
  assert.match(invalidGlobal.summary, /package-shaped/u)

  write(projectDirectory, "src/app.ts", 'import "../types/query-options"\n')
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(runtimePassing, fullTypecheck))
  )
  const sideEffectImport = runVerification(projectDirectory)
  assert.equal(sideEffectImport.status, "FAIL")
  assert.match(sideEffectImport.summary, /side-effect imports/u)
  assert.match(sideEffectImport.evidence, /src\/app\.ts/u)

  write(projectDirectory, "src/app.ts", "export const started = true\n")
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(markerWrapper, fullTypecheck))
  )
  const wrapperPassing = runVerification(projectDirectory)
  assert.equal(wrapperPassing.status, "PASS")
  assert.equal(existsSync(markerPath), true)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(["rm", "-rf", "."], fullTypecheck))
  )
  const unsafeCommand = runVerification(projectDirectory)
  assert.equal(unsafeCommand.status, "BLOCKED")
  assert.match(unsafeCommand.evidence, /tracked executable project wrapper/u)

  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify({ typescriptRuntimeEntrypoints: false })
  )
  const optedOut = runVerification(projectDirectory)
  assert.equal(optedOut.status, "PASS")
  assert.match(optedOut.summary, /explicitly disabled/u)

  assert.equal(runVerification(nonGitProject).status, "BLOCKED")
  console.log("TypeScript runtime entrypoint verification checks passed")
} finally {
  rmSync(projectDirectory, { recursive: true, force: true })
  rmSync(nonGitProject, { recursive: true, force: true })
}
