import { readFile, stat } from "node:fs/promises"

const SNAPSHOT_FILE_LIMIT_BYTES = 16 * 1024 * 1024
const ASSESSMENT_FILE_LIMIT_BYTES = 1024 * 1024

export async function readJsonFile(filePath, kind) {
  const maximumBytes = kind === "snapshot" ? SNAPSHOT_FILE_LIMIT_BYTES : ASSESSMENT_FILE_LIMIT_BYTES
  let fileStats
  try {
    fileStats = await stat(filePath)
  } catch {
    throw new Error(`Could not read ${kind} file.`)
  }
  if (!fileStats.isFile()) throw new Error(`${kind} path must be a regular file.`)
  if (fileStats.size > maximumBytes)
    throw new Error(`${kind} file exceeds the ${maximumBytes} byte safety limit.`)

  let contents
  try {
    contents = await readFile(filePath, "utf8")
  } catch {
    throw new Error(`Could not read ${kind} file.`)
  }
  if (Buffer.byteLength(contents, "utf8") > maximumBytes)
    throw new Error(`${kind} file exceeds the ${maximumBytes} byte safety limit.`)

  try {
    return JSON.parse(contents)
  } catch {
    throw new Error(`${kind} file must contain valid JSON.`)
  }
}
