import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { addImageToGitHubMarkdownEditor } from '../lib/github-markdown-image-upload-helper.mjs';

const helperPath = execFileSync(
  process.execPath,
  ['bin/github-markdown-image-upload-helper-path.js'],
  { encoding: 'utf8' },
).trim();
assert.equal(helperPath, path.resolve('lib/github-markdown-image-upload-helper.mjs'));

class ElementHandle {
  constructor(node) {
    this.node = node;
    this.uploads = [];
  }

  async evaluate(callback, ...args) {
    return callback(this.node, ...args);
  }

  async uploadFile(filePath) {
    this.uploads.push(filePath);
    this.node.onUpload?.(filePath);
  }
}

class MockPage {
  constructor({ editor, inputs }) {
    this.editorHandle = new ElementHandle(editor);
    this.inputHandles = inputs.map((input) => new ElementHandle(input));
  }

  async $(selector) {
    return selector === '#body' ? this.editorHandle : null;
  }

  async $$(selector) {
    return selector === 'input[type=file]' ? this.inputHandles : [];
  }

  async evaluate(callback, ...args) {
    return callback(...args.map((arg) => (arg instanceof ElementHandle ? arg.node : arg)));
  }
}

function buildForm() {
  return {
    errors: [],
    contains(node) {
      return node.form === this;
    },
    querySelectorAll() {
      return this.errors.map((textContent) => ({ textContent }));
    },
  };
}

function buildEditor(form, value) {
  return {
    value,
    form,
    disabled: false,
    readOnly: false,
    focusCalled: false,
    selection: null,
    closest(selector) {
      return selector === 'form' ? this.form : null;
    },
    focus() {
      this.focusCalled = true;
    },
    setSelectionRange(start, end) {
      this.selection = { start, end };
    },
  };
}

function buildInput(form, onUpload) {
  return { type: 'file', form, onUpload };
}

function replaceSelection(editor, markdown) {
  const { start, end } = editor.selection;
  editor.value = `${editor.value.slice(0, start)}${markdown}${editor.value.slice(end)}`;
}

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'github-upload-helper-test-'));
try {
  const imagePath = path.join(tmpDir, 'screenshot.custom');
  writeFileSync(imagePath, 'not empty');

  const scopedForm = buildForm();
  const otherForm = buildForm();
  const placeholder = '<!-- screenshot placeholder -->';
  const originalPrBody = [
    '## Context',
    'This PR body has enough surrounding text to catch destructive replacement bugs.',
    '',
    '## Screenshots',
    placeholder,
    '',
    '## Testing',
    '- Existing instructions stay intact.',
  ].join('\n');
  const editor = buildEditor(scopedForm, originalPrBody);
  const wrongInput = buildInput(otherForm, () => {
    throw new Error('wrong input should not be uploaded');
  });
  const rightMarkdown = '<img width="1" height="1" alt="Screenshot" src="https://github.com/user-attachments/assets/new-upload" />';
  const rightInput = buildInput(scopedForm, () => replaceSelection(editor, rightMarkdown));

  const result = await addImageToGitHubMarkdownEditor({
    page: new MockPage({ editor, inputs: [wrongInput, rightInput] }),
    editorSelector: '#body',
    fileInputSelector: 'input[type=file]',
    filePath: imagePath,
    insertAt: placeholder,
    timeoutMs: 50,
  });

  assert.equal(result.markdown, rightMarkdown);
  assert.equal(result.attachmentUrl, 'https://github.com/user-attachments/assets/new-upload');
  assert.equal(editor.value, originalPrBody.replace(placeholder, rightMarkdown));

  const existingMarkdown = '<img width="1" height="1" alt="Old" src="https://github.com/user-attachments/assets/existing" />';
  const editorWithExisting = buildEditor(scopedForm, `${existingMarkdown}\n${placeholder}`);
  const newMarkdown = '<img width="1" height="1" alt="New" src="https://github.com/user-attachments/assets/newer-upload" />';
  const scopedInput = buildInput(scopedForm, () => replaceSelection(editorWithExisting, newMarkdown));
  const existingResult = await addImageToGitHubMarkdownEditor({
    page: new MockPage({ editor: editorWithExisting, inputs: [scopedInput] }),
    editorSelector: '#body',
    fileInputSelector: 'input[type=file]',
    filePath: imagePath,
    insertAt: placeholder,
    timeoutMs: 50,
  });

  assert.equal(existingResult.markdown, newMarkdown);
  assert.equal(existingResult.attachmentUrl, 'https://github.com/user-attachments/assets/newer-upload');

  const formWithBaselineAlert = buildForm();
  formWithBaselineAlert.errors = ['There was an error creating your PullRequest.'];
  const editorWithBaselineAlert = buildEditor(formWithBaselineAlert, placeholder);
  const baselineMarkdown = '<img width="1" height="1" alt="Baseline" src="https://github.com/user-attachments/assets/baseline-upload" />';
  const baselineInput = buildInput(formWithBaselineAlert, () => replaceSelection(editorWithBaselineAlert, baselineMarkdown));
  const baselineResult = await addImageToGitHubMarkdownEditor({
    page: new MockPage({ editor: editorWithBaselineAlert, inputs: [baselineInput] }),
    editorSelector: '#body',
    fileInputSelector: 'input[type=file]',
    filePath: imagePath,
    insertAt: placeholder,
    timeoutMs: 50,
  });

  assert.equal(baselineResult.markdown, baselineMarkdown);
  assert.equal(baselineResult.attachmentUrl, 'https://github.com/user-attachments/assets/baseline-upload');

  const emptyPath = path.join(tmpDir, 'empty.png');
  writeFileSync(emptyPath, '');
  await assert.rejects(
    () => addImageToGitHubMarkdownEditor({
      page: new MockPage({ editor, inputs: [rightInput] }),
      editorSelector: '#body',
      fileInputSelector: 'input[type=file]',
      filePath: emptyPath,
      timeoutMs: 50,
    }),
    /empty/,
  );

  const unsupportedEditor = buildEditor(scopedForm, placeholder);
  const unsupportedInput = buildInput(scopedForm, () => {
    scopedForm.errors = ["We don't support that file type."];
  });
  await assert.rejects(
    () => addImageToGitHubMarkdownEditor({
      page: new MockPage({ editor: unsupportedEditor, inputs: [unsupportedInput] }),
      editorSelector: '#body',
      fileInputSelector: 'input[type=file]',
      filePath: imagePath,
      insertAt: placeholder,
      timeoutMs: 50,
    }),
    /We don't support that file type/,
  );
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log('github markdown image upload helper checks passed');
