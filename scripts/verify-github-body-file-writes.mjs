import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanRoots = ['README.md', 'AGENTS.md', 'AGENT_RULES.md', 'bin', 'docs', 'skills', 'scripts'];
const unsafeInlineBody = /(?:^|\s)(?:github-review-thread\s+reply|gh\s+(?:issue|pr)\s+(?:create|edit|comment))[^\n]*--body(?:[=\s])/u;
const files = [];
for (const relativePath of scanRoots) {
  await collectFiles(path.join(root, relativePath), files);
}
const violations = [];
const multilineUnsafeCommand = ['gh issue comment 1 \\', `  --${'body'} "unsafe"`].join('\n');
assert.equal(unsafeInlineBody.test(multilineUnsafeCommand.replace(/\\\r?\n/gu, ' ')), true);
assert.equal(unsafeInlineBody.test('gh issue comment 1 --body-file /tmp/body.md'), false);

for (const file of files) {
  const text = await readFile(file, 'utf8');
  const normalized = text.replace(/\\\r?\n/gu, ' ');
  if (unsafeInlineBody.test(normalized)) violations.push(path.relative(root, file));
}

assert.deepEqual(violations, [], `unsafe inline GitHub body writes found:\n${violations.join('\n')}`);
console.log(`github body-file write check passed (${files.length} files scanned)`);

async function collectFiles(target, result) {
  let stats;
  try {
    stats = await readdir(target, { withFileTypes: true });
  } catch {
    result.push(target);
    return;
  }

  for (const entry of stats) {
    const entryPath = path.join(target, entry.name);
    if (entry.isDirectory()) await collectFiles(entryPath, result);
    else result.push(entryPath);
  }
}
