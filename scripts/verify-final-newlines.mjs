import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"

import { runVerification } from "../verifications/final-newlines.mjs"

const projectDirectory = mkdtempSync(path.join(os.tmpdir(), "marlens-final-newlines-"))
const outsideDirectory = mkdtempSync(path.join(os.tmpdir(), "marlens-final-newlines-outside-"))

function write(relativePath, contents) {
  const filePath = path.join(projectDirectory, relativePath)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, contents)
}

function check(...paths) {
  return runVerification(projectDirectory, { OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(paths) })
}

function git(...args) {
  return execFileSync("git", args, { cwd: projectDirectory, stdio: "pipe" })
}

try {
  git("init", "--quiet")
  write("settings.yaml", "auto: true")
  git("add", "settings.yaml")
  git(
    "-c",
    "user.name=QA",
    "-c",
    "user.email=qa@example.invalid",
    "commit",
    "-qm",
    "Initial fixture"
  )
  write("settings.yaml", "auto: false")
  git("diff", "--check")
  const missingNewline = check("settings.yaml")
  assert.equal(missingNewline.status, "FAIL")
  assert.match(missingNewline.evidence, /settings\.yaml/u)
  assert.doesNotMatch(missingNewline.evidence, /auto: false/u)
  assert.equal(readFileSync(path.join(projectDirectory, "settings.yaml"), "utf8"), "auto: false")

  write("settings.yaml", "auto: false\n")
  assert.equal(check("settings.yaml").status, "PASS")

  const crlf = Buffer.from('{\r\n  "active": true\r\n}\r\n')
  write("settings.json", crlf)
  assert.equal(check("settings.json").status, "PASS")
  assert.deepEqual(readFileSync(path.join(projectDirectory, "settings.json")), crlf)
  write("settings.json", crlf.subarray(0, crlf.length - 2))
  assert.equal(check("settings.json").status, "FAIL")
  write("settings.json", crlf)

  write(".config", "secret-value")
  assert.equal(check(".config").status, "FAIL")
  assert.equal(check("settings.yaml").status, "PASS")
  assert.equal(runVerification(projectDirectory, {}).status, "FAIL")

  write("empty", "")
  write("binary", Buffer.from([0, 255, 10, 1]))
  write("encoded.bin", Buffer.from([255, 128, 1]))
  symlinkSync("missing-target", path.join(projectDirectory, "link"))
  git("rm", "-f", "settings.yaml")
  assert.equal(check("empty", "binary", "encoded.bin", "link", "settings.yaml").status, "PASS")

  write("utf16.txt", Buffer.from("\ufeffdata\r\n", "utf16le"))
  assert.equal(check("utf16.txt").status, "PASS")
  write("utf16.txt", Buffer.from("\ufeffdata", "utf16le"))
  assert.equal(check("utf16.txt").status, "FAIL")
  write("utf16.txt", Buffer.from("\ufeffdata\n", "utf16le").swap16())
  assert.equal(check("utf16.txt").status, "PASS")
  write("utf16.txt", Buffer.from([255, 254, 97]))
  assert.equal(check("utf16.txt").status, "BLOCKED")

  write("unreadable", "text\n")
  chmodSync(path.join(projectDirectory, "unreadable"), 0)
  try {
    if (process.getuid?.() !== 0) assert.equal(check("unreadable").status, "BLOCKED")
  } finally {
    chmodSync(path.join(projectDirectory, "unreadable"), 0o600)
  }

  write("nested/file", "data\n")
  git("add", "nested/file")
  rmSync(path.join(projectDirectory, "nested"), { recursive: true })
  writeFileSync(path.join(outsideDirectory, "file"), "private-outside-content")
  symlinkSync(outsideDirectory, path.join(projectDirectory, "nested"))
  assert.equal(check("nested/file").status, "BLOCKED")

  for (const invalidInput of ["null", "{}", '["../outside"]', "[42]", "not-json"]) {
    assert.equal(
      runVerification(projectDirectory, { OMP_VERIFIER_CHANGED_PATHS: invalidInput }).status,
      "BLOCKED"
    )
  }
  assert.equal(runVerification(outsideDirectory, {}).status, "BLOCKED")

  write(
    ".marlens-verifications.json",
    JSON.stringify({
      finalNewlines: {
        exclusions: [{ path: ".config", reason: "Exact-byte external fixture format." }],
      },
    }) + "\n"
  )
  const excluded = check(".config")
  assert.equal(excluded.status, "PASS")
  assert.match(excluded.evidence, /Exact-byte external fixture format/u)
  assert.equal(check(".marlens-verifications.json").status, "BLOCKED")
  write(
    ".marlens-verifications.json",
    JSON.stringify({
      finalNewlines: { exclusions: [{ path: ".config", reason: "" }] },
    }) + "\n"
  )
  assert.equal(check(".config").status, "BLOCKED")
  write(".marlens-verifications.json", "invalid-json\n")
  assert.equal(check(".config").status, "BLOCKED")

  console.log(
    "Final-newline behavior checks passed: failure/correction, scoped selection, byte preservation, exclusions, and unreadable inputs."
  )
} finally {
  rmSync(projectDirectory, { recursive: true, force: true })
  rmSync(outsideDirectory, { recursive: true, force: true })
}
