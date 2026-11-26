import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
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
import { publishScreenshotBatch } from "../../lib/github-pr-screenshots.mjs"

const BASELINE = "## Context\nExisting ![old](https://github.com/user-attachments/assets/old-id)\n"
const MARKER = "<!-- mssrt-pr-screenshots:test -->"
const SUBMITTED = `${BASELINE}\n${MARKER}\nQA evidence\n`
const run = promisify(execFile)
const command = fileURLToPath(new URL("../../bin/github-pr-screenshots", import.meta.url))

test("when only line endings differ, hashes match without trimming other Markdown", () => {
  // Arrange
  const windowsMarkdown = "## Context\r\nOne  \r\n"
  const unixMarkdown = "## Context\nOne  \n"
  const trimmedMarkdown = "## Context\nOne\n"

  // Act
  const windowsHash = markdownHash(windowsMarkdown)
  const unixHash = markdownHash(unixMarkdown)
  const trimmedHash = markdownHash(trimmedMarkdown)

  // Assert
  assert.equal(windowsHash, unixHash)
  assert.notEqual(windowsHash, trimmedHash)
})

test("when an edit is reverted to the same body, still refuses to save", () => {
  // Arrange
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const current = observation(BASELINE, [edit("reverted", BASELINE), edit("baseline", BASELINE)])

  // Act / Assert
  assert.throws(() => requireFreshScreenshotBody(current, before), /edit revision changed/u)
})

test("when history contains only our saved edit after the baseline, verifies the save", () => {
  // Arrange
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const after = observation(SUBMITTED, [edit("ours", SUBMITTED), edit("baseline", BASELINE)])

  // Act
  const audit = auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER)

  // Assert
  assert.deepEqual(audit, {
    status: "verified",
  })
})

test("when one intervening edit only appends text, identifies it for repair", () => {
  // Arrange
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const independentBody = `${BASELINE}\nExtra reviewer note.\n`
  const after = observation(SUBMITTED, [
    edit("ours", SUBMITTED),
    edit("peer-append", independentBody, "reviewer"),
    edit("baseline", BASELINE),
  ])

  // Act
  const audit = auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER)

  // Assert
  assert.deepEqual(audit, {
    status: "repairable",
    intervening:
      "## Context\nExisting ![old](https://github.com/user-attachments/assets/old-id)\n\nExtra reviewer note.\n",
  })
})

test("when an intervening revision is redacted, reports an ambiguous save", () => {
  // Arrange
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const after = observation(SUBMITTED, [
    edit("ours", SUBMITTED),
    edit("redacted", null, "reviewer"),
    edit("baseline", BASELINE),
  ])

  // Act
  const audit = auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER)

  // Assert
  assert.deepEqual(audit, {
    status: "ambiguous",
  })
})

test("when a peer edits the body after our save, reports an ambiguous save", () => {
  // Arrange
  const before = screenshotBodyVersion(observation(BASELINE, [edit("baseline", BASELINE)]))
  const current = `${SUBMITTED}\nPeer change after the save.\n`
  const after = observation(current, [
    edit("peer", current, "reviewer"),
    edit("ours", SUBMITTED),
    edit("baseline", BASELINE),
  ])

  // Act
  const audit = auditScreenshotHistory(after, before, markdownHash(SUBMITTED), MARKER)

  // Assert
  assert.deepEqual(audit, {
    status: "ambiguous",
  })
})

test("when history is not a complete body snapshot, rejects it before publication", () => {
  // Arrange
  const pr = observation(BASELINE, [edit("opaque", "@@ -1 +1 @@\n- old\n+ new")])

  // Act / Assert
  assert.throws(
    () => screenshotBodyVersion(pr),
    /does not expose the current complete body revision/u
  )
})

test("when previewing two captures, prints them in order without browser state", async (t) => {
  // Arrange
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

  // Act
  const { stdout } = await run(process.execPath, [
    command,
    "preview",
    "--manifest",
    manifest,
    "--profile-root",
    profileRoot,
  ])

  // Assert
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
  await assert.rejects(access(profileRoot), {
    code: "ENOENT",
  })
})

