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
  constructor({ authenticated = true, targetSelector }) {
    this.authenticated = authenticated
    this.targetSelector = targetSelector
    this.persistedMarkdown = ""
    this.submitted = false
    this.editorVisible = true
  }

  async goto(url) {
    this.url = url

    if (this.submitted) {
      this.editor.node.value = this.persistedMarkdown
      this.editorVisible = true
    }
  }

  async $(selector) {
    if (selector === 'a[href^="/login"]') return this.authenticated ? null : new ElementHandle({})
    if (selector === this.targetSelector) return this.target
    if (selector === `${this.targetSelector} textarea`) return this.editor
    return null
  }

  async $$(selector) {
    return selector === `${this.targetSelector} input[type="file"]` ? [this.input] : []
  }

  async evaluate(callback, ...args) {
    const document = globalThis.document
    globalThis.document = {
      querySelector: (selector) => (selector === this.targetSelector ? this.target.node : null),
    }
    try {
      return callback(...args.map((arg) => (arg instanceof ElementHandle ? arg.node : arg)))
    } finally {
      globalThis.document = document
    }
  }

  async waitForSelector(selector, options) {
    if (selector === this.targetSelector) return this.target

    if (selector !== `${this.targetSelector} textarea`) {
      throw new Error("Target editor is not present.")
    }

    if (options.hidden && this.editorVisible) {
      throw new Error("Target editor is still visible.")
    }

    return this.editor
  }
}

function buildPage({ authenticated = true, targetSelector = "#issue-123" } = {}) {
  const page = new Page({ authenticated, targetSelector })
  const submit = {
    disabled: false,
    click() {
      page.submitted = true
      page.persistedMarkdown = editor.value
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
      const markdown = '<img src="https://github.com/user-attachments/assets/test-upload" />'
      editor.value = `${editor.value.slice(0, editor.selectionStart)}${markdown}${editor.value.slice(editor.selectionEnd)}`
    },
  }
  page.target = new ElementHandle(target)
  page.editor = new ElementHandle(editor)
  page.input = new ElementHandle(input)
  return page
}

const tmpDir = mkdtempSync(path.join(os.tmpdir(), "github-pr-upload-test-"))
try {
  const imagePath = path.join(tmpDir, "screenshot.png")
  writeFileSync(imagePath, "png")

  const page = buildPage()
  page.editor.node.value =
    '# Upload QA\n<img src="https://github.com/user-attachments/assets/existing-image" />\n<!-- screenshot -->\nOriginal footer'
  await uploadPullRequestCommentScreenshots({
    page,
    prUrl: "https://github.com/owner/repository/pull/123#issue-123",
    editorSelector: "textarea",
    fileInputSelector: 'input[type="file"]',
    screenshots: [{ filePath: imagePath, placeholder: "<!-- screenshot -->" }],
  })
  assert.equal(
    page.persistedMarkdown,
    '# Upload QA\n<img src="https://github.com/user-attachments/assets/existing-image" />\n<img src="https://github.com/user-attachments/assets/test-upload" />\nOriginal footer'
  )

  const missingAttachmentPage = buildPage()
  const navigate = missingAttachmentPage.goto.bind(missingAttachmentPage)
  missingAttachmentPage.goto = async (url) => {
    await navigate(url)

    if (missingAttachmentPage.submitted) {
      missingAttachmentPage.editor.node.value = "Saved body without the uploaded attachment."
    }
  }

  await assert.rejects(
    () =>
      uploadPullRequestCommentScreenshots({
        page: missingAttachmentPage,
        prUrl: "https://github.com/owner/repository/pull/123#issue-123",
        editorSelector: "textarea",
        fileInputSelector: 'input[type="file"]',
        screenshots: [{ filePath: imagePath, placeholder: "<!-- screenshot -->" }],
      }),
    /missing from persisted target Markdown/
  )

  await assert.rejects(
    () =>
      uploadPullRequestCommentScreenshots({
        page: buildPage({ authenticated: false }),
        prUrl: "https://github.com/owner/repository/pull/123#issue-123",
        editorSelector: "textarea",
        fileInputSelector: 'input[type="file"]',
        screenshots: [{ filePath: imagePath, placeholder: "<!-- screenshot -->" }],
      }),
    /not authenticated/
  )
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}

console.log("github PR screenshot upload checks passed")
