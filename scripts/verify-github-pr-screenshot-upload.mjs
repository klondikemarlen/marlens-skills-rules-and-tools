import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { uploadPullRequestCommentScreenshots } from "../lib/github-pr-screenshot-upload.mjs"

class ElementHandle {
  constructor(node) {
    this.node = node
  }

  async evaluate(callback, ...args) {
    return callback(this.node, ...args)
  }

  async click() {
    this.node.click()
  }

  async uploadFile(filePath) {
    this.node.onUpload(filePath)
  }
}

class Page {
  constructor({
    authenticated = true,
    targetSelector,
    failUploadAt,
    failSubmit = false,
    reopenFailure = false,
    persistedMarkdownTransform,
  }) {
    this.authenticated = authenticated
    this.targetSelector = targetSelector
    this.failUploadAt = failUploadAt
    this.failSubmit = failSubmit
    this.reopenFailure = reopenFailure
    this.persistedMarkdownTransform = persistedMarkdownTransform
    this.persistedMarkdown = ""
    this.submitted = false
    this.editorVisible = true
    this.uploadCount = 0
    this.submitCount = 0
    this.optionsMenuOpen = false
  }

  async goto(url) {
    this.url = url

    if (this.submitted) {
      this.editor.node.value = this.persistedMarkdown
      this.editorVisible = !this.reopenFailure
    }
  }

  async $(selector) {
    if (selector === 'a[href^="/login"]') return this.authenticated ? null : new ElementHandle({})
    if (selector === this.targetSelector) return this.target
    if (selector === `${this.targetSelector} textarea`) {
      return this.editorVisible ? this.editor : null
    }
    if (selector === `${this.targetSelector} summary:has(svg[aria-label="Show options"])`) {
      return this.options
    }
    return null
  }

  async $$(selector) {
    return selector === `${this.targetSelector} input[type="file"]` ? [this.input] : []
  }

  async evaluate(callback, ...args) {
    const document = globalThis.document
    globalThis.document = {
      querySelector: (selector) => {
        if (selector === this.targetSelector) return this.target.node
        if (selector === `${this.targetSelector} button.js-comment-edit-button`) {
          return this.edit.node
        }
        return null
      },
    }
    try {
      return callback(...args.map((arg) => (arg instanceof ElementHandle ? arg.node : arg)))
    } finally {
      globalThis.document = document
    }
  }

  async waitForSelector(selector, options) {
    if (selector === this.targetSelector) return this.target

    if (selector === `${this.targetSelector} button.js-comment-edit-button`) {
      if (this.reopenFailure && this.submitted) {
        throw new Error("The saved target's Edit control is unavailable.")
      }
      if (!this.optionsMenuOpen) throw new Error("Comment options menu is closed.")
      return this.edit
    }

    if (selector !== `${this.targetSelector} textarea`) {
      throw new Error("Target editor is not present.")
    }

    if (options.hidden) {
      if (this.editorVisible) throw new Error("Target editor is still visible.")
      return null
    }
    if (!this.editorVisible) throw new Error("Target editor is not visible.")
    return this.editor
  }
}

function buildPage({
  authenticated = true,
  targetSelector = "#issue-123",
  failUploadAt,
  failSubmit = false,
  reopenFailure = false,
  persistedMarkdownTransform,
} = {}) {
  const page = new Page({
    authenticated,
    targetSelector,
    failUploadAt,
    failSubmit,
    reopenFailure,
    persistedMarkdownTransform,
  })
  const submit = {
    disabled: false,
    click() {
      page.submitCount += 1
      if (page.failSubmit) throw new Error("Target comment form submission failed.")
      page.submitted = true
      page.persistedMarkdown = page.persistedMarkdownTransform
        ? page.persistedMarkdownTransform(editor.value)
        : editor.value
      page.editorVisible = false
    },
  }
  const form = {
    contains(node) {
      return node === input
    },
    querySelectorAll() {
      return [submit]
    },
    querySelector() {
      return {
        click() {
          page.editorVisible = false
        },
      }
    },
  }
  const target = {}
  const details = { open: false }
  const editor = {
    value: "<!-- screenshot -->",
    selectionStart: 0,
    selectionEnd: 0,
    closest(selector) {
      if (selector === "form") return form
      return selector === targetSelector ? target : null
    },
    focus() {},
    setSelectionRange(start, end) {
      this.selectionStart = start
      this.selectionEnd = end
    },
  }
  const input = {
    type: "file",
    form,
    onUpload() {
      page.uploadCount += 1
      if (page.uploadCount === page.failUploadAt) {
        throw new Error("Staged screenshot could not be transferred.")
      }
      const markdown = `<img src="https://github.com/user-attachments/assets/upload-${page.uploadCount}" />`
      editor.value = `${editor.value.slice(0, editor.selectionStart)}${markdown}${editor.value.slice(editor.selectionEnd)}`
    },
  }
  const options = {
    closest(selector) {
      return selector === "details" ? details : null
    },
    click() {
      details.open = true
      page.optionsMenuOpen = true
    },
  }
  const edit = {
    textContent: "Edit",
    click() {
      page.editorVisible = true
    },
  }
  page.target = new ElementHandle(target)
  page.editor = new ElementHandle(editor)
  page.input = new ElementHandle(input)
  page.options = new ElementHandle(options)
  page.edit = new ElementHandle(edit)
  return page
}

