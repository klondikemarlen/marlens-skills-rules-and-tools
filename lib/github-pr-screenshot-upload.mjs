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

  await page.goto(pageUrl, { waitUntil: "domcontentloaded" })
  await requireAuthenticatedGitHub(page)
  const editor = await openPullRequestCommentEditor(
    page,
    resolvedTargetSelector,
    editorSelector,
    timeoutMs
  )
  await requireTargetedEditor(editor, resolvedTargetSelector)

  const results = []
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

  await submitCommentForm(editor)
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

  try {
    const persistedMarkdown = await persistedEditor.evaluate((element) => element.value)

    for (const { attachmentUrl } of results) {
      if (!persistedMarkdown.includes(attachmentUrl)) {
        throw new Error("Uploaded screenshot URL is missing from persisted target Markdown.")
      }
    }
  } finally {
    await cancelCommentForm(persistedEditor)
    await page.waitForSelector(scopedEditorSelector, {
      hidden: true,
      timeout: timeoutMs,
    })
  }

  return results
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

export default uploadPullRequestCommentScreenshots
