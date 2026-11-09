import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { lexer } from "marked"

export const IMPORT_OWNER = "marlens-skills-rules-and-tools/conventions-memory/v1"
const PACKAGE_NAME = "marlens-skills-rules-and-tools"
const ROOT_DOCUMENTS = new Set(["AGENTS.md", "AGENT_RULES.md", "COMMITTING.md"])
const CONVENTION_DIRECTORIES = [
  "rules",
  "examples",
  "docs/references",
  "docs/workflows",
  "docs/templates",
]

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

function conventionRecords(documents, { revision, timestamp, provenance }) {
  const records = []
  for (const { path, markdown } of documents) {
    for (const section of markdownSections(markdown)) {
      const key = `${path}#${section.key}`
      const { reference, metadata } = provenance(path, section.line)
      records.push({
        id: `mssrt_${digest(`${IMPORT_OWNER}\n${key}`)}`,
        content: `Marlen's conventions: ${section.heading}\nSource: ${path}:${section.line}\n\n${section.text.trim()}\n\n${reference}`,
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
          ...metadata,
        }),
      })
    }
  }
  if (records.length === 0) throw new Error("The source contains no convention sections")
  return records
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
  const documents = []

  for (const entry of entries) {
    const separator = entry.indexOf("\t")
    const path = entry.slice(separator + 1)
    if (!isConvention(path)) continue

    const [mode, type] = entry.slice(0, separator).split(" ")
    if (type !== "blob" || !["100644", "100755"].includes(mode)) {
      throw new Error(`Convention source must be a regular tracked file: ${path}`)
    }
    documents.push({ path, markdown: git(source, "show", `${revision}:${path}`) })
  }
  const records = conventionRecords(documents, {
    revision,
    timestamp,
    provenance(path, line) {
      const sourceUrl = `https://github.com/klondikemarlen/${PACKAGE_NAME}/blob/${revision}/${path}#L${line}`
      return { reference: `Git source: ${sourceUrl}`, metadata: { sourceUrl } }
    },
  })
  return {
    revision,
    version: packageJson.version,
    paths: documents.map(({ path }) => path),
    records,
  }
}

function installedEntry(root, path, expectedType) {
  const absolutePath = join(root, path)
  const stat = lstatSync(absolutePath, { throwIfNoEntry: false })
  if (!stat) return false
  if (expectedType === "directory" ? !stat.isDirectory() : !stat.isFile()) {
    throw new Error(
      `Installed convention source must be a regular ${expectedType}: ${path || root}`
    )
  }
  return true
}

export function captureInstalledConventions(packageRoot) {
  const root = resolve(packageRoot)
  if (!installedEntry(root, "", "directory")) {
    throw new Error(`Installed package directory does not exist: ${root}`)
  }
  if (!installedEntry(root, "package.json", "file")) {
    throw new Error("Installed convention source is missing package.json")
  }
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  if (
    packageJson.name !== PACKAGE_NAME ||
    typeof packageJson.version !== "string" ||
    !packageJson.version.trim()
  ) {
    throw new Error(`Installed source must be a versioned ${PACKAGE_NAME} package`)
  }

  const documents = []
  function visit(path) {
    const stat = lstatSync(join(root, path))
    if (stat.isDirectory()) {
      for (const name of readdirSync(join(root, path)).sort()) visit(`${path}/${name}`)
    } else if (stat.isFile()) {
      if (isConvention(path)) {
        documents.push({ path, markdown: readFileSync(join(root, path), "utf8") })
      }
    } else {
      throw new Error(`Installed convention source must be a regular file or directory: ${path}`)
    }
  }
  for (const path of ROOT_DOCUMENTS) {
    if (installedEntry(root, path, "file")) visit(path)
  }
  // Check the parent before looking up selected docs children; never follow a linked docs tree.
  const hasDocs = installedEntry(root, "docs", "directory")
  for (const path of CONVENTION_DIRECTORIES) {
    if (path.startsWith("docs/") && !hasDocs) continue
    if (installedEntry(root, path, "directory")) visit(path)
  }
  documents.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
  const contentDigest = digest(JSON.stringify(documents))
  const version = packageJson.version
  const revision = `${PACKAGE_NAME}@${version}:sha256:${contentDigest}`
  const records = conventionRecords(documents, {
    revision,
    // Installed files carry no trustworthy authored timestamp; keep capture independent of the clock.
    timestamp: "1970-01-01T00:00:00.000Z",
    provenance(path) {
      return {
        reference: `Installed package: ${PACKAGE_NAME}@${version}\nDelivered content SHA-256: ${contentDigest}\nInstalled source: ${path}`,
        metadata: {
          sourceKind: "installed-package",
          packageName: PACKAGE_NAME,
          version,
          contentDigest,
        },
      }
    },
  })
  return { revision, version, paths: documents.map(({ path }) => path), records }
}
