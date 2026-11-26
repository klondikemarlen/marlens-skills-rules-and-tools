import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { access, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import {
  auditScreenshotHistory,
  markdownHash,
  requireFreshScreenshotBody,
  screenshotBodyVersion,
} from "../../lib/github-pr-screenshot-history.mjs"

const BASELINE = "## Context\nExisting ![old](https://github.com/user-attachments/assets/old-id)\n"
const MARKER = "<!-- mssrt-pr-screenshots:test -->"
const SUBMITTED = `${BASELINE}\n${MARKER}\nQA evidence\n`
const run = promisify(execFile)
const command = fileURLToPath(new URL("../../bin/github-pr-screenshots", import.meta.url))

test("body hashes ignore CRLF but not changes to unrelated Markdown", () => {
  const original = markdownHash("## Context\r\nOne  \r\n")

  assert.equal(original, markdownHash("## Context\nOne  \n"))
  assert.notEqual(original, markdownHash("## Context\nOne\n"))
})

test("refuses to save after an edit and revert even when the body hash is unchanged", () => {
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const current = observation(BASELINE, [edit("reverted", BASELINE), edit("baseline", BASELINE)])

  assert.throws(() => requireFreshScreenshotBody(current, before), /edit revision changed/u)
})

test("verifies our exact saved recent revision and its baseline", () => {
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const after = observation(SUBMITTED, [edit("ours", SUBMITTED), edit("baseline", BASELINE)])

  assert.deepEqual(auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER), {
    status: "verified",
  })
})

test("locates a single intervening append while preserving every original Markdown byte", () => {
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const independentBody = `${BASELINE}\nExtra reviewer note.\n`
  const after = observation(SUBMITTED, [
    edit("ours", SUBMITTED),
    edit("peer-append", independentBody, "reviewer"),
    edit("baseline", BASELINE),
  ])

  assert.deepEqual(auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER), {
    status: "repairable",
    intervening:
      "## Context\nExisting ![old](https://github.com/user-attachments/assets/old-id)\n\nExtra reviewer note.\n",
  })
})

test("does not treat an intervening redacted revision as a clean save", () => {
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const after = observation(SUBMITTED, [
    edit("ours", SUBMITTED),
    edit("redacted", null, "reviewer"),
    edit("baseline", BASELINE),
  ])

  assert.deepEqual(auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER), {
    status: "ambiguous",
  })
})

test("does not overwrite a later peer edit when our saved revision is present but no longer current", () => {
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const current = `${SUBMITTED}\nPeer change after the save.\n`
  const after = observation(current, [
    edit("peer", current, "reviewer"),
    edit("ours", SUBMITTED),
    edit("baseline", BASELINE),
  ])

  assert.deepEqual(auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER), {
    status: "ambiguous",
  })
})

test("rejects an unrecognized history representation before publication", () => {
  const pr = observation(BASELINE, [edit("opaque", "@@ -1 +1 @@\n- old\n+ new")])

  assert.throws(
    () => screenshotBodyVersion(pr),
    /does not expose the current complete body revision/u
  )
})

test("shows the exact ordered capture plan without creating local browser state", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "screenshot-preview-test-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const manifest = join(directory, "screenshots.json")
  await writeFile(join(directory, "second.png"), "second staged test capture")
  await writeFile(join(directory, "first.png"), "first staged test capture")
  await writeFile(
    manifest,
    JSON.stringify({
      prUrl: "https://github.com/example/project/pull/173",
      screenshots: [
        { filePath: "second.png", caption: "Second capture selected first", route: "/beta" },
        { filePath: "first.png", caption: "First capture selected second", route: "/alpha?tab=1" },
      ],
    })
  )
  const profileRoot = join(directory, "unused-profile")

  const { stdout } = await run(process.execPath, [
    command,
    "preview",
    "--manifest",
    manifest,
    "--profile-root",
    profileRoot,
  ])

  assert.deepEqual(JSON.parse(stdout), {
    prUrl: "https://github.com/example/project/pull/173",
    screenshots: [
      {
        filePath: join(directory, "second.png"),
        caption: "Second capture selected first",
        route: "/beta",
      },
      {
        filePath: join(directory, "first.png"),
        caption: "First capture selected second",
        route: "/alpha?tab=1",
      },
    ],
  })
  await assert.rejects(access(profileRoot), { code: "ENOENT" })
})

test("refuses non-interactive publication before creating an owned profile", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "screenshot-consent-test-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const manifest = join(directory, "screenshots.json")
  const profileRoot = join(directory, "unused-profile")
  await writeFile(join(directory, "capture.png"), "staged test capture")
  await writeFile(
    manifest,
    JSON.stringify({
      prUrl: "https://github.com/example/project/pull/173",
      screenshots: [{ filePath: "capture.png", caption: "Test", route: "/app" }],
    })
  )

  await assert.rejects(
    run(process.execPath, [
      command,
      "publish",
      "--manifest",
      manifest,
      "--profile-root",
      profileRoot,
    ]),
    /interactive terminal to confirm/u
  )
  await assert.rejects(access(profileRoot), { code: "ENOENT" })
})

function edit(id, diff, actor = "maintainer") {
  return {
    id,
    diff,
    deletedAt: null,
    editor: { login: actor },
  }
}

function observation(body, nodes) {
  return {
    id: "test-pr",
    actor: "maintainer",
    writable: true,
    hash: markdownHash(body),
    history: { nodes },
  }
}
