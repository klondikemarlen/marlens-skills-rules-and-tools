import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const command = path.join(root, "bin/agent-worktree")

function runGit(repository, args) {
  const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

function createRepository() {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "agent-worktree-"))
  const repository = path.join(temporaryDirectory, "wrap")
  mkdirSync(repository)

  runGit(repository, ["init", "--initial-branch=main"])
  runGit(repository, ["config", "user.email", "tests@example.com"])
  runGit(repository, ["config", "user.name", "Test Runner"])
  writeFileSync(path.join(repository, "README.md"), "# Wrap\n")
  runGit(repository, ["add", "README.md"])
  runGit(repository, ["commit", "-m", "Initial commit"])

  return { repository, temporaryDirectory }
}

function runCommand(repository, args, env = {}) {
  return spawnSync(command, args, {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, ...env },
  })
}

function withRepository(callback) {
  const fixture = createRepository()

  try {
    callback(fixture)
  } finally {
    rmSync(fixture.temporaryDirectory, { force: true, recursive: true })
  }
}

function writeFakeDirenv(temporaryDirectory) {
  const fakeBinDirectory = path.join(temporaryDirectory, "fake-bin")
  const fakeDirenv = path.join(fakeBinDirectory, "direnv")
  mkdirSync(fakeBinDirectory)
  writeFileSync(
    fakeDirenv,
    `#!/usr/bin/env node
const fs = require("node:fs")
fs.writeFileSync(process.env.DIRENV_MARKER, process.cwd())
`
  )
  chmodSync(fakeDirenv, 0o755)

  return fakeBinDirectory
}

test("when local environment configuration is present, creates a conventional worktree", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    writeFileSync(path.join(repository, ".envrc"), "export WRAP=1\n")
    writeFileSync(path.join(repository, ".env"), "SECRET=keep-local\n")
    writeFileSync(path.join(repository, ".env.development"), "DEVELOPMENT=1\n")
    writeFileSync(
      path.join(repository, ".agent-worktree.json"),
      JSON.stringify({ copy: [".env.development"] })
    )

    const direnvDirectory = writeFakeDirenv(temporaryDirectory)
    const direnvMarker = path.join(temporaryDirectory, "direnv-cwd")
    const worktreePath = path.join(temporaryDirectory, "wrap-worktrees", "wrapx-243")

    // Act
    const result = runCommand(repository, ["wrapx-243"], {
      DIRENV_MARKER: direnvMarker,
      PATH: `${direnvDirectory}${path.delimiter}${process.env.PATH}`,
    })

    // Assert
    assert.deepEqual(
      { status: result.status, stdout: result.stdout, stderr: result.stderr },
      { status: 0, stdout: `${worktreePath}\n`, stderr: "" }
    )
    assert.equal(runGit(worktreePath, ["branch", "--show-current"]), "wrapx-243")
    assert.equal(readFileSync(path.join(worktreePath, ".envrc"), "utf8"), "export WRAP=1\n")
    assert.equal(
      readFileSync(path.join(worktreePath, ".env.development"), "utf8"),
      "DEVELOPMENT=1\n"
    )
    assert.equal(existsSync(path.join(worktreePath, ".env")), false)
    assert.equal(readFileSync(direnvMarker, "utf8"), worktreePath)
  })
})

test("when .envrc is a symlink, rejects it before creating a worktree", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    const externalEnvrc = path.join(temporaryDirectory, "external-envrc")
    const worktreePath = path.join(temporaryDirectory, "wrap-worktrees", "symlinked-envrc")
    writeFileSync(externalEnvrc, "export EXTERNAL=1\n")
    symlinkSync(externalEnvrc, path.join(repository, ".envrc"))

    // Act
    const result = runCommand(repository, ["symlinked-envrc"])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Copy paths must not be symbolic links/)
    assert.equal(existsSync(worktreePath), false)
  })
})

test("when a configured path crosses a symlinked directory, rejects it before copying", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    const externalDirectory = path.join(temporaryDirectory, "external")
    const worktreePath = path.join(temporaryDirectory, "wrap-worktrees", "symlinked-directory")
    mkdirSync(externalDirectory)
    writeFileSync(path.join(externalDirectory, "development.env"), "EXTERNAL=1\n")
    symlinkSync(externalDirectory, path.join(repository, "linked-local"))
    writeFileSync(
      path.join(repository, ".agent-worktree.json"),
      JSON.stringify({ copy: ["linked-local/development.env"] })
    )

    // Act
    const result = runCommand(repository, ["symlinked-directory"])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Copy paths must resolve inside the repository/)
    assert.equal(existsSync(worktreePath), false)
  })
})

test("when the requested branch worktree already exists, returns its path", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    const worktreePath = path.join(temporaryDirectory, "wrap-worktrees", "wrapx-244")

    // Act
    const created = runCommand(repository, ["wrapx-244"])
    const reused = runCommand(repository, ["wrapx-244"])

    // Assert
    assert.deepEqual(
      {
        created: { status: created.status, stdout: created.stdout, stderr: created.stderr },
        reused: { status: reused.status, stdout: reused.stdout, stderr: reused.stderr },
      },
      {
        created: { status: 0, stdout: `${worktreePath}\n`, stderr: "" },
        reused: { status: 0, stdout: `${worktreePath}\n`, stderr: "" },
      }
    )
  })
})

test("when branch options are provided, preserves the conventional worktree layout", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    const worktreePath = path.join(temporaryDirectory, "wrap-worktrees", "wrapx-396")

    // Act
    const result = runCommand(repository, [
      "wrapx-396",
      "--branch",
      "issue/396-worktree-command",
      "--base",
      "HEAD",
    ])

    // Assert
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, `${worktreePath}\n`)
    assert.equal(runGit(worktreePath, ["branch", "--show-current"]), "issue/396-worktree-command")
  })
})

test("when a worktree name is a single dot, rejects it before creating a worktree", () => {
  withRepository(({ repository }) => {
    // Arrange

    // Act
    const result = runCommand(repository, ["."])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Worktree names must be a single path segment/)
  })
})

test("when a worktree name is a double dot, rejects it before creating a worktree", () => {
  withRepository(({ repository }) => {
    // Arrange

    // Act
    const result = runCommand(repository, [".."])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Worktree names must be a single path segment/)
  })
})

test("when a worktree name escapes its path segment, rejects it before creating a worktree", () => {
  withRepository(({ repository }) => {
    // Arrange

    // Act
    const result = runCommand(repository, ["../outside"])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Worktree names must be a single path segment/)
  })
})

test("when the target path is user-owned, preserves it and rejects the worktree", () => {
  withRepository(({ repository, temporaryDirectory }) => {
    // Arrange
    const blockedPath = path.join(temporaryDirectory, "wrap-worktrees", "blocked")
    mkdirSync(blockedPath, { recursive: true })
    writeFileSync(path.join(blockedPath, "preserve-me"), "user data\n")

    // Act
    const result = runCommand(repository, ["blocked"])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Worktree path already exists/)
    assert.equal(readFileSync(path.join(blockedPath, "preserve-me"), "utf8"), "user data\n")
  })
})

test("when the requested branch already exists, rejects the worktree", () => {
  withRepository(({ repository }) => {
    // Arrange
    runGit(repository, ["branch", "taken"])

    // Act
    const result = runCommand(repository, ["taken"])

    // Assert
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Branch already exists/)
  })
})
