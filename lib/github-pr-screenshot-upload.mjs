import { addImageToGitHubMarkdownEditor } from './github-markdown-image-upload-helper.mjs';

const DEFAULT_TIMEOUT_MS = 60_000;

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
    page, prUrl, targetSelector, editorSelector, fileInputSelector, screenshots,
  });

  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await requireAuthenticatedGitHub(page);
  const editor = await openPullRequestCommentEditor(page, resolvedTargetSelector, editorSelector, timeoutMs);
  await requireTargetedEditor(editor, resolvedTargetSelector);

  const results = [];
  for (const screenshot of screenshots) {
    validateScreenshot(screenshot);
    results.push(await addImageToGitHubMarkdownEditor({
      page,
      editorSelector: `${resolvedTargetSelector} ${editorSelector}`,
      fileInputSelector: `${resolvedTargetSelector} ${fileInputSelector}`,
      filePath: screenshot.filePath,
      insertAt: screenshot.placeholder,
      timeoutMs,
    }));
  }

  await submitCommentForm(editor);
  const scopedEditorSelector = `${resolvedTargetSelector} ${editorSelector}`;
  await page.waitForSelector(scopedEditorSelector, { hidden: true, timeout: timeoutMs });
  await page.goto(pageUrl, { waitUntil: 'networkidle0' });

  const persistedTarget = await page.$(resolvedTargetSelector);
  const persistedMarkup = await persistedTarget?.evaluate((element) => element.innerHTML);
  const missingUrls = results
    .map(({ attachmentUrl }) => attachmentUrl)
    .filter((attachmentUrl) => !persistedMarkup?.includes(attachmentUrl));
  if (missingUrls.length > 0) {
    throw new Error(`Persisted target is missing attachment URLs: ${missingUrls.join(', ')}`);
  }

  return results;
}

function validateArguments({ page, prUrl, targetSelector, editorSelector, fileInputSelector, screenshots }) {
  if (!page || typeof page.goto !== 'function' || typeof page.$ !== 'function') {
    throw new Error('A Puppeteer-compatible page is required.');
  }

  let url;
  try {
    url = new URL(prUrl);
  } catch {
    throw new Error('prUrl must be a GitHub pull request URL.');
  }
  if (url.origin !== 'https://github.com' || !/^\/[^/]+\/[^/]+\/pull\/\d+\/?$/u.test(url.pathname)) {
    throw new Error('prUrl must be a GitHub pull request URL.');
  }

  const resolvedTargetSelector = targetSelector || url.hash;
  if (!/^#(?:issue|issuecomment)-\d+$/u.test(resolvedTargetSelector || '')) {
    throw new Error('Target must be an #issue-… or #issuecomment-… URL fragment or selector.');
  }
  url.hash = '';

  if (!editorSelector) throw new Error('editorSelector is required.');
  if (!fileInputSelector) throw new Error('fileInputSelector is required.');
  if (!Array.isArray(screenshots) || screenshots.length === 0) {
    throw new Error('At least one screenshot is required.');
  }

  return { pageUrl: url.href, resolvedTargetSelector };
}

async function openPullRequestCommentEditor(page, targetSelector, editorSelector, timeoutMs) {
  const scopedEditorSelector = `${targetSelector} ${editorSelector}`;
  const existingEditor = await page.$(scopedEditorSelector);
  if (existingEditor) return existingEditor;

  const optionsSelector = `${targetSelector} details summary`;
  const menuSelector = `${targetSelector} details-menu`;
  const options = await page.$(optionsSelector);
  if (!options) throw new Error(`Comment options control not found: ${optionsSelector}.`);

  await options.click();
  const editSelector = `${menuSelector} button, ${menuSelector} [role="menuitem"], ${menuSelector} a`;
  await page.waitForSelector(editSelector, { visible: true, timeout: timeoutMs });
  const edit = await findControlByLabel(page, 'Edit', editSelector);
  if (!edit) throw new Error('Comment options menu has no visible Edit control.');

  await edit.click();
  return page.waitForSelector(scopedEditorSelector, { visible: true, timeout: timeoutMs });
}

async function findControlByLabel(page, label, selector) {
  for (const control of await page.$$(selector)) {
    const controlInfo = await control.evaluate((element) => {
      const style = globalThis.getComputedStyle?.(element);
      return {
        label: element.getAttribute('aria-label') || element.textContent?.trim(),
        visible: !element.hidden
          && element.getAttribute('aria-hidden') !== 'true'
          && style?.display !== 'none'
          && style?.visibility !== 'hidden',
      };
    });
    if (controlInfo.visible && (controlInfo.label === label || controlInfo.label === `${label} comment`)) return control;
  }

  return null;
}

async function requireAuthenticatedGitHub(page) {
  if (await page.$('a[href^="/login"]')) {
    throw new Error('GitHub browser session is not authenticated. Sign in before uploading screenshots.');
  }
}

async function requireTargetedEditor(editor, targetSelector) {
  const error = await editor.evaluate((element, selector) => {
    if (!element.closest?.(selector)) return `Editor is outside target: ${selector}.`;
    if (!element.closest?.('form')) return 'Target editor is not inside a form.';
    return null;
  }, targetSelector);
  if (error) throw new Error(error);
}

function validateScreenshot(screenshot) {
  if (!screenshot?.filePath) throw new Error('Each screenshot requires filePath.');
  if (!screenshot?.placeholder) throw new Error('Each screenshot requires placeholder.');
}

async function submitCommentForm(editor) {
  const error = await editor.evaluate((element) => {
    const form = element.closest?.('form');
    const submit = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')]
      .find((control) => !control.disabled);
    if (!submit) return 'Target comment form has no enabled submit control.';
    submit.click();
    return null;
  });
  if (error) throw new Error(error);
}

export default uploadPullRequestCommentScreenshots;
