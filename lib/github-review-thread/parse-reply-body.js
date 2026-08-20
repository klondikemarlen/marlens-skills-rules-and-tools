import { readFile } from "node:fs/promises"

export async function parseReplyBody(options) {
  if (options.body !== undefined) {
    throw new Error("reply rejects inline --body; write Markdown to a file and use --body-file.")
  }
  if (typeof options.bodyFile !== "string" || options.bodyFile.trim() === "") {
    throw new Error("reply requires --pr, --comment-id, and --body-file.")
  }

  try {
    const body = await readFile(options.bodyFile, "utf8")
    if (body.trim() === "") throw new Error("--body-file must contain non-empty text.")
    return body
  } catch (error) {
    if (error.message === "--body-file must contain non-empty text.") throw error
    throw new Error(`Could not read --body-file ${options.bodyFile}: ${error.message}`)
  }
}
