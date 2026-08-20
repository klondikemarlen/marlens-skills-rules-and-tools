export function parseGitRemote(value) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().replace(/\.git$/u, "")
  const match = trimmed.match(/github\.com[:/]([^/]+)\/([^/]+)$/u)
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : undefined
}
