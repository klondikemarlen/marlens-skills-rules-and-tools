import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const command = fileURLToPath(new URL("../../bin/retire-merged-worktree", import.meta.url))

let skip = false
if (process.platform !== "linux" || process.getuid() === 0) {
  skip = "Worktree retirement requires an ordinary Linux user."
}

function createRepository(t) {
  const home = realpathSync(homedir())
  const sandbox = mkdtempSync(path.join(home, ".retire-merged-worktree-test-"))
  t.after(() => rmSync(sandbox, { force: true, recursive: true }))

  const primary = path.join(sandbox, "repo")
  const worktreeRoot = path.join(sandbox, "repo-worktrees")
  mkdirSync(primary)
  mkdirSync(worktreeRoot)
  chmodSync(worktreeRoot, 0o775)

  const env = {
    HOME: sandbox,
    PATH: "/usr/bin:/bin",
    LC_ALL: "C",
  }
  const options = {
    cwd: primary,
    env,
    encoding: "utf8",
  }

  function git(...args) {
    return execFileSync("/usr/bin/git", args, options)
  }

  git("init", "--initial-branch=main", "--template=")
  git("config", "user.email", "tests@example.com")
  git("config", "user.name", "Test Runner")
  writeFileSync(path.join(primary, "README.md"), "Primary checkout\n")
  git("add", "README.md")
  git("-c", "commit.gpgSign=false", "commit", "-m", "Initial commit")

  function retire(target) {
    return spawnSync(process.execPath, [command, target], options)
  }

  return { primary, worktreeRoot, git, retire }
}

test("removes only the named linked worktree and unregisters it through Git", { skip }, (t) => {
  // Arrange
  const { primary, worktreeRoot, git, retire } = createRepository(t)
  const target = path.join(worktreeRoot, "merged-topic")
  const sibling = path.join(worktreeRoot, "unrelated-topic")
  git("worktree", "add", "-b", "merged-topic", target)
  git("worktree", "add", "-b", "unrelated-topic", sibling)
  writeFileSync(path.join(sibling, "keep.txt"), "Unrelated work\n")

  // Act
  const result = retire(target)

  // Assert
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    result: "removed",
    method: "git",
    target,
    targetPresent: false,
    registrationPresent: false,
  })
  assert.equal(existsSync(target), false)
  assert.equal(readFileSync(path.join(primary, "README.md"), "utf8"), "Primary checkout\n")
  assert.equal(readFileSync(path.join(sibling, "keep.txt"), "utf8"), "Unrelated work\n")

  const registrations = git("worktree", "list", "--porcelain", "-z").split("\0")
  assert.ok(registrations.includes(`worktree ${primary}`))
  assert.ok(registrations.includes(`worktree ${sibling}`))
  assert.ok(!registrations.includes(`worktree ${target}`))
})

test("refuses an unregistered directory inside the worktree root", { skip }, (t) => {
  // Arrange
  const { worktreeRoot, retire } = createRepository(t)
  const unregistered = path.join(worktreeRoot, "unregistered")
  mkdirSync(unregistered)
  writeFileSync(path.join(unregistered, "keep.txt"), "User data\n")

  // Act
  const result = retire(unregistered)

  // Assert
  assert.ifError(result.error)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /not an exactly registered linked worktree/i)
  assert.equal(readFileSync(path.join(unregistered, "keep.txt"), "utf8"), "User data\n")
})

test("refuses to retire the primary checkout itself", { skip }, (t) => {
  // Arrange
  const { primary, git, retire } = createRepository(t)
  const originalHead = git("rev-parse", "HEAD")

  // Act
  const result = retire(primary)

  // Assert
  assert.ifError(result.error)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /direct child of the primary checkout's sibling worktree root/i)
  assert.equal(git("rev-parse", "HEAD"), originalHead)
  assert.equal(readFileSync(path.join(primary, "README.md"), "utf8"), "Primary checkout\n")
})
