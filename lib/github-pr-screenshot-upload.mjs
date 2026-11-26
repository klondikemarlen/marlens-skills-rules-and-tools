import { addImageToGitHubMarkdownEditor } from "./github-markdown-image-upload-helper.mjs"

const DEFAULT_TIMEOUT_MS = 60_000

export async function uploadPullRequestCommentScreenshots({
  page,
  prUrl,
  targetSelector,
  editorSelector,
  fileInputSelector,
  screenshots,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const { pageUrl, resolvedTargetSelector } = validateArguments({
    page,
    prUrl,
    targetSelector,
    editorSelector,
    fileInputSelector,
    screenshots,
  })
  const results = []
  let phase = "navigation"
  let saveStatus = "not-attempted"
  let persistedAttachmentUrls = null
  let missingAttachmentUrls = null
  let bodyMatchesSubmittedMarkdown = null

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" })
    phase = "authentication"
    await requireAuthenticatedGitHub(page)
    phase = "target-editor"
    const editor = await openPullRequestCommentEditor(
      page,
      resolvedTargetSelector,
      editorSelector,
      timeoutMs
    )
    await requireTargetedEditor(editor, resolvedTargetSelector)

    phase = "upload"
    for (const screenshot of screenshots) {
      validateScreenshot(screenshot)
      results.push(
        await addImageToGitHubMarkdownEditor({
          page,
          editorSelector: `${resolvedTargetSelector} ${editorSelector}`,
          fileInputSelector: `${resolvedTargetSelector} ${fileInputSelector}`,
          filePath: screenshot.filePath,
          insertAt: screenshot.placeholder,
          timeoutMs,
        })
      )
    }

    const submittedMarkdown = await editor.evaluate((element) => element.value)
    phase = "save"
    saveStatus = "attempting"
    await submitCommentForm(editor)
    saveStatus = "submitted"

    phase = "verification"
    const scopedEditorSelector = `${resolvedTargetSelector} ${editorSelector}`
    await page.waitForSelector(scopedEditorSelector, {
      hidden: true,
      timeout: timeoutMs,
    })
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(resolvedTargetSelector, {
      visible: true,
      timeout: timeoutMs,
    })

    const persistedEditor = await openPullRequestCommentEditor(
      page,
      resolvedTargetSelector,
      editorSelector,
      timeoutMs
    )
    let verificationError
    let readBackCompleted = false

    try {
      const persistedMarkdown = await persistedEditor.evaluate((element) => element.value)
      if (typeof persistedMarkdown !== "string") {
        throw new Error("Persisted target editor did not expose Markdown text.")
      }

      readBackCompleted = true
      const attachmentUrls = results.map(({ attachmentUrl }) => attachmentUrl)
      persistedAttachmentUrls = attachmentUrls.filter((url) => persistedMarkdown.includes(url))
      missingAttachmentUrls = attachmentUrls.filter((url) => !persistedMarkdown.includes(url))
      bodyMatchesSubmittedMarkdown = persistedMarkdown === submittedMarkdown

      if (missingAttachmentUrls.length > 0) {
        throw new Error("Uploaded screenshot URL is missing from persisted target Markdown.")
      }
      if (!bodyMatchesSubmittedMarkdown) {
        throw new Error("Persisted target Markdown differs from the submitted screenshot content.")
      }
      saveStatus = "verified"
    } catch (error) {
      if (readBackCompleted) saveStatus = "read-back-mismatch"
      verificationError = error
    }
    phase = "cleanup"
    try {
      await cancelCommentForm(persistedEditor)
      await page.waitForSelector(scopedEditorSelector, {
        hidden: true,
        timeout: timeoutMs,
      })
    } catch (cleanupError) {
      if (!verificationError) throw cleanupError
      verificationError.cleanupError = cleanupError.message
    }

    if (verificationError) {
      phase = "verification"
      throw verificationError
    }
    return results
  } catch (error) {
    const attachmentUrls = results.map(({ attachmentUrl }) => attachmentUrl)
    const failure = error instanceof Error ? error : new Error(String(error))
    failure.uploadEvidence = {
      phase,
      targetSelector: resolvedTargetSelector,
      attachmentResults: results.map((result) => ({ ...result })),
      attachmentUrls,
      saveStatus,
      persistedAttachmentUrls,
      missingAttachmentUrls,
      bodyMatchesSubmittedMarkdown,
    }
    throw failure
  }
}

