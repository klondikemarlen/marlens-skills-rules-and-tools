import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { runVerification } from "../verifications/typescript-runtime-entrypoints.mjs"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const typescriptBin = path.join(packageRoot, "node_modules/typescript/bin/tsc")
const tsNodeBin = path.join(packageRoot, "node_modules/ts-node/dist/bin.js")

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

function compilerWrapper(projectDirectory, name, compiler, argumentsList) {
  return writeWrapper(
    projectDirectory,
    name,
    `const { status } = require('node:child_process').spawnSync(process.execPath, [${JSON.stringify(
      compiler
    )}, ...${JSON.stringify(argumentsList)}], { stdio: 'inherit' }); process.exit(status ?? 1)`
  )
}

function configuration(runtimeCommand, fullTypecheck, overrides = {}) {
  return {
    typescriptRuntimeEntrypoints: {
      commands: [{ name: "API", command: runtimeCommand }],
      fullTypecheck,
      declarations: [
        {
          path: "types/runtime-request/index.d.ts",
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
  const fullTypecheck = compilerWrapper(projectDirectory, "full-typecheck", typescriptBin, [
    "--noEmit",
  ])
  const lazyRuntime = compilerWrapper(projectDirectory, "lazy-runtime", tsNodeBin, [
    "--typeCheck",
    "--project",
    "tsconfig.json",
    "src/runtime.ts",
  ])
  const markerPath = path.join(projectDirectory, "wrapper-ran")
  const markerWrapper = writeWrapper(
    projectDirectory,
    "runtime-marker",
    `require('node:fs').writeFileSync(${JSON.stringify(markerPath)}, 'ran')`
  )

  write(
    projectDirectory,
    "package.json",
    JSON.stringify({ scripts: { api: "ts-node-dev src/runtime.ts" } })
  )
  write(
    projectDirectory,
    "tsconfig.json",
    JSON.stringify({ include: ["src/**/*.ts", "types/**/*.d.ts"] })
  )
  write(
    projectDirectory,
    "types/ambient.d.ts",
    "interface RuntimeRequest { signal: AbortSignal }\n"
  )
  write(
    projectDirectory,
    "src/runtime.ts",
    "const request: RuntimeRequest = { signal: new AbortController().signal }\nvoid request\n"
  )

  execFileSync(fullTypecheck[0], fullTypecheck.slice(1), { cwd: projectDirectory })
  assert.throws(
    () =>
      execFileSync(lazyRuntime[0], lazyRuntime.slice(1), {
        cwd: projectDirectory,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    /RuntimeRequest/u
  )

  const missingConfiguration = runVerification(projectDirectory)
  assert.equal(missingConfiguration.status, "BLOCKED")
  assert.match(missingConfiguration.evidence, /api/u)
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(
      configuration(lazyRuntime, fullTypecheck, {
        declarations: [{ path: "types/ambient.d.ts", kind: "ambient" }],
      })
    )
  )
  const ambientFailure = runVerification(projectDirectory)
  assert.equal(ambientFailure.status, "FAIL")
  assert.match(ambientFailure.summary, /ambient include declarations/u)
  assert.match(ambientFailure.evidence, /RuntimeRequest/u)

  rmSync(path.join(projectDirectory, "types/ambient.d.ts"))
  write(
    projectDirectory,
    "tsconfig.json",
    JSON.stringify({ compilerOptions: { typeRoots: ["./types"] }, include: ["src/**/*.ts"] })
  )
  write(
    projectDirectory,
    "types/runtime-request/index.d.ts",
    "interface RuntimeRequest { signal: AbortSignal }\n"
  )
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(lazyRuntime, fullTypecheck))
  )
  const globalPassing = runVerification(projectDirectory)
  assert.equal(globalPassing.status, "PASS")
  assert.match(
    globalPassing.evidence,
    /types\/runtime-request\/index\.d\.ts is a package-shaped global declaration/u
  )

  write(
    projectDirectory,
    "src/request-context.ts",
    "export type RuntimeRequest = { signal: AbortSignal }\n"
  )
  write(
    projectDirectory,
    "src/runtime.ts",
    'import type { RuntimeRequest } from "./request-context"\n\nconst request: RuntimeRequest = { signal: new AbortController().signal }\nvoid request\n'
  )
  write(projectDirectory, "tsconfig.json", JSON.stringify({ include: ["src/**/*.ts"] }))
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(
      configuration(lazyRuntime, fullTypecheck, {
        declarations: [{ path: "src/request-context.ts", kind: "local" }],
      })
    )
  )
  const localPassing = runVerification(projectDirectory)
  assert.equal(localPassing.status, "PASS")
  assert.match(localPassing.evidence, /src\/request-context\.ts is configured as local/u)

  write(
    projectDirectory,
    "tsconfig.json",
    JSON.stringify({ compilerOptions: { typeRoots: ["./types"] }, include: ["src/**/*.ts"] })
  )
  write(
    projectDirectory,
    "src/runtime.ts",
    'import "../types/runtime-request"\n\nconst request: RuntimeRequest = { signal: new AbortController().signal }\nvoid request\n'
  )
  write(
    projectDirectory,
    ".marlens-verifications.json",
    JSON.stringify(configuration(lazyRuntime, fullTypecheck))
  )
  const sideEffectImport = runVerification(projectDirectory)
  assert.equal(sideEffectImport.status, "FAIL")
  assert.match(sideEffectImport.summary, /side-effect imports/u)
  assert.match(sideEffectImport.evidence, /src\/runtime\.ts/u)

  write(
    projectDirectory,
    "src/runtime.ts",
    "const request: RuntimeRequest = { signal: new AbortController().signal }\nvoid request\n"
  )
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
