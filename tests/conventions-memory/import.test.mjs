import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import {
  captureConventions,
  captureInstalledConventions,
  markdownSections,
  IMPORT_OWNER,
} from "../../lib/conventions-memory/source.js"

const CLI = fileURLToPath(new URL("../../bin/conventions-memory", import.meta.url))
const SYNC = new URL("../../lib/conventions-memory/sync.js", import.meta.url).href
const ROOT = fileURLToPath(new URL("../../", import.meta.url))

function fixture(t, { git = true } = {}) {
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
  if (git) {
    execFileSync("git", ["init", "--quiet", source])
    commit(source)
  }
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

test("when a package has no Git metadata, installed capture preserves canonical provenance deterministically", (t) => {
  // Arrange
  const { source } = fixture(t, { git: false })
  mkdirSync(join(source, "docs", "workflows"), { recursive: true })
  mkdirSync(join(source, "skills"), { recursive: true })
  writeFileSync(join(source, "AGENTS.md"), "# Agent Guidance\n\nFollow authored conventions.\n")
  writeFileSync(join(source, "docs", "workflows", "review.md"), "# Review\n\nReview the result.\n")
  writeFileSync(join(source, "skills", "excluded.md"), "# Not Canonical\n\nDo not import.\n")
  writeFileSync(join(source, "docs", "excluded.md"), "# Not Canonical Either\n")

  // Act
  const captured = captureInstalledConventions(source)

  // Assert
  assert.deepEqual(captureInstalledConventions(source), captured)
  assert.deepEqual(captured.paths, ["AGENTS.md", "docs/workflows/review.md", "rules/style.md"])
  assert.match(captured.revision, /^marlens-skills-rules-and-tools@1\.0\.0:sha256:[a-f0-9]{64}$/u)
  for (const record of captured.records) {
    const metadata = JSON.parse(record.metadata_json)
    assert.equal(record.source, IMPORT_OWNER)
    assert.equal(record.session_id, IMPORT_OWNER)
    assert.equal(metadata.owner, IMPORT_OWNER)
    assert.equal(metadata.version, captured.version)
    assert.equal(metadata.revision, captured.revision)
    assert.equal(metadata.sourceKind, "installed-package")
    assert.ok(captured.paths.includes(metadata.path))
    assert.match(metadata.digest, /^[a-f0-9]{64}$/u)
    assert.ok(captured.revision.endsWith(metadata.contentDigest))
    assert.equal(metadata.sourceUrl, undefined)
    assert.match(record.content, /Installed package: marlens-skills-rules-and-tools@1\.0\.0/u)
    assert.doesNotMatch(record.content, /Git source:|\/blob\//u)
  }

  writeFileSync(
    join(source, "rules", "style.md"),
    "# Coding Style\n\nChanged installed guidance.\n"
  )
  assert.notEqual(captureInstalledConventions(source).revision, captured.revision)
})

test("when installed guidance replaces committed imports, identities survive refresh and retirement", (t) => {
  // Arrange
  const { source, database } = fixture(t)
  const committed = captureConventions(source)
  synchronize(source, database)
  rmSync(join(source, ".git"), { recursive: true })
  // Act
  const installed = captureInstalledConventions(source)
  // Assert
  assert.deepEqual(
    installed.records.map(({ id }) => id),
    committed.records.map(({ id }) => id)
  )
  const apply = (captured) =>
    native(
      `import { synchronizeConventions } from ${JSON.stringify(SYNC)}; console.log(JSON.stringify(synchronizeConventions(${JSON.stringify(database)},${JSON.stringify(captured)})));`
    )

  // Act
  const migrated = apply(installed)
  const repeated = apply(captureInstalledConventions(source))
  assert.deepEqual([migrated.inserted, migrated.updated, migrated.retired], [0, 3, 0])
  assert.deepEqual(
    [repeated.inserted, repeated.updated, repeated.retired, repeated.unchanged],
    [0, 0, 0, 3]
  )

  writeFileSync(
    join(source, "rules", "style.md"),
    "# Coding Style\n\n## Snapshots\n\nUse the newly installed convention.\n"
  )
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "marlens-skills-rules-and-tools", version: "1.1.0" })
  )
  const updated = captureInstalledConventions(source)
  const refreshed = apply(updated)
  assert.notEqual(updated.revision, installed.revision)
  assert.deepEqual([refreshed.inserted, refreshed.updated, refreshed.retired], [0, 2, 1])
  const owned = inspect(database).working_memory.filter(
    ({ source: owner }) => owner === IMPORT_OWNER
  )
  assert.equal(owned.length, 3)
  const active = owned.filter(({ valid_until }) => !valid_until)
  assert.equal(active.length, 2)
  assert.ok(active.some(({ content }) => content.includes("newly installed convention")))
  assert.ok(active.every(({ metadata_json }) => JSON.parse(metadata_json).version === "1.1.0"))
  assert.ok(owned.find(({ id }) => id === committed.records.at(-1).id).valid_until)
})

test("when canonical sources are links or unsupported objects, installed capture refuses traversal", async (t) => {
  // Arrange
  // Act / Assert: each isolated child exercises a different filesystem boundary.
  for (const linkedPath of [
    "package.json",
    "AGENTS.md",
    "rules",
    "rules/style.md",
    "docs",
    "docs/workflows",
  ]) {
    await t.test(linkedPath, (t) => {
      // Arrange
      const { source, root } = fixture(t, { git: false })
      const external = join(root, "external")
      mkdirSync(external)
      writeFileSync(join(external, "guidance.md"), "# External\n\nDo not traverse.\n")
      mkdirSync(join(source, "docs"), { recursive: true })
      rmSync(join(source, linkedPath), { recursive: true, force: true })
      symlinkSync(external, join(source, linkedPath))
      // Act / Assert
      assert.throws(() => captureInstalledConventions(source), /must be a regular/u)
    })
  }
  await t.test("root package link", (t) => {
    const { source, root } = fixture(t, { git: false })
    const linked = join(root, "linked-package")
    symlinkSync(source, linked)
    assert.throws(() => captureInstalledConventions(linked), /must be a regular directory/u)
  })
  await t.test("root document directory", (t) => {
    const { source } = fixture(t, { git: false })
    mkdirSync(join(source, "AGENTS.md"))
    assert.throws(() => captureInstalledConventions(source), /must be a regular file/u)
  })
})

test("when package identity or canonical guidance is missing, installed capture rejects the source", (t) => {
  // Arrange
  const { source } = fixture(t, { git: false })
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "another-package", version: "1.0.0" })
  )
  // Act / Assert
  assert.throws(() => captureInstalledConventions(source), /must be a versioned/u)
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "marlens-skills-rules-and-tools" })
  )
  assert.throws(() => captureInstalledConventions(source), /must be a versioned/u)
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "marlens-skills-rules-and-tools", version: "1.0.0" })
  )
  rmSync(join(source, "rules"), { recursive: true })
  assert.throws(() => captureInstalledConventions(source), /contains no convention sections/u)
})
