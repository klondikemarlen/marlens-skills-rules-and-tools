import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { uploadPullRequestBodyScreenshots } from '../lib/github-pr-screenshot-upload.mjs';

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
  constructor({ authenticated = true, editor, input }) {
    this.authenticated = authenticated;
    this.editor = new ElementHandle(editor);
    this.input = new ElementHandle(input);
    this.persistedBody = '';
    this.submitted = false;
    this.urls = [];
  }

  async goto(url) {
    this.url = url;
  }

  async $(selector) {
    if (selector === 'a[href^="/login"]') return this.authenticated ? null : new ElementHandle({});
    return selector === '#pr-body' ? this.editor : null;
  }

  async $$(selector) {
    return selector === 'input[type="file"]' ? [this.input] : [];
  }

  async evaluate(callback, ...args) {
    return callback(...args.map((arg) => (arg instanceof ElementHandle ? arg.node : arg)));
  }

  async waitForSelector(selector, options) {
    if (selector.includes('details-menu')) {
      assert.equal(options.visible, true);
      return this.editor;
    }
    assert.equal(selector, '#pr-body');
    if (options.visible) return this.editor;
    assert.equal(options.hidden, true);
    assert.equal(this.submitted, true);
  }

  async content() {
    return this.persistedBody;
  }
}

function controlNode(label, click, hidden = false) {
  return {
    hidden,
    textContent: label,
    click,
    getAttribute(name) {
      if (name === 'aria-label') return label;
      return hidden && name === 'aria-hidden' ? 'true' : null;
    },
  };
}

function buildPage({ authenticated = true, temporaryComment = false } = {}) {
  const page = new Page({ authenticated, editor: null, input: null });
  const submit = {
    disabled: false,
    click() {
      page.submitted = true;
      page.persistedBody = page.urls.join('\n');
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
  const editor = {
    id: temporaryComment ? 'new_comment_field' : 'issue-123-body',
    name: temporaryComment ? 'comment[body]' : 'issue[body]',
    value: '<!-- screenshot -->',
    selectionStart: 0,
    selectionEnd: 0,
    closest(selector) {
      return selector === 'form' ? form : null;
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
  page.editor = new ElementHandle(editor);
  page.input = new ElementHandle(input);
  return page;
}

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'github-pr-upload-test-'));
try {
  const imagePath = path.join(tmpDir, 'screenshot.png');
  writeFileSync(imagePath, 'png');

  const page = buildPage();
  const result = await uploadPullRequestBodyScreenshots({
    page,
    prUrl: 'https://github.com/owner/repository/pull/123',
    editorSelector: '#pr-body',
    fileInputSelector: 'input[type="file"]',
    screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
  });
  assert.equal(result[0].attachmentUrl, 'https://github.com/user-attachments/assets/test-upload');

  const closedEditorPage = buildPage();
  let editorOpen = false;
  let prBodyDetailsOpen = false;
  const originalDollar = closedEditorPage.$.bind(closedEditorPage);
  const originalDollarDollar = closedEditorPage.$$.bind(closedEditorPage);
  closedEditorPage.$ = async (selector) => {
    if (selector === '#pr-body') return editorOpen ? closedEditorPage.editor : null;
    if (selector === '#pr-body-controls summary') {
      return new ElementHandle({
        click() { prBodyDetailsOpen = true; },
      });
    }
    return originalDollar(selector);
  };
  closedEditorPage.$$ = async (selector) => {
    if (selector === '#pr-body-controls details-menu button, #pr-body-controls details-menu [role="menuitem"], #pr-body-controls details-menu a') {
      return [new ElementHandle(controlNode('Edit', () => { editorOpen = true; }))];
    }
    if (selector === 'button, [role="menuitem"], a') {
      return [new ElementHandle(controlNode('Edit', () => {}))];
    }
    return originalDollarDollar(selector);
  };
  await uploadPullRequestBodyScreenshots({
    page: closedEditorPage,
    prUrl: 'https://github.com/owner/repository/pull/123',
    editorSelector: '#pr-body',
    bodyControlsSelector: '#pr-body-controls',
    fileInputSelector: 'input[type=\"file\"]',
    screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
  });
  assert.equal(editorOpen, true);
  assert.equal(prBodyDetailsOpen, true);

  assert.equal(page.submitted, true);

  await assert.rejects(
    () => uploadPullRequestBodyScreenshots({
      page: buildPage({ authenticated: false }),
      prUrl: 'https://github.com/owner/repository/pull/123',
      editorSelector: '#pr-body',
      fileInputSelector: 'input[type="file"]',
      screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
    }),
    /not authenticated/,
  );

  await assert.rejects(
    () => uploadPullRequestBodyScreenshots({
      page: buildPage({ temporaryComment: true }),
      prUrl: 'https://github.com/owner/repository/pull/123',
      editorSelector: '#pr-body',
      fileInputSelector: 'input[type="file"]',
      screenshots: [{ filePath: imagePath, placeholder: '<!-- screenshot -->' }],
    }),
    /Temporary comment editors/,
  );
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log('github PR screenshot upload checks passed');
