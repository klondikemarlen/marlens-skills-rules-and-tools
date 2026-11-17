import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

export function isMainModule(moduleUrl) {
  if (!process.argv[1]) return false

  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(moduleUrl))
  } catch (error) {
    // Import hosts may supply a synthetic or missing script path.
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return false

    throw error
  }
}
