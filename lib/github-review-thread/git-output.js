import { spawnSync } from "node:child_process"

export function gitOutput(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
  if (result.status !== 0 || !result.stdout) return undefined
  return result.stdout.trim()
}
