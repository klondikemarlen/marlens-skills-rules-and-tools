import { execFile } from "node:child_process"
import { promisify } from "node:util"

const executeFile = promisify(execFile)
const GH_TIMEOUT_MS = 30_000
const GH_MAX_BUFFER_BYTES = 16 * 1024 * 1024

export async function readWithGh(endpoint, { paginate = false } = {}) {
  const argumentsForGh = ["api", "--method", "GET"]
  if (paginate) argumentsForGh.push("--paginate", "--jq", "tojson")
  argumentsForGh.push(endpoint)

  let result
  try {
    result = await executeFile("gh", argumentsForGh, {
      encoding: "utf8",
      timeout: GH_TIMEOUT_MS,
      maxBuffer: GH_MAX_BUFFER_BYTES,
      windowsHide: true,
    })
  } catch (error) {
    if (error.killed || error.signal === "SIGTERM") {
      throw new Error("GitHub read request timed out; no snapshot was produced.")
    }
    if (error.code === "ENOENT")
      throw new Error("GitHub CLI (`gh`) is required for snapshot capture.")
    if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      throw new Error(
        "GitHub read response exceeded the 16 MiB safety limit; no snapshot was produced."
      )
    }
    const exitCode = Number.isInteger(error.code) ? ` (exit ${error.code})` : ""
    throw new Error(`GitHub GET request failed${exitCode}; no snapshot was produced.`)
  }

  try {
    if (paginate) {
      return result.stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((page) => JSON.parse(page))
    }

    return JSON.parse(result.stdout)
  } catch {
    throw new Error("GitHub returned an invalid JSON read response; no snapshot was produced.")
  }
}
