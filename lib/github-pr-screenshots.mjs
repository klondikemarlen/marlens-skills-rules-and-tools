import { createHash, randomUUID } from "node:crypto"
import { createReadStream } from "node:fs"
import { readFile, rename, stat, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"

import {
  auditScreenshotHistory,
  markdownHash,
  readScreenshotPullRequest,
  requireFreshScreenshotBody,
  screenshotBodyVersion,
} from "./github-pr-screenshot-history.mjs"
import {
  openPullRequestScreenshotEditor,
  verifyPullRequestScreenshotPlacement,
} from "./github-pr-screenshot-upload.mjs"
import { withScreenshotFirefoxProfile } from "./screenshot-firefox-profile.mjs"

const HEADING = "QA Screenshots"
const ATTACHMENT_URL = /^https:\/\/github\.com\/user-attachments\/assets\/[\w-]+$/u

export async function githubPrScreenshots(action, options, confirm) {
  const batch = await readBatch(options.manifest, action === "revoke")
  if (action === "revoke") {
    return withScreenshotFirefoxProfile(batch, options, async ({ revoke }) => {
      if (
        !(await confirm(
          `Remove the managed Firefox login profile for ${batch.owner}/${batch.repo}?`
        ))
      ) {
        return { status: "cancelled" }
      }
      return { status: await revoke() }
    })
  }

  options.showPreview(batch.preview)
  if (action === "preview") {
    return { status: "preview" }
  }

  if (!(await confirm(`Proceed with ${action} for ${batch.prUrl}?`))) {
    return { status: "cancelled" }
  }

  return withScreenshotFirefoxProfile(batch, options, async ({ connect, directory }) => {
    const receiptPath = resolve(directory, `batch-${batch.id}.json`)
    const receipt = await loadReceipt(receiptPath, batch)
    if (receipt && action !== "resume") {
      throw new Error(
        "This exact batch already has a receipt. Use `resume` with the same manifest; do not upload it again."
      )
    }
    if (!receipt && action === "resume") {
      throw new Error(
        "No receipt matches this manifest and capture contents. Restore the original manifest and files before resuming."
      )
    }
    if (receipt?.activeUpload !== null && receipt?.activeUpload !== undefined) {
      throw new Error(
        `Upload ${receipt.activeUpload + 1} was interrupted before its URL was recorded. Inspect the PR and attachment manually; this command will not upload it again.`
      )
    }

    const pullRequest = await readScreenshotPullRequest(batch)
    if (!pullRequest.writable) {
      throw new Error(
        "The selected pull request is not open for editing by the GitHub CLI account."
      )
    }

    screenshotBodyVersion(pullRequest)
    const page = await connect(pullRequest, confirm)
    const state = receipt ?? {
      target: batch.prUrl,
      id: batch.id,
      attachments: [],
      activeUpload: null,
      submission: null,
    }
    const checkpoint = () => writeReceipt(receiptPath, state)

    if (!state.submission) {
      await prepareAndSave(page, batch, state, checkpoint)
    }

    return reconcilePublication(page, batch, state, checkpoint)
  })
}

async function readBatch(manifestPath, targetOnly) {
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  } catch {
    throw new Error(
      "Manifest could not be read as JSON. Use a private manifest with `prUrl` and ordered `screenshots`."
    )
  }

  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/([1-9]\d*)$/u.exec(
    manifest?.prUrl
  )
  if (
    !match ||
    !Number.isSafeInteger(Number(match[3])) ||
    Number(match[3]) > 2_147_483_647 ||
    [match[1], match[2]].some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(
      "Set `prUrl` to the exact https://github.com/OWNER/REPOSITORY/pull/NUMBER without a query or fragment."
    )
  }

  const [, owner, repo, number] = match
  const target = {
    owner,
    repo,
    number: Number(number),
    prUrl: manifest.prUrl,
  }
  if (targetOnly) return target

  if (!Array.isArray(manifest.screenshots) || manifest.screenshots.length === 0) {
    throw new Error("Select at least one ordered screenshot in the manifest.")
  }

  const screenshots = []
  for (const [index, screenshot] of manifest.screenshots.entries()) {
    const { caption, route, filePath } = screenshot ?? {}
    if (
      !isSingleLine(caption) ||
      !isSingleLine(route) ||
      !route.startsWith("/") ||
      route.startsWith("//") ||
      route.includes("`") ||
      !isSingleLine(filePath)
    ) {
      throw new Error(
        `Screenshot ${index + 1} needs a filePath, a one-line caption, and an app route beginning with one slash (no backticks).`
      )
    }

    const capturePath = resolve(dirname(manifestPath), filePath)
    screenshots.push({
      filePath: capturePath,
      hash: await hashCapture(capturePath, index),
      caption,
      route,
      alt: `QA Screenshot ${index + 1}`,
    })
  }

  const id = createHash("sha256")
    .update(JSON.stringify([target.prUrl.toLowerCase(), screenshots]))
    .digest("hex")
  return {
    ...target,
    id,
    marker: `<!-- mssrt-pr-screenshots:${id} -->`,
    screenshots,
    preview: {
      prUrl: target.prUrl,
      screenshots: screenshots.map(({ filePath, caption, route }) => ({
        filePath,
        caption,
        route,
      })),
    },
  }
}

