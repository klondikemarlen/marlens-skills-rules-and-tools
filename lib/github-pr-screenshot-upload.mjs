import { addImageToGitHubMarkdownEditor } from './github-markdown-image-upload-helper.mjs';

const DEFAULT_TIMEOUT_MS = 60_000;

export async function uploadPullRequestBodyScreenshots({
  page,
  prUrl,
  editorSelector,
  bodyControlsSelector,
  fileInputSelector,
  screenshots,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  validateArguments({ page, prUrl, editorSelector, bodyControlsSelector, fileInputSelector, screenshots });

  await page.goto(prUrl, { waitUntil: 'domcontentloaded' });
  await requireAuthenticatedGitHub(page);
  const editor = await openPrBodyEditor(page, editorSelector, bodyControlsSelector, timeoutMs);

  await requirePrBodyEditor(editor);

  const results = [];
  for (const screenshot of screenshots) {
    validateScreenshot(screenshot);
    results.push(await addImageToGitHubMarkdownEditor({
      page,
      editorSelector,
      fileInputSelector,
      filePath: screenshot.filePath,
      insertAt: screenshot.placeholder,
      timeoutMs,
    }));
  }

  await submitPrBodyForm(editor);
  await page.waitForSelector(editorSelector, { hidden: true, timeout: timeoutMs });
  await page.goto(prUrl, { waitUntil: 'networkidle0' });

  const persistedBody = await page.content();
  const missingUrls = results
    .map(({ attachmentUrl }) => attachmentUrl)
    .filter((attachmentUrl) => !persistedBody.includes(attachmentUrl));
  if (missingUrls.length > 0) {
    throw new Error(`Persisted PR body is missing attachment URLs: ${missingUrls.join(', ')}`);
  }

  return results;
}

function validateArguments({ page, prUrl, editorSelector, bodyControlsSelector, fileInputSelector, screenshots }) {
  if (!page || typeof page.goto !== 'function' || typeof page.$ !== 'function') {
    throw new Error('A Puppeteer-compatible page is required.');
  }
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/?$/u.test(prUrl || '')) {
    throw new Error('prUrl must be a GitHub pull request URL.');
  }
  if (!editorSelector) throw new Error('editorSelector is required.');
  if (!fileInputSelector) throw new Error('fileInputSelector is required.');
  if (!Array.isArray(screenshots) || screenshots.length === 0) {
    throw new Error('At least one screenshot is required.');
  }
}

async function openPrBodyEditor(page, editorSelector, bodyControlsSelector, timeoutMs) {
  const existingEditor = await page.$(editorSelector);
  if (existingEditor) return existingEditor;
  if (!bodyControlsSelector) {
    throw new Error('bodyControlsSelector is required when the PR body editor is closed.');
  }

  const optionsSelector = `${bodyControlsSelector} summary`;
  const menuSelector = `${bodyControlsSelector} details-menu`;
  const options = await page.$(optionsSelector);
  if (!options) throw new Error(`PR body options control not found: ${optionsSelector}.`);

  await options.click();
  const editSelector = `${menuSelector} button, ${menuSelector} [role="menuitem"], ${menuSelector} a`;
  await page.waitForSelector(editSelector, { visible: true, timeout: timeoutMs });
  const edit = await findControlByLabel(page, 'Edit', editSelector);
  if (!edit) throw new Error('PR body options menu has no visible Edit control.');

  await edit.click();
  return page.waitForSelector(editorSelector, { visible: true, timeout: timeoutMs });
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
    if (controlInfo.label === label && controlInfo.visible) return control;
  }

  return null;
}

async function requireAuthenticatedGitHub(page) {
  if (await page.$('a[href^="/login"]')) {
    throw new Error('GitHub browser session is not authenticated. Sign in before uploading screenshots.');
  }
}

async function requirePrBodyEditor(editor) {
  const error = await editor.evaluate((element) => {
    if (element.id === 'new_comment_field' || element.name === 'comment[body]') {
      return 'Temporary comment editors are not PR body editors.';
    }
    if (!element.closest?.('form')) return 'PR body editor is not inside a form.';
    return null;
  });
  if (error) throw new Error(error);
}

function validateScreenshot(screenshot) {
  if (!screenshot?.filePath) throw new Error('Each screenshot requires filePath.');
  if (!screenshot?.placeholder) throw new Error('Each screenshot requires placeholder.');
}

async function submitPrBodyForm(editor) {
  const error = await editor.evaluate((element) => {
    const form = element.closest?.('form');
    const submit = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')]
      .find((control) => !control.disabled);
    if (!submit) return 'PR body form has no enabled submit control.';
    submit.click();
    return null;
  });
  if (error) throw new Error(error);
}

export default uploadPullRequestBodyScreenshots;
