#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import {
  constants as fsConstants,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import process from "node:process"

const usage = `Usage:
  agent-worktree <worktree-name> [--branch <branch-name>] [--base <ref>]

Create an issue worktree at ../<project>-worktrees/<worktree-name>.

The new branch defaults to <worktree-name> and the base defaults to the current HEAD.
Copy a root .envrc when present, then allow direnv when it is installed.
Use a root .agent-worktree.json { "copy": [".env"] } to copy additional files.
`

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
  })

  if (result.error) throw result.error

  if (result.status !== 0 && !options.allowFailure) {
    const output = `${result.stderr}${result.stdout}`.trim()
    throw new Error(output || `git ${args.join(" ")} failed.`)
  }

  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

function parseArgs(args) {
  const options = { base: "HEAD" }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]

    if (argument === "--help" || argument === "-h") {
      options.help = true
      continue
    }

    if (argument === "--branch" || argument === "--base") {
      const value = args[++index]
      if (!value) throw new Error(`${argument} requires a value.`)
      options[argument.slice(2)] = value
      continue
    }

    if (argument.startsWith("-")) throw new Error(`Unknown option: ${argument}`)
    if (options.name) throw new Error("Only one worktree name is allowed.")

    options.name = argument
  }

  if (!options.help && !options.name) throw new Error("A worktree name is required.")

  options.branch ??= options.name
  return options
}

function validateWorktreeName(name) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    throw new Error(
      "Worktree names must be a single path segment containing letters, numbers, dots, underscores, or hyphens."
    )
  }
}

function worktreeRecords(cwd) {
  const output = runGit(["worktree", "list", "--porcelain"], { cwd }).stdout

  return output
    .split("\n\n")
    .filter(Boolean)
    .map((record) => {
      const lines = record.split("\n")
      const worktree = lines.find((line) => line.startsWith("worktree "))?.slice(9)
      const branch = lines.find((line) => line.startsWith("branch "))?.slice(7)

      return { worktree, branch }
    })
}

function findPrimaryWorktree(records) {
  const primary = records[0]?.worktree
  if (!primary) throw new Error("Git did not report a primary worktree.")

  return primary
}

function parseCopyPaths(repositoryRoot) {
  const configPath = join(repositoryRoot, ".agent-worktree.json")
  const copyPaths = [".envrc"]

  if (!existsSync(configPath)) return copyPaths

  let config
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"))
  } catch (error) {
    throw new Error(`Could not parse ${configPath}: ${error.message}`)
  }

  if (config === null || Array.isArray(config) || typeof config !== "object") {
    throw new Error(`${configPath} must contain a JSON object.`)
  }

  if (config.copy === undefined) return copyPaths

  if (!Array.isArray(config.copy) || config.copy.some((copyPath) => typeof copyPath !== "string")) {
    throw new Error(`${configPath} copy must be an array of file paths.`)
  }

  return [...new Set([...copyPaths, ...config.copy])]
}

function resolveCopyFiles(repositoryRoot, copyPaths, baseCommit) {
  return copyPaths.flatMap((copyPath) => {
    const sourcePath = resolve(repositoryRoot, copyPath)
    const sourceRelativePath = relative(repositoryRoot, sourcePath)

    if (
      !sourceRelativePath ||
      sourceRelativePath === ".." ||
      sourceRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(sourceRelativePath) ||
      sourceRelativePath.split(sep)[0] === ".git"
    ) {
      throw new Error(`Copy paths must stay inside the repository: ${copyPath}`)
    }

    if (!existsSync(sourcePath)) return []

    if (!statSync(sourcePath).isFile()) {
      throw new Error(`Copy paths must name files: ${copyPath}`)
    }

    const existsInBase = runGit(["ls-tree", "--name-only", baseCommit, "--", sourceRelativePath], {
      cwd: repositoryRoot,
    }).stdout

    if (existsInBase) return []

    return [{ sourcePath, relativePath: sourceRelativePath }]
  })
}

function validateBranch(branch, cwd) {
  runGit(["check-ref-format", "--branch", branch], { cwd })

  const existingBranch = runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], {
    cwd,
    allowFailure: true,
  })

  if (existingBranch.status === 0) throw new Error(`Branch already exists: ${branch}`)
}

function resolveBase(base, cwd) {
  const result = runGit(["rev-parse", "--verify", "--quiet", `${base}^{commit}`], {
    cwd,
    allowFailure: true,
  })

  if (result.status !== 0) throw new Error(`Base ref does not resolve to a commit: ${base}`)

  return result.stdout
}

function existingWorktree(records, worktreePath, branch) {
  const matchingWorktree = records.find(
    (record) => record.worktree && resolve(record.worktree) === worktreePath
  )

  if (!matchingWorktree) return false

  if (matchingWorktree.branch === `refs/heads/${branch}`) return true

  throw new Error(`Worktree path is already in use: ${worktreePath}`)
}

function allowDirenv(worktreePath) {
  if (!existsSync(join(worktreePath, ".envrc"))) return

  const result = spawnSync("direnv", ["allow"], {
    cwd: worktreePath,
    encoding: "utf8",
  })

  if (result.error?.code === "ENOENT") return
  if (result.error) throw result.error

  if (result.stdout) process.stderr.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) throw new Error("direnv allow failed.")
}

function cleanupCreatedWorktree(worktreePath, branch, cwd) {
  const worktreeRemoval = runGit(["worktree", "remove", "--force", worktreePath], {
    cwd,
    allowFailure: true,
  })
  const branchRemoval = runGit(["branch", "--delete", "--force", branch], {
    cwd,
    allowFailure: true,
  })

  if (worktreeRemoval.status !== 0 || branchRemoval.status !== 0) {
    process.stderr.write(
      `Cleanup failed; inspect ${worktreePath} and branch ${branch} before retrying.\n`
    )
  }
}

function createWorktree(options) {
  const repositoryRoot = runGit(["rev-parse", "--show-toplevel"]).stdout
  const records = worktreeRecords(repositoryRoot)
  const primaryWorktree = findPrimaryWorktree(records)
  const worktreeRoot = join(dirname(primaryWorktree), `${basename(primaryWorktree)}-worktrees`)
  const worktreePath = resolve(worktreeRoot, options.name)

  validateWorktreeName(options.name)

  if (existingWorktree(records, worktreePath, options.branch)) return worktreePath
  if (existsSync(worktreePath)) throw new Error(`Worktree path already exists: ${worktreePath}`)

  validateBranch(options.branch, repositoryRoot)
  const baseCommit = resolveBase(options.base, repositoryRoot)
  const copyFiles = resolveCopyFiles(repositoryRoot, parseCopyPaths(repositoryRoot), baseCommit)

  mkdirSync(worktreeRoot, { recursive: true })
  runGit(["worktree", "add", "-b", options.branch, worktreePath, baseCommit], {
    cwd: repositoryRoot,
  })

  try {
    for (const copyFile of copyFiles) {
      const destinationPath = join(worktreePath, copyFile.relativePath)
      mkdirSync(dirname(destinationPath), { recursive: true })
      copyFileSync(copyFile.sourcePath, destinationPath, fsConstants.COPYFILE_EXCL)
    }

    allowDirenv(worktreePath)
  } catch (error) {
    cleanupCreatedWorktree(worktreePath, options.branch, repositoryRoot)
    throw error
  }

  return worktreePath
}

try {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    process.stdout.write(usage)
  } else {
    process.stdout.write(`${createWorktree(options)}\n`)
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}
