import { gitOutput } from "./git-output.js"
import { parseGitRemote } from "./parse-git-remote.js"

export function currentCheckoutRepository(cwd) {
  const top = gitOutput(["-C", cwd, "rev-parse", "--show-toplevel"])
  if (!top) return undefined
  return parseGitRemote(gitOutput(["-C", top, "remote", "get-url", "origin"]))
}
