import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { lexer } from "marked"

export const IMPORT_OWNER = "marlens-skills-rules-and-tools/conventions-memory/v1"
const PACKAGE_NAME = "marlens-skills-rules-and-tools"
const ROOT_DOCUMENTS = new Set(["AGENTS.md", "AGENT_RULES.md", "COMMITTING.md"])

function git(source, ...args) {
  return execFileSync("git", ["-C", source, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  })
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex")
}

function isConvention(path) {
  return (
    ROOT_DOCUMENTS.has(path) ||
    /^(rules|examples|docs\/(references|workflows|templates))\/.*\.md$/u.test(path)
  )
}

export function markdownSections(markdown) {
  const sections = []
  const headings = []
  const occurrences = new Map()
  const frontmatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u)?.[0] ?? ""
  let line = 1 + (frontmatter.match(/\n/gu) ?? []).length
  let section = { key: "introduction", heading: "Introduction", line, text: "" }

  for (const token of lexer(markdown.slice(frontmatter.length))) {
    if (token.type === "heading") {
      if (section.text.trim()) sections.push(section)

      headings.length = token.depth - 1
      headings[token.depth - 1] = token.text
      const heading = headings.filter(Boolean).join(" / ")
      const occurrence = (occurrences.get(heading) ?? 0) + 1
      occurrences.set(heading, occurrence)
      section = { key: `${heading}#${occurrence}`, heading, line, text: "" }
    }
    section.text += token.raw
    line += (token.raw.match(/\n/gu) ?? []).length
  }
  if (section.text.trim()) sections.push(section)
  return sections
}

export function captureConventions(sourceDirectory) {
  const source = resolve(sourceDirectory)
  const revision = git(source, "rev-parse", "--verify", "HEAD^{commit}").trim()
  const packageJson = JSON.parse(git(source, "show", `${revision}:package.json`))
  if (packageJson.name !== PACKAGE_NAME) {
    throw new Error(`Source must be a clone of ${PACKAGE_NAME}; found ${packageJson.name}`)
  }
  const timestamp = new Date(
    git(source, "show", "-s", "--format=%cI", revision).trim()
  ).toISOString()
  const entries = git(source, "ls-tree", "-rz", "--full-tree", revision).split("\0").filter(Boolean)
  const records = []
  const paths = []

  for (const entry of entries) {
    const separator = entry.indexOf("\t")
    const path = entry.slice(separator + 1)
    if (!isConvention(path)) continue

    const [mode, type] = entry.slice(0, separator).split(" ")
    if (type !== "blob" || !["100644", "100755"].includes(mode)) {
      throw new Error(`Convention source must be a regular tracked file: ${path}`)
    }
    paths.push(path)
    const markdown = git(source, "show", `${revision}:${path}`)
    for (const section of markdownSections(markdown)) {
      const key = `${path}#${section.key}`
      const id = `mssrt_${digest(`${IMPORT_OWNER}\n${key}`)}`
      const sourceUrl = `https://github.com/klondikemarlen/${PACKAGE_NAME}/blob/${revision}/${path}#L${section.line}`
      const content = `Marlen's conventions: ${section.heading}\nSource: ${path}:${section.line}\n\n${section.text.trim()}\n\nGit source: ${sourceUrl}`
      records.push({
        id,
        content,
        source: IMPORT_OWNER,
        timestamp,
        created_at: timestamp,
        session_id: IMPORT_OWNER,
        scope: "global",
        importance: 0.8,
        veracity: "imported",
        trust_tier: "IMPORTED",
        memory_type: "instruction",
        consolidated_at: timestamp,
        metadata_json: JSON.stringify({
          owner: IMPORT_OWNER,
          key,
          path,
          heading: section.heading,
          line: section.line,
          revision,
          digest: digest(section.text),
          sourceUrl,
        }),
      })
    }
  }
  if (records.length === 0) throw new Error("The committed source contains no convention sections")
  return { revision, version: packageJson.version, paths, records }
}