function isSingleLine(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value === value.trim() &&
    Array.from(value).every((character) => {
      const code = character.codePointAt(0)
      return code >= 32 && code !== 127 && code !== 0x2028 && code !== 0x2029
    })
  )
}

async function hashCapture(filePath, index) {
  try {
    const file = await stat(filePath)
    if (!file.isFile() || file.size === 0) {
      throw new Error("Not a non-empty file")
    }

    const hash = createHash("sha256")
    for await (const chunk of createReadStream(filePath)) hash.update(chunk)
    return hash.digest("hex")
  } catch {
    throw new Error(
      `File access failed for screenshot ${index + 1}. Select a readable, non-empty staged capture.`
    )
  }
}

async function loadReceipt(filePath, batch) {
  let source
  try {
    source = await readFile(filePath, "utf8")
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw new Error(
      "The private screenshot receipt could not be read. Inspect local state before resuming.",
      { cause: error }
    )
  }

  try {
    const receipt = JSON.parse(source)
    if (
      receipt.id !== batch.id ||
      receipt.target !== batch.prUrl ||
      !Array.isArray(receipt.attachments) ||
      receipt.attachments.length > batch.screenshots.length ||
      !receipt.attachments.every((url) => typeof url === "string" && ATTACHMENT_URL.test(url)) ||
      new Set(receipt.attachments).size !== receipt.attachments.length ||
      (receipt.activeUpload !== null && receipt.activeUpload !== receipt.attachments.length) ||
      (receipt.submission &&
        (!receipt.submission.before ||
          typeof receipt.submission.hash !== "string" ||
          receipt.attachments.length !== batch.screenshots.length))
    ) {
      throw new Error("Unexpected receipt")
    }
    return receipt
  } catch {
    throw new Error(
      "The private receipt is invalid. Inspect the GitHub description and do not repeat the upload."
    )
  }
}