const tmpDir = mkdtempSync(path.join(os.tmpdir(), "github-pr-upload-test-"))
try {
  const imagePath = path.join(tmpDir, "screenshot.png")
  const secondImagePath = path.join(tmpDir, "second-screenshot.png")
  writeFileSync(imagePath, "png")
  writeFileSync(secondImagePath, "png")

  const upload = (
    page,
    screenshots = [{ filePath: imagePath, placeholder: "<!-- screenshot -->" }]
  ) =>
    uploadPullRequestCommentScreenshots({
      page,
      prUrl: "https://github.com/owner/repository/pull/123#issue-123",
      editorSelector: "textarea",
      fileInputSelector: 'input[type="file"]',
      screenshots,
    })

  const page = buildPage()
  page.editor.node.value =
    '# Upload QA\n<img src="https://github.com/user-attachments/assets/existing-image" />\n<!-- screenshot -->\nOriginal footer'
  const results = await upload(page)
  const firstAttachmentUrl = "https://github.com/user-attachments/assets/upload-1"
  assert.deepEqual(results, [
    {
      markdown: `<img src="${firstAttachmentUrl}" />`,
      attachmentUrl: firstAttachmentUrl,
    },
  ])
  assert.equal(
    page.persistedMarkdown,
    `# Upload QA\n<img src="https://github.com/user-attachments/assets/existing-image" />\n<img src="${firstAttachmentUrl}" />\nOriginal footer`
  )
  assert.equal(page.submitCount, 1)
  assert.equal(page.uploadCount, 1)

  const reopenFailurePage = buildPage({ reopenFailure: true })
  const reopenError = await upload(reopenFailurePage).then(
    () => assert.fail("A failed editor reopen must reject."),
    (error) => error
  )
  assert.deepEqual(reopenError.uploadEvidence, {
    phase: "verification",
    targetSelector: "#issue-123",
    attachmentResults: [
      {
        markdown: `<img src="${firstAttachmentUrl}" />`,
        attachmentUrl: firstAttachmentUrl,
      },
    ],
    attachmentUrls: [firstAttachmentUrl],
    saveStatus: "submitted",
    persistedAttachmentUrls: null,
    missingAttachmentUrls: null,
    bodyMatchesSubmittedMarkdown: null,
  })
  assert.equal(reopenFailurePage.submitCount, 1)
  assert.equal(reopenFailurePage.uploadCount, 1)

  const missingAttachmentPage = buildPage({
    persistedMarkdownTransform: () => "Saved body without the uploaded attachment.",
  })
  const missingAttachmentError = await upload(missingAttachmentPage).then(
    () => assert.fail("Missing persisted attachment must reject."),
    (error) => error
  )
  assert.match(missingAttachmentError.message, /missing from persisted target Markdown/)
  assert.equal(missingAttachmentError.uploadEvidence.saveStatus, "read-back-mismatch")
  assert.deepEqual(missingAttachmentError.uploadEvidence.persistedAttachmentUrls, [])
  assert.deepEqual(missingAttachmentError.uploadEvidence.missingAttachmentUrls, [
    firstAttachmentUrl,
  ])
  assert.equal(missingAttachmentError.uploadEvidence.bodyMatchesSubmittedMarkdown, false)

  const firstPlaceholder = "<!-- screenshot: first -->"
  const secondPlaceholder = "<!-- screenshot: second -->"
  const partialPage = buildPage({
    persistedMarkdownTransform: (markdown) =>
      markdown.replace("https://github.com/user-attachments/assets/upload-2", ""),
  })
  partialPage.editor.node.value = `${firstPlaceholder}\nUnchanged surrounding Markdown\n${secondPlaceholder}`
  const partialError = await upload(partialPage, [
    { filePath: imagePath, placeholder: firstPlaceholder },
    { filePath: secondImagePath, placeholder: secondPlaceholder },
  ]).then(
    () => assert.fail("Partial persistence must reject."),
    (error) => error
  )
  assert.deepEqual(partialError.uploadEvidence.persistedAttachmentUrls, [firstAttachmentUrl])
  assert.deepEqual(partialError.uploadEvidence.missingAttachmentUrls, [
    "https://github.com/user-attachments/assets/upload-2",
  ])
  assert.equal(partialError.uploadEvidence.bodyMatchesSubmittedMarkdown, false)
  assert.equal(partialPage.submitCount, 1)
  assert.equal(partialPage.uploadCount, 2)

  const uploadFailurePage = buildPage({ failUploadAt: 1 })
  const uploadError = await upload(uploadFailurePage).then(
    () => assert.fail("A failed file transfer must reject."),
    (error) => error
  )
  assert.equal(uploadError.uploadEvidence.phase, "upload")
  assert.deepEqual(uploadError.uploadEvidence.attachmentUrls, [])
  assert.equal(uploadError.uploadEvidence.saveStatus, "not-attempted")
  assert.equal(uploadFailurePage.submitCount, 0)

  const submitFailurePage = buildPage({ failSubmit: true })
  const submitError = await upload(submitFailurePage).then(
    () => assert.fail("A failed submit action must reject."),
    (error) => error
  )
  assert.equal(submitError.uploadEvidence.phase, "save")
  assert.deepEqual(submitError.uploadEvidence.attachmentUrls, [firstAttachmentUrl])
  assert.equal(submitError.uploadEvidence.saveStatus, "attempting")
  assert.equal(submitFailurePage.submitted, false)

  const authenticationError = await upload(buildPage({ authenticated: false })).then(
    () => assert.fail("A signed-out browser must reject."),
    (error) => error
  )
  assert.equal(authenticationError.uploadEvidence.phase, "authentication")
  assert.deepEqual(authenticationError.uploadEvidence.attachmentUrls, [])
  assert.equal(authenticationError.uploadEvidence.saveStatus, "not-attempted")
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}

console.log("github PR screenshot upload checks passed")
