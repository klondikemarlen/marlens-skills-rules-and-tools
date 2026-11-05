import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import {
  captureConventions,
  markdownSections,
  IMPORT_OWNER,
} from "../../lib/conventions-memory/source.js"

const CLI = fileURLToPath(new URL("../../bin/conventions-memory", import.meta.url))
const SYNC = new URL("../../lib/conventions-memory/sync.js", import.meta.url).href
const ROOT = fileURLToPath(new URL("../../", import.meta.url))

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "conventions-memory-test-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = join(root, "source")
  mkdirSync(join(source, "rules"), { recursive: true })
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "marlens-skills-rules-and-tools", version: "1.0.0" })
  )
  writeFileSync(
    join(source, "rules", "style.md"),
    "# Coding Style\n\n## Snapshots\n\nName captured category identifiers staticCategoryId.\n\n## Retired Rule\n\nUse obsoleteConventionForTesting.\n"
  )
  execFileSync("git", ["init", "--quiet", source])
  commit(source)
  return { source, database: join(root, "memory.db"), root }
}

function commit(source) {
  execFileSync("git", ["-C", source, "add", "."])
  execFileSync("git", [
    "-C",
    source,
    "-c",
    "core.hooksPath=/dev/null",
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "--quiet",
    "-m",
    "Fixture revision",
  ])
}

function native(code) {
  return JSON.parse(execFileSync("bun", ["--eval", code], { cwd: ROOT, encoding: "utf8" }))
}

function inspect(database) {
  return native(
    `import { Mnemopi } from '@oh-my-pi/pi-mnemopi'; const m = new Mnemopi({dbPath:${JSON.stringify(database)},noEmbeddings:true,llm:false,reconcile:false}); console.log(JSON.stringify(m.beam.exportToDict())); m.close();`
  )
}

function synchronize(source, database) {
  return JSON.parse(
    execFileSync("bun", [CLI, "sync", "--source", source, "--database", database, "--apply"], {
      encoding: "utf8",
    })
  )
}

test("when committed conventions change, native imports refresh and retire only owned memories", (t) => {
  // Arrange
  const { source, database } = fixture(t)
  const unrelatedId = native(
    `import { Mnemopi } from '@oh-my-pi/pi-mnemopi'; const m = new Mnemopi({dbPath:${JSON.stringify(database)},noEmbeddings:true,llm:false,reconcile:false}); console.log(JSON.stringify(m.remember('Unrelated private conversational fact', {scope:'global',extract:false,extractEntities:false}))); m.close();`
  )
  const unrelatedBefore = inspect(database).working_memory.find(({ id }) => id === unrelatedId)

  // Act
  const first = synchronize(source, database)
  const repeat = synchronize(source, database)

  // Assert
  assert.equal(first.inserted, 3)
  assert.deepEqual(
    [repeat.inserted, repeat.updated, repeat.retired, repeat.unchanged],
    [0, 0, 0, 3]
  )

  // Act
  writeFileSync(
    join(source, "rules", "style.md"),
    "# Coding Style\n\n## Snapshots\n\nName captured workflow identifiers staticWorkflowId.\n"
  )
  assert.equal(synchronize(source, database).updated, 0, "Uncommitted edits are not imported")
  commit(source)
  const refreshed = synchronize(source, database)
  const records = inspect(database).working_memory
  const owned = records.filter(({ source: recordSource }) => recordSource === IMPORT_OWNER)
  const active = owned.filter(({ valid_until }) => !valid_until)
  // Assert
  assert.deepEqual([refreshed.inserted, refreshed.updated, refreshed.retired], [0, 2, 1])
  assert.equal(owned.length, 3)
  assert.equal(active.length, 2)
  assert.ok(active.some(({ content }) => content.includes("staticWorkflowId")))
  assert.ok(
    active.every(
      ({ content }) =>
        !content.includes("staticCategoryId") && !content.includes("obsoleteConventionForTesting")
    )
  )
  assert.deepEqual(
    records.find(({ id }) => id === unrelatedId),
    unrelatedBefore
  )
  assert.ok(
    active.every(({ consolidated_at, trust_tier }) => consolidated_at && trust_tier === "IMPORTED")
  )

  // Act
  const recalled = native(
    `import { Mnemopi } from '@oh-my-pi/pi-mnemopi'; const m = new Mnemopi({dbPath:${JSON.stringify(database)},noEmbeddings:true,llm:false,reconcile:false}); console.log(JSON.stringify({current:await m.recall('staticWorkflowId',5),removed:await m.recall('obsoleteConventionForTesting',5)})); m.close();`
  )
  // Assert
  assert.ok(recalled.current.some(({ content }) => content.includes("staticWorkflowId")))
  assert.equal(recalled.removed.length, 0)
})

test("when a foreign memory uses an import identity, synchronization refuses to overwrite it", (t) => {
  // Arrange
  const { source, database } = fixture(t)
  const captured = captureConventions(source)
  const collisionId = captured.records.at(-1).id
  native(
    `import { Mnemopi } from '@oh-my-pi/pi-mnemopi'; const m = new Mnemopi({dbPath:${JSON.stringify(database)},noEmbeddings:true,llm:false,reconcile:false}); m.beam.importFromDict({working_memory:[{id:${JSON.stringify(collisionId)},content:'Keep foreign memory',source:'conversation',scope:'global'}]}); console.log('null'); m.close();`
  )
  const before = inspect(database).working_memory

  // Act
  const result = spawnSync(
    "bun",
    [
      "--eval",
      `import { synchronizeConventions } from ${JSON.stringify(SYNC)}; synchronizeConventions(${JSON.stringify(database)},${JSON.stringify(captured)});`,
    ],
    { cwd: ROOT, encoding: "utf8" }
  )

  // Assert
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Memory identity collision/u)
  assert.deepEqual(inspect(database).working_memory, before)
})

test("when previewing a source, the command leaves the destination absent", (t) => {
  // Arrange
  const { source, database } = fixture(t)

  // Act
  const preview = JSON.parse(
    execFileSync("bun", [CLI, "sync", "--source", source, "--database", database], {
      encoding: "utf8",
    })
  )

  // Assert
  assert.equal(preview.result, "preview")
  assert.equal(preview.destinationInspected, false)
  assert.equal(existsSync(database), false)
})

test("when Markdown includes fenced headings and repeated headings, section identities remain distinct", () => {
  // Arrange
  const markdown =
    "# Rules\n\n```md\n## Not a Section\n```\n\n## Naming\n\nFirst.\n\n## Naming\n\nSecond.\n"

  // Act
  const sections = markdownSections(markdown)

  // Assert
  assert.deepEqual(
    sections.map(({ key }) => key),
    ["Rules#1", "Rules / Naming#1", "Rules / Naming#2"]
  )
  assert.match(sections[0].text, /## Not a Section/u)
  assert.equal(sections[1].line, 7)
})

test("when a rule has YAML frontmatter, only its Markdown guidance is imported with original line numbers", () => {
  // Arrange
  const markdown =
    "---\nname: readable-code\ndescription: Personal conventions\n---\n\n# Naming\n\nUse descriptive names.\n"

  // Act
  const sections = markdownSections(markdown)

  // Assert
  assert.deepEqual(
    sections.map(({ heading, line }) => ({ heading, line })),
    [{ heading: "Naming", line: 6 }]
  )
  assert.match(sections[0].text, /Use descriptive names/u)
  assert.doesNotMatch(sections[0].text, /description:|name:/u)
})