async function writeReceipt(filePath, receipt) {
  const temporary = `${filePath}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(receipt), {
    flag: "wx",
    mode: 0o600,
    flush: true,
  })
  await rename(temporary, filePath)
}

async function prepareAndSave(page, batch, state, checkpoint) {
  const pullRequest = await readScreenshotPullRequest(batch)
  const before = screenshotBodyVersion(pullRequest)
  if (!pullRequest.writable || pullRequest.markdown.includes(batch.marker)) {
    throw new Error(
      "The PR is not editable, or already contains this batch. Inspect its description before doing any upload."
    )
  }

  const editor = await openFreshEditor(page, pullRequest)
  for (let index = state.attachments.length; index < batch.screenshots.length; index++) {
    const screenshot = batch.screenshots[index]
    if ((await hashCapture(screenshot.filePath, index)) !== screenshot.hash) {
      throw new Error(
        `Screenshot ${index + 1} changed after preview. Restore the approved capture before continuing.`
      )
    }

    const draft = appendScreenshotBatch(pullRequest.markdown, batch, state.attachments)
    await editor.replaceMarkdown(draft)
    if (markdownHash(await editor.readMarkdown()) !== markdownHash(draft)) {
      throw new Error("The editor did not retain the exact prepared slots. No save was attempted.")
    }

    state.activeUpload = index
    await checkpoint()
    let result
    try {
      result = await editor.upload(screenshot.filePath, placeholder(batch, index))
    } catch {
      throw new Error(
        `Firefox did not confirm upload ${index + 1}. Check browser access to the file and inspect the PR; do not repeat the upload automatically.`
      )
    }

    const url = result.attachmentUrl
    if (
      !ATTACHMENT_URL.test(url) ||
      state.attachments.includes(url) ||
      pullRequest.markdown.includes(url)
    ) {
      throw new Error(
        `Upload ${index + 1} did not produce a distinct GitHub attachment. Inspect the PR before retrying.`
      )
    }

    state.attachments.push(url)
    state.activeUpload = null
    await checkpoint()
  }

  const candidate = appendScreenshotBatch(pullRequest.markdown, batch, state.attachments)
  await saveCandidate(editor, batch, state, checkpoint, before, candidate, false)
}

async function openFreshEditor(page, pullRequest) {
  let editor
  try {
    editor = await openPullRequestScreenshotEditor(page, pullRequest.url)
  } catch {
    throw new Error(
      "Firefox could not open the exact PR description editor. Verify the owned sign-in and that your account can edit the PR body."
    )
  }

  if (markdownHash(await editor.readMarkdown()) !== pullRequest.hash) {
    throw new Error(
      "The newly opened editor does not match the fresh PR body. No upload or save was attempted."
    )
  }
  return editor
}

async function saveCandidate(editor, batch, state, checkpoint, before, candidate, repair) {
  await editor.replaceMarkdown(candidate)
  const hash = markdownHash(candidate)
  if (markdownHash(await editor.readMarkdown()) !== hash) {
    throw new Error(
      "The editor changed the proposed Markdown. No save was attempted; inspect the original PR body."
    )
  }

  const originalSubmission = state.submission
  state.submission = { before, hash, repair }
  await checkpoint()
  try {
    requireFreshScreenshotBody(await readScreenshotPullRequest(batch), before)
  } catch (error) {
    state.submission = originalSubmission
    await checkpoint()
    throw error
  }

  try {
    await editor.save()
  } catch {
    // The click may have submitted successfully. Only independent history can resolve it.
  }
}

async function reconcilePublication(page, batch, state, checkpoint) {
  let observed = await readScreenshotPullRequest(batch)
  let audit = auditPublication(observed, state, batch)
  if (audit.status === "unchanged") {
    await delay(250)
    observed = await readScreenshotPullRequest(batch)
    audit = auditPublication(observed, state, batch)
  }

  if (audit.status === "repairable" && !state.submission.repair) {
    const before = screenshotBodyVersion(observed)
    const editor = await openFreshEditor(page, observed)
    const candidate = appendScreenshotBatch(audit.intervening, batch, state.attachments)
    await saveCandidate(editor, batch, state, checkpoint, before, candidate, true)
    observed = await readScreenshotPullRequest(batch)
    audit = auditPublication(observed, state, batch)
  }

  if (audit.status !== "verified") {
    throw new Error(
      "Save/history could not be reconciled safely. Review the PR description edit history and the existing attachment receipt; do not repeat the uploads."
    )
  }

  try {
    await verifyPullRequestScreenshotPlacement(page, observed.url, HEADING, batch.screenshots)
  } catch {
    throw new Error(
      "GitHub saved the intended body, but Firefox could not verify every rendered slot in order. Inspect the selected PR, then use `resume` for read-back without uploading again."
    )
  }

  const final = await readScreenshotPullRequest(batch)
  if (auditPublication(final, state, batch).status !== "verified") {
    throw new Error(
      "GitHub changed the verified body while rendering. Inspect the current PR history; no retry was attempted."
    )
  }

  return {
    status: "published",
    prUrl: observed.url,
    repairedConcurrentAppend: state.submission.repair,
    attachments: batch.screenshots.map(({ caption, route }, index) => ({
      caption,
      route,
      attachmentUrl: state.attachments[index],
      saved: true,
      rendered: true,
    })),
  }
}

function auditPublication(observed, state, batch) {
  return auditScreenshotHistory(
    observed,
    state.submission.before,
    state.submission.hash,
    batch.marker
  )
}

function appendScreenshotBatch(markdown, batch, attachments) {
  let separator = ""
  if (markdown && !markdown.endsWith("\n\n")) {
    separator = markdown.endsWith("\n") ? "\n" : "\n\n"
  }

  const slots = batch.screenshots.map(({ caption, route, alt }, index) => {
    let image = placeholder(batch, index)
    if (attachments[index]) image = `![${alt}](${attachments[index]})`
    const safeCaption = caption.replace(
      /[&<>{}[\]()*_`~\\#!|]/gu,
      (character) => `&#${character.codePointAt(0)};`
    )
    return `### ${safeCaption}\n\n\`${route}\`\n\n${image}`
  })
  return `${markdown}${separator}${batch.marker}\n\n## ${HEADING}\n\n${slots.join("\n\n")}\n`
}

function placeholder(batch, index) {
  return `<!-- mssrt-pr-screenshot:${batch.id}:${index + 1} -->`
}

export default githubPrScreenshots
