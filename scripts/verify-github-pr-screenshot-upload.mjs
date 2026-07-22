import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { uploadPullRequestCommentScreenshots } from '../lib/github-pr-screenshot-upload.mjs';

class ElementHandle {
  constructor(node) {
    this.node = node;
  }

  async evaluate(callback, ...args) {
    return callback(this.node, ...args);
  }

  async click() {
    this.node.click();
  }

  async uploadFile(filePath) {
    this.node.onUpload(filePath);
  }
}

class Page {
  constructor({ authenticated = true, targetSelector }) {
    this.authenticated = authenticated;
    this.targetSelector = targetSelector;
    this.persistedMarkup = '';
    this.submitted = false;
    this.urls = [];
  }

  async goto(url) {
    this.url = url;
  }

  async $(selector) {
    if (selector === 'a[href^="/login"]') return this.authenticated ? null : new ElementHandle({});
    if (selector === this.targetSelector) return this.target;
    if (selector === `${this.targetSelector} textarea`) return this.editor;
    return null;
  }

  async $$(selector) {
    return selector === `${this.targetSelector} input[type="file"]` ? [this.input] : [];
  }

  async evaluate(callback, ...args) {
    const document = globalThis.document;
    globalThis.document = {
      querySelector: (selector) => (
        selector === `${this.targetSelector} button.js-comment-edit-button`
          ? this.menuEdit.node
          : null
      ),
    };
    try {
      return callback(...args.map((arg) => (arg instanceof ElementHandle ? arg.node : arg)));
    } finally {
      globalThis.document = document;
    }
  }

  async waitForSelector(selector, options) {
    if (selector.includes('.js-comment-edit-button')) {
      assert.equal(options.visible, true);
      return this.menuEdit || this.editor;
    }
    if (selector === this.targetSelector && options.visible) return this.target;
    assert.equal(selector, `${this.targetSelector} textarea`);
    if (options.visible) return this.editor;
    assert.equal(options.hidden, true);
    assert.equal(this.submitted, true);
  }

  async waitForFunction(_callback, options, selector, attachmentUrl) {
    assert.equal(options.timeout, 60_000);
    assert.equal(selector, this.targetSelector);
    assert.equal(this.persistedMarkup.includes(attachmentUrl), true);
  }

}

function controlNode(label, click, ariaLabel = label) {

  return {
    textContent: label,
    click,
    getAttribute(name) {
      return name === 'aria-label' ? ariaLabel : null;
    },
  };
}

function buildPage({ authenticated = true, targetSelector = '#issue-123' } = {}) {
  const page = new Page({ authenticated, targetSelector });
  const submit = {
    disabled: false,
    click() {
      page.submitted = true;
      page.persistedMarkup = page.urls.join('\n');
    },
  };
  const form = {
    contains(node) {
      return node === input;
    },
    querySelectorAll() {
      return [submit];
    },
  };
  const target = {
    get innerHTML() {
      return page.persistedMarkup;
    },
  };
  const editor = {
    value: '<!-- screenshot -->',
    selectionStart: 0,
    selectionEnd: 0,
    closest(selector) {
      if (selector === 'form') return form;
      return selector === targetSelector ? target : null;
    },
    focus() {},
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  const input = {
    type: 'file',
    form,
    onUpload() {
      const markdown = '<img src="https://github.com/user-attachments/assets/test-upload" />';
      editor.value = `${editor.value.slice(0, editor.selectionStart)}${markdown}${editor.value.slice(editor.selectionEnd)}`;
      page.urls.push('https://github.com/user-attachments/assets/test-upload');
    },
  };
  page.target = new ElementHandle(target);
  page.editor = new ElementHandle(editor);
  page.input = new ElementHandle(input);
  return page;
}

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'github-pr-upload-test-'));
try {
  const imagePath = path.join(tmpDir, 'screenshot.png');
  writeFileSync(imagePath, 'png');

  const page = buildPage();
  const result = await uploadPullRequestCommentScreenshots({
    page,
    prUrl: 'https://github.com/owner/repository/pull/123#issue-123',
    editorSelector: 'textarea',
    fileInputSelector: 'input[type="file"]',
    screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
  });
  assert.equal(result[0].attachmentUrl, 'https://github.com/user-attachments/assets/test-upload');
  assert.equal(page.url, 'https://github.com/owner/repository/pull/123');

  const closedEditorPage = buildPage();
  let editorOpen = false;
  let detailsOpen = false;
  const originalDollar = closedEditorPage.$.bind(closedEditorPage);
  const originalDollarDollar = closedEditorPage.$$.bind(closedEditorPage);
  closedEditorPage.$ = async (selector) => {
    if (selector === '#issue-123 textarea') return editorOpen ? closedEditorPage.editor : null;
    if (selector === '#issue-123 summary:has(svg[aria-label="Show options"])') {
      return new ElementHandle({
        click() { detailsOpen = true; },
        closest() {
          return { querySelectorAll() { return [closedEditorPage.menuEdit.node]; } };
        },
      });
    }
    if (selector === '#issue-123 details-menu .js-comment-edit-button, #issue-123 details-menu [aria-label="Edit comment"]') {
      return closedEditorPage.menuEdit;
    }
    return originalDollar(selector);
  };
  closedEditorPage.menuEdit = new ElementHandle(
    controlNode('Edit', () => { editorOpen = true; }, 'Edit comment'),
  );
  closedEditorPage.$$ = async (selector) => {
    if (selector === '#issue-123 details-menu .js-comment-edit-button, #issue-123 details-menu [aria-label="Edit comment"]') {
      return [closedEditorPage.menuEdit];
    }
    return originalDollarDollar(selector);
  };
  await uploadPullRequestCommentScreenshots({
    page: closedEditorPage,
    prUrl: 'https://github.com/owner/repository/pull/123#issue-123',
    editorSelector: 'textarea',
    fileInputSelector: 'input[type="file"]',
    screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
  });
  assert.equal(editorOpen, true);
  assert.equal(detailsOpen, true);

  const commentPage = buildPage({ targetSelector: '#issuecomment-456' });
  await uploadPullRequestCommentScreenshots({
    page: commentPage,
    prUrl: 'https://github.com/owner/repository/pull/123#issuecomment-456',
    editorSelector: 'textarea',
    fileInputSelector: 'input[type="file"]',
    screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
  });
  assert.equal(commentPage.submitted, true);

  await assert.rejects(
    () => uploadPullRequestCommentScreenshots({
      page: buildPage({ authenticated: false }),
      prUrl: 'https://github.com/owner/repository/pull/123#issue-123',
      editorSelector: 'textarea',
      fileInputSelector: 'input[type="file"]',
      screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
    }),
    /not authenticated/,
  );
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log('github PR screenshot upload checks passed');
