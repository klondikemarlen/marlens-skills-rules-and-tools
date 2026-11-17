import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const packageDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(readFileSync(path.join(packageDirectory, "package.json"), "utf8"))
const verifications = manifest.omp.verifications.filter((verification) => verification.entry)
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "marlens-verifier-entrypoints-"))
const projectDirectory = path.join(temporaryDirectory, "project")
const nonGitDirectory = path.join(temporaryDirectory, "non-git")
const linkedPackageDirectory = path.join(temporaryDirectory, "linked-package")
const nodeOptions = [
  [],
  ["--preserve-symlinks"],
  ["--preserve-symlinks-main"],
  ["--preserve-symlinks", "--preserve-symlinks-main"],
]
const environment = { ...process.env }
for (const name of Object.keys(environment)) {
  if (name.startsWith("GIT_") || name.startsWith("OMP_VERIFIER_") || name.startsWith("MARLENS_")) {
    delete environment[name]
  }
}
delete environment.NODE_OPTIONS

function run(entry, cwd, flags = [], argumentsList = []) {
  const execution = spawnSync(process.execPath, [...flags, entry, ...argumentsList], {
    cwd,
    env: environment,
    encoding: "utf8",
    timeout: 30000,
  })
  assert.ifError(execution.error)
  assert.equal(execution.signal, null)
  assert.ok(execution.stdout.endsWith("\n"), `${entry}: missing JSON output`)
  const result = JSON.parse(execution.stdout)
  assert.ok(["PASS", "FAIL", "BLOCKED"].includes(result.status))
  for (const field of ["summary", "evidence", "nextCheck"]) {
    assert.equal(typeof result[field], "string", `${entry}: missing ${field}`)
  }
  return { exitCode: execution.status, result }
}

try {
  mkdirSync(projectDirectory)
  mkdirSync(nonGitDirectory)
  symlinkSync(packageDirectory, linkedPackageDirectory, "dir")
  execFileSync("git", ["init", "--quiet", projectDirectory], { env: environment })
  writeFileSync(path.join(projectDirectory, "README.md"), "# Invocation Fixture\n")
  execFileSync("git", ["add", "README.md"], { cwd: projectDirectory, env: environment })
  execFileSync("git", [
    "-c", "user.name=Verification Fixture",
    "-c", "user.email=fixture@example.com",
    "-c", "core.hooksPath=/dev/null",
    "commit", "--quiet", "--no-gpg-sign", "-m", "Baseline fixture",
  ], { cwd: projectDirectory, env: environment })

  for (const verification of verifications) {
    const entry = path.resolve(packageDirectory, verification.entry)
    const linkedEntry = path.resolve(linkedPackageDirectory, verification.entry)
    const fileLink = path.join(temporaryDirectory, path.basename(entry))
    symlinkSync(entry, fileLink)

    for (const [cwd, expectedStatus] of [[projectDirectory, "PASS"], [nonGitDirectory, "BLOCKED"]]) {
      const direct = run(entry, cwd, [], ["--full"])
      assert.equal(direct.result.status, expectedStatus, verification.id)
      const expectedExit = verification.id === "marlens-rules:test-alignment" && expectedStatus !== "PASS" ? 1 : 0
      assert.equal(direct.exitCode, expectedExit, verification.id)

      for (const flags of nodeOptions) {
        const invokedPaths = [entry, linkedEntry]
        // Preserving a standalone file-link path changes Node's relative import root.
        if (!flags.includes("--preserve-symlinks-main")) {
          invokedPaths.push(fileLink, path.relative(cwd, fileLink))
        }
        for (const invokedPath of invokedPaths) {
          assert.deepEqual(run(invokedPath, cwd, flags, ["--full"]), direct, `${verification.id}: ${flags} ${invokedPath}`)
        }
      }
    }

    for (const argvPath of [undefined, path.join(temporaryDirectory, "missing-host"), path.join(projectDirectory, "README.md")]) {
      for (const importedEntry of [entry, linkedEntry, fileLink]) {
        const source = `process.argv[1] = ${JSON.stringify(argvPath)};
          const verification = await import(${JSON.stringify(pathToFileURL(importedEntry).href)});
          if (typeof verification.runVerification !== "function") throw new Error("Missing API");
          process.stdout.write("imported\\n");`
        const imported = spawnSync(process.execPath, ["--input-type=module", "--eval", source], {
          cwd: nonGitDirectory,
          env: environment,
          encoding: "utf8",
          timeout: 30000,
        })
        assert.ifError(imported.error)
        assert.equal(imported.status, 0, imported.stderr)
        assert.equal(imported.stdout, "imported\n", verification.id)
        assert.equal(imported.stderr, "", verification.id)
      }
    }
  }

  writeFileSync(path.join(projectDirectory, "README.md"), "<!-- marlens-test-alignment: test-name-when -->")
  writeFileSync(path.join(projectDirectory, "widget.test.ts"), "test('saves widget', () => { expect(true).toEqual(true) })\n")
  execFileSync("git", ["add", "widget.test.ts"], { cwd: projectDirectory, env: environment })

  for (const [filename, expectedExit, evidence] of [
    ["final-newlines.mjs", 0, /README\.md/],
    ["test-alignment.mjs", 1, /widget\.test\.ts/],
  ]) {
    const direct = run(path.join(packageDirectory, "verifications", filename), projectDirectory, [], ["--full"])
    assert.equal(direct.result.status, "FAIL")
    assert.equal(direct.exitCode, expectedExit)
    assert.match(direct.result.evidence, evidence)
    assert.deepEqual(run(path.join(linkedPackageDirectory, "verifications", filename), projectDirectory, [], ["--full"]), direct)
    assert.deepEqual(run(path.join(temporaryDirectory, filename), projectDirectory, [], ["--full"]), direct)
  }

  console.log(`Verification entrypoint checks passed for ${verifications.length} executables`)
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