function validateArguments({
  page,
  prUrl,
  targetSelector,
  editorSelector,
  fileInputSelector,
  screenshots,
}) {
  if (!page || typeof page.goto !== "function" || typeof page.$ !== "function") {
    throw new Error("A Puppeteer-compatible page is required.")
  }

  let url
  try {
    url = new URL(prUrl)
  } catch {
    throw new Error("prUrl must be a GitHub pull request URL.")
  }
  if (
    url.origin !== "https://github.com" ||
    !/^\/[^/]+\/[^/]+\/pull\/\d+\/?$/u.test(url.pathname)
  ) {
    throw new Error("prUrl must be a GitHub pull request URL.")
  }

  const resolvedTargetSelector = targetSelector || url.hash
  if (!/^#(?:issue|issuecomment)-\d+$/u.test(resolvedTargetSelector || "")) {
    throw new Error("Target must be an #issue-… or #issuecomment-… URL fragment or selector.")
  }
  url.hash = ""

  if (!editorSelector) throw new Error("editorSelector is required.")
  if (!fileInputSelector) throw new Error("fileInputSelector is required.")
  if (!Array.isArray(screenshots) || screenshots.length === 0) {
    throw new Error("At least one screenshot is required.")
  }

  return { pageUrl: url.href, resolvedTargetSelector }
}

async function openPullRequestCommentEditor(page, targetSelector, editorSelector, timeoutMs) {
  const scopedEditorSelector = `${targetSelector} ${editorSelector}`
  const existingEditor = await page.$(scopedEditorSelector)
  if (existingEditor) return existingEditor

  const optionsSelector = `${targetSelector} summary:has(svg[aria-label="Show options"])`
  const options = await page.$(optionsSelector)
  if (!options) throw new Error(`Comment options control not found: ${optionsSelector}.`)

  const menuIsOpen = await options.evaluate((element) => element.closest?.("details")?.open)
  if (!menuIsOpen) await options.click()
  const editSelector = `${targetSelector} button.js-comment-edit-button`
  await page.waitForSelector(editSelector, {
    visible: true,
    timeout: timeoutMs,
  })
  const clicked = await page.evaluate((selector) => {
    const edit = document.querySelector(selector)
    if (!edit || edit.textContent?.trim() !== "Edit") return false
    edit.click()
    return true
  }, editSelector)
  if (!clicked) throw new Error("Comment options menu has no visible Edit control.")
  return page.waitForSelector(scopedEditorSelector, {
    visible: true,
    timeout: timeoutMs,
  })
}

async function requireAuthenticatedGitHub(page) {
  if (await page.$('a[href^="/login"]')) {
    throw new Error(
      "GitHub browser session is not authenticated. Sign in before uploading screenshots."
    )
  }
}

async function requireTargetedEditor(editor, targetSelector) {
  const error = await editor.evaluate((element, selector) => {
    if (!element.closest?.(selector)) return `Editor is outside target: ${selector}.`
    if (!element.closest?.("form")) return "Target editor is not inside a form."
    return null
  }, targetSelector)
  if (error) throw new Error(error)
}

function validateScreenshot(screenshot) {
  if (!screenshot?.filePath) throw new Error("Each screenshot requires filePath.")
  if (!screenshot?.placeholder) throw new Error("Each screenshot requires placeholder.")
}

async function submitCommentForm(editor) {
  const error = await editor.evaluate((element) => {
    const form = element.closest?.("form")
    const submit = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')].find(
      (control) => !control.disabled
    )
    if (!submit) return "Target comment form has no enabled submit control."
    submit.click()
    return null
  })
  if (error) throw new Error(error)
}

