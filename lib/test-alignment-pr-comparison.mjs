import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

const DIFF_OPTIONS = ["--no-ext-diff", "--no-textconv", "--no-color", "--ignore-submodules=none"]
const HUNK_HEADER = /(?:^|\n)@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gu

function createPrComparison(root, { mergeBaseCommit, headCommit }) {
  const gitEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_"))
  )
  gitEnvironment.GIT_NO_REPLACE_OBJECTS = "1"
  gitEnvironment.GIT_TERMINAL_PROMPT = "0"

  function git(args, input) {
    const command = spawnSync("git", ["--literal-pathspecs", ...args], {
      cwd: root,
      env: gitEnvironment,
      input,
      maxBuffer: 64 * 1024 * 1024,
      timeout: 20_000,
    })
    const diffWithChanges = input !== undefined && command.status === 1
    if (command.error || (command.status !== 0 && !diffWithChanges) || command.stderr?.length) {
      throw new Error(`Git could not compare the captured PR source (${args[0]}).`, {
        cause: command.error,
      })
    }

    return command.stdout
  }

  function renamedPaths(revisions) {
    const fields = git([
      "diff",
      ...DIFF_OPTIONS,
      "--find-renames=50%",
      "-l1000",
      "--diff-filter=R",
      "--name-status",
      "-z",
      ...revisions,
      "--",
    ])
      .toString("utf8")
      .split("\0")
    const renames = new Map()

    for (let index = 0; index < fields.length - 1; index += 3) {
      const [status, previousPath, currentPath] = fields.slice(index, index + 3)
      if (!/^R\d+$/u.test(status) || !previousPath || !currentPath) {
        throw new Error("Git did not identify the captured PR rename source.")
      }

      renames.set(currentPath, previousPath)
    }

    return renames
  }

  function baseObject(basePath) {
    const entry = git(["ls-tree", "-z", mergeBaseCommit, "--", basePath]).toString("utf8")
    return /^100(?:644|755) blob ([a-f0-9]+)\t/u.exec(entry)?.[1]
  }

  let committedRenames
  let stagedRenames

  return function compareTestSource(testPath, lineRanges) {
    committedRenames ??= renamedPaths([mergeBaseCommit, headCommit])
    let basePath = committedRenames.get(testPath) ?? testPath
    let object = baseObject(basePath)

    if (!object && basePath === testPath) {
      stagedRenames ??= renamedPaths(["--cached", mergeBaseCommit])
      const stagedSource = stagedRenames.get(testPath)
      if (stagedSource && !existsSync(path.join(root, stagedSource))) {
        basePath = stagedSource
        object = baseObject(basePath)
      }
    }

    if (!object) {
      throw new Error(`No regular Git preimage is available at ${basePath}.`)
    }

    const baseBlob = git(["cat-file", "blob", object])
    // Use the same zero-context diff inputs and hunk options as OMP Verifier,
    // including the working source rather than just the committed destination.
    const patch = git(
      [
        "diff",
        "--no-index",
        ...DIFF_OPTIONS,
        "--no-renames",
        "--text",
        "--unified=0",
        "--inter-hunk-context=0",
        "--diff-algorithm=myers",
        "--no-indent-heuristic",
        "--line-prefix=",
        "--output-indicator-new=+",
        "--output-indicator-old=-",
        "--output-indicator-context= ",
        "--",
        "-",
        path.join(root, testPath),
      ],
      baseBlob
    )
    const hunks = comparisonHunks(patch.toString("utf8"))
    const headRanges = changedHeadRanges(hunks)
    if (
      headRanges.length !== lineRanges.length ||
      headRanges.some(([first, last], index) => {
        const [capturedFirst, capturedLast] = lineRanges[index]
        return first !== capturedFirst || last !== capturedLast
      })
    ) {
      throw new Error(`Git preimage comparison disagrees with the captured ranges for ${testPath}.`)
    }

    return { basePath, baseSource: baseBlob.toString("utf8"), hunks }
  }
}

function comparisonHunks(patch) {
  const hunks = []

  for (const [, oldLine, oldCount = "1", newLine, newCount = "1"] of patch.matchAll(HUNK_HEADER)) {
    const baseEnd = Number(oldLine) + Math.max(0, Number(oldCount) - 1)
    const headEnd = Number(newLine) + Math.max(0, Number(newCount) - 1)
    // Git's zero-count coordinate denotes the line before the empty range.
    const baseBefore = baseEnd - Number(oldCount)
    const headBefore = headEnd - Number(newCount)
    hunks.push({ baseBefore, baseEnd, headBefore, headEnd })
  }

  return hunks
}

function changedHeadRanges(hunks) {
  const ranges = []

  for (const { headBefore, headEnd } of hunks) {
    if (headBefore === headEnd) continue

    const first = headBefore + 1
    const previous = ranges.at(-1)
    if (previous && first === previous[1] + 1) {
      previous[1] = headEnd
    } else {
      ranges.push([first, headEnd])
    }
  }

  return ranges
}

export default createPrComparison
