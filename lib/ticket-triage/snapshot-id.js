import { createHash } from "node:crypto"

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys)
  if (value === null || typeof value !== "object") return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObjectKeys(value[key])])
  )
}

export function snapshotHashPayload(snapshot) {
  const { version, repository, issue, related, labels, metadata } = snapshot
  return { version, repository, issue, related, labels, metadata }
}

export function calculateSnapshotId(snapshot) {
  const canonicalPayload = JSON.stringify(sortObjectKeys(snapshotHashPayload(snapshot)))
  return createHash("sha256").update(canonicalPayload, "utf8").digest("hex")
}