async function cancelCommentForm(editor) {
  const error = await editor.evaluate((element) => {
    const cancel = element.closest("form").querySelector("button.js-comment-cancel-button")

    if (!cancel) return "Target saved comment form has no Cancel control."

    cancel.click()
    return null
  })

  if (error) throw new Error(error)
}

export async function openPullRequestScreenshotEditor(page, prUrl) {
  const target = await openPullRequestScreenshotBody(page, prUrl)
  const editor = await openPullRequestCommentEditor(page, target, "textarea", DEFAULT_TIMEOUT_MS)
  await requireTargetedEditor(editor, target)

  return {
    readMarkdown: () => editor.evaluate((element) => element.value),
    async replaceMarkdown(markdown) {
      await editor.evaluate((element, value) => {
        element.value = value
        element.dispatchEvent(new Event("input", { bubbles: true }))
      }, markdown)
    },
    upload(filePath, placeholder) {
      return addImageToGitHubMarkdownEditor({
        page,
        editorSelector: `${target} textarea`,
        fileInputSelector: `${target} input[type="file"]`,
        filePath,
        insertAt: placeholder,
      })
    },
    async save() {
      await submitCommentForm(editor)
      await page.waitForSelector(`${target} textarea`, {
        hidden: true,
        timeout: DEFAULT_TIMEOUT_MS,
      })
    },
  }
}

export async function verifyPullRequestScreenshotPlacement(page, prUrl, heading, slots) {
  const target = await openPullRequestScreenshotBody(page, prUrl)
  await page.waitForFunction(
    (selector, sectionHeading, expectedSlots) => {
      const body =
        document.querySelector(
          `${selector} .js-comment-body.markdown-body, ${selector} .js-comment-body .markdown-body`
        ) ?? document.querySelector(`${selector} .markdown-body`)
      if (!body) return false

      const elements = [...body.children]
      const headingText = (element, tag) => {
        const node = element.matches(tag) ? element : element.querySelector(`:scope > ${tag}`)
        return node?.textContent
      }
      const section = elements.findLastIndex(
        (element) => headingText(element, "h2") === sectionHeading
      )
      if (section < 0 || elements.length - section - 1 !== expectedSlots.length * 3) return false

      return expectedSlots.every(({ caption, route, alt }, index) => {
        const position = section + 1 + index * 3
        const [captionElement, routeElement, imageElement] = elements.slice(position, position + 3)
        const images = imageElement.matches("img")
          ? [imageElement]
          : imageElement.querySelectorAll("img")
        if (images.length === 1 && !images[0].complete) {
          images[0].scrollIntoView({ block: "center" })
        }
        return (
          headingText(captionElement, "h3") === caption &&
          routeElement.querySelector("code")?.textContent === route &&
          images.length === 1 &&
          images[0].alt === alt &&
          images[0].complete &&
          images[0].naturalWidth > 0
        )
      })
    },
    { timeout: DEFAULT_TIMEOUT_MS },
    target,
    heading,
    slots
  )
}

async function openPullRequestScreenshotBody(page, prUrl) {
  const canonicalUrl = new URL(prUrl)
  const targetIds = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[id^="issue-"]')]
        .map(({ id }) => id)
        .filter((id) => /^issue-\d+$/u.test(id))
    )

  for (const useClassicView of [false, true]) {
    const url = new URL(canonicalUrl)
    if (useClassicView) url.searchParams.set("overview", "false")

    await page.goto(url.href, { waitUntil: "domcontentloaded" })
    const actualUrl = new URL(page.url())
    if (actualUrl.origin !== canonicalUrl.origin || actualUrl.pathname !== canonicalUrl.pathname) {
      throw new Error("GitHub navigated away from the authorized pull request.")
    }

    await requireAuthenticatedGitHub(page)
    const ids = await targetIds()
    if (ids.length === 1) return `#${ids[0]}`
    if (ids.length > 1) break
  }

  throw new Error("The selected pull request did not expose one unambiguous description target.")
}

export default uploadPullRequestCommentScreenshots
