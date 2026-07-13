import { accessSync, constants, statSync } from 'node:fs';

const DEFAULT_FILE_INPUT_SELECTOR = 'input[type="file"]';
const DEFAULT_TIMEOUT_MS = 60_000;
const ATTACHMENT_PATTERN = /(?:<img\b[^>]*?src=["'](?<htmlUrl>https:\/\/github\.com\/user-attachments\/assets\/[^"']+)["'][^>]*>|!\[[^\]]*\]\((?<markdownUrl>https:\/\/github\.com\/user-attachments\/assets\/[^)]+)\))/i;

export async function addImageToGitHubMarkdownEditor({
  page,
  editorSelector,
  fileInputSelector = DEFAULT_FILE_INPUT_SELECTOR,
  filePath,
  insertAt,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  validateArguments({ page, editorSelector, fileInputSelector, filePath });
  validateReadableNonEmptyFile(filePath);

  const editor = await page.$(editorSelector);
  if (!editor) throw new Error(`GitHub Markdown editor not found: ${editorSelector}`);

  const before = await prepareEditor(editor, insertAt);
  const input = await findScopedFileInput(page, editor, fileInputSelector);
  if (!input) {
    throw new Error(`No file input matching ${fileInputSelector} was scoped to editor ${editorSelector}.`);
  }

  const baselineErrorText = await gitHubUploadErrorText(page, editor);

  await input.uploadFile(filePath);

  const markdown = await waitForAttachmentMarkdown({ page, editor, before, baselineErrorText, timeoutMs });
  const attachmentUrl = extractAttachmentUrl(markdown);
  if (!attachmentUrl) throw new Error(`GitHub upload changed the editor but no user-attachments/assets URL was found.`);

  return { markdown, attachmentUrl };
}

function validateArguments({ page, editorSelector, fileInputSelector, filePath }) {
  if (!page || typeof page.$ !== 'function' || typeof page.$$ !== 'function') {
    throw new Error('A Puppeteer-compatible page is required.');
  }
  if (!editorSelector) throw new Error('editorSelector is required.');
  if (!fileInputSelector) throw new Error('fileInputSelector is required.');
  if (!filePath) throw new Error('filePath is required.');
}

function validateReadableNonEmptyFile(filePath) {
  accessSync(filePath, constants.R_OK);

  const stat = statSync(filePath);
  if (!stat.isFile()) throw new Error(`Upload path is not a file: ${filePath}`);
  if (stat.size === 0) throw new Error(`Upload file is empty: ${filePath}`);
}

async function prepareEditor(editor, insertAt) {
  const result = await editor.evaluate((element, placeholder) => {
    const value = typeof element.value === 'string' ? element.value : element.textContent || '';

    if (element.disabled || element.readOnly) {
      return { error: 'Target GitHub Markdown editor is disabled or read-only.' };
    }

    let start = value.length;
    let end = value.length;
    if (placeholder) {
      start = value.indexOf(placeholder);
      if (start === -1) return { error: `Insert placeholder not found in target editor: ${placeholder}` };
      end = start + placeholder.length;
    }

    element.focus?.();
    if (typeof element.setSelectionRange === 'function') element.setSelectionRange(start, end);

    return { value };
  }, insertAt || '');

  if (result?.error) throw new Error(result.error);
  return result.value;
}

async function findScopedFileInput(page, editor, fileInputSelector) {
  const inputs = await page.$$(fileInputSelector);
  for (const input of inputs) {
    const isScoped = await page.evaluate((editorElement, inputElement) => {
      if (!inputElement || inputElement.type !== 'file') return false;

      const form = editorElement.closest?.('form');
      if (form) return form.contains(inputElement);

      const container = editorElement.closest?.('.js-previewable-comment-form, .js-comment-container, .js-discussion, [data-target*="markdown"]') || editorElement.parentElement;
      return Boolean(container?.contains(inputElement));
    }, editor, input);

    if (isScoped) return input;
  }

  return null;
}

async function waitForAttachmentMarkdown({ page, editor, before, baselineErrorText, timeoutMs }) {
  const existingMarkdown = new Set(attachmentMarkdownMatches(before));
  const deadline = Date.now() + timeoutMs;
  let latest = before;

  while (Date.now() < deadline) {
    latest = await editor.evaluate((element) => (typeof element.value === 'string' ? element.value : element.textContent || ''));
    const markdown = attachmentMarkdownMatches(latest).find((match) => !existingMarkdown.has(match));
    if (markdown) return markdown;

    const errorText = newUploadErrorText(await gitHubUploadErrorText(page, editor), baselineErrorText);
    if (errorText) throw new Error(`GitHub image upload failed: ${errorText}`);

    await sleep(250);
  }

  const errorText = newUploadErrorText(await gitHubUploadErrorText(page, editor), baselineErrorText);
  if (errorText) throw new Error(`GitHub image upload failed: ${errorText}`);
  if (latest === before) throw new Error('GitHub image upload timed out and the target editor value did not change.');

  throw new Error('GitHub image upload changed the editor but did not insert user-attachments/assets Markdown.');
}

async function gitHubUploadErrorText(page, editor) {
  return page.evaluate((editorElement) => {
    const root = editorElement.closest?.('form') || document;
    const selectors = [
      '[role="alert"]',
      '.flash-error',
      '.upload-state.error',
      '.js-upload-markdown-image .error',
      '.js-upload-progress .error',
    ];

    return [...root.querySelectorAll(selectors.join(','))]
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
      .join('\n');
  }, editor);
}

function newUploadErrorText(current, baseline) {
  const baselineLines = new Set(errorLines(baseline));
  return errorLines(current).filter((line) => !baselineLines.has(line)).join('\n');
}

function errorLines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function attachmentMarkdownMatches(value) {
  return [...String(value || '').matchAll(new RegExp(ATTACHMENT_PATTERN.source, 'gi'))].map((match) => match[0]);
}

function extractAttachmentUrl(markdown) {
  const match = markdown.match(ATTACHMENT_PATTERN);
  return match?.groups?.htmlUrl || match?.groups?.markdownUrl || null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default addImageToGitHubMarkdownEditor;