test("when publish cannot prompt for consent, fails without starting a browser", async (t) => {
  // Arrange
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

  // Act
  const publication = run(process.execPath, [
    command,
    "publish",
    "--manifest",
    manifest,
    "--profile-root",
    profileRoot,
  ])

  // Assert
  await assert.rejects(publication, /interactive terminal to confirm/u)
  await assert.rejects(access(profileRoot), {
    code: "ENOENT",
  })
})

test("when a peer appends text during Save, restores that text without uploading again", async (t) => {
  // Arrange
  const directory = await mkdtemp(join(tmpdir(), "screenshot-repair-test-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const firstPath = join(directory, "before.png")
  const secondPath = join(directory, "after.png")
  const firstCapture = "before capture bytes"
  const secondCapture = "after capture bytes"
  await writeFile(firstPath, firstCapture)
  await writeFile(secondPath, secondCapture)
  const url = "https://github.com/example/project/pull/173"
  const batch = {
    id: "test",
    marker: MARKER,
    screenshots: [
      {
        filePath: firstPath,
        hash: createHash("sha256").update(firstCapture).digest("hex"),
        caption: "Before",
        route: "/before",
        alt: "QA Screenshot 1",
      },
      {
        filePath: secondPath,
        hash: createHash("sha256").update(secondCapture).digest("hex"),
        caption: "After",
        route: "/after",
        alt: "QA Screenshot 2",
      },
    ],
  }
  const state = {
    attachments: [],
    activeUpload: null,
    submission: null,
  }
  const uploadedFiles = []
  const savedBodies = []
  const history = [edit("baseline", BASELINE)]
  let renderedBody
  const github = {
    async readPullRequest() {
      return {
        ...observation(history[0].diff, [...history]),
        url,
        markdown: history[0].diff,
      }
    },
    async openEditor() {
      let markdown = history[0].diff
      return {
        readMarkdown: async () => markdown,
        async replaceMarkdown(body) {
          markdown = body
        },
        async upload(filePath) {
          uploadedFiles.push(filePath)
          return {
            attachmentUrl: `https://github.com/user-attachments/assets/upload-${uploadedFiles.length}`,
          }
        },
        async save() {
          if (savedBodies.length === 0) {
            history.unshift(edit("peer-append", `${BASELINE}\nExtra reviewer note.\n`, "reviewer"))
          }
          savedBodies.push(markdown)
          history.unshift(edit(`save-${savedBodies.length}`, markdown))
        },
      }
    },
    async verifyPlacement() {
      renderedBody = history[0].diff
    },
  }
  const receiptPath = join(directory, "receipt.json")
  const checkpoint = () => writeFile(receiptPath, JSON.stringify(state))

  // Act
  const result = await publishScreenshotBatch(batch, state, checkpoint, github)

  // Assert
  const savedSlots = [
    "<!-- mssrt-pr-screenshots:test -->",
    "",
    "## QA Screenshots",
    "",
    "### Before",
    "",
    "`/before`",
    "",
    "![QA Screenshot 1](https://github.com/user-attachments/assets/upload-1)",
    "",
    "### After",
    "",
    "`/after`",
    "",
    "![QA Screenshot 2](https://github.com/user-attachments/assets/upload-2)",
    "",
  ].join("\n")
  const repairedBody = `${BASELINE}\nExtra reviewer note.\n\n${savedSlots}`
  assert.deepEqual(savedBodies, [`${BASELINE}\n${savedSlots}`, repairedBody])
  assert.equal(renderedBody, repairedBody)
  assert.deepEqual(uploadedFiles, [firstPath, secondPath])
  assert.deepEqual(result, {
    status: "published",
    prUrl: "https://github.com/example/project/pull/173",
    repairedConcurrentAppend: true,
    attachments: [
      {
        caption: "Before",
        route: "/before",
        attachmentUrl: "https://github.com/user-attachments/assets/upload-1",
        saved: true,
        rendered: true,
      },
      {
        caption: "After",
        route: "/after",
        attachmentUrl: "https://github.com/user-attachments/assets/upload-2",
        saved: true,
        rendered: true,
      },
    ],
  })
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
