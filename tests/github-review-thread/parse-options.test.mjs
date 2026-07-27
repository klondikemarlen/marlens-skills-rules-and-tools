import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeOptionName } from '../../lib/github-review-thread/normalize-option-name.js';
import { normalizeRepository } from '../../lib/github-review-thread/normalize-repository.js';
import { parseOptions } from '../../lib/github-review-thread/parse-options.js';
import { parseReaction } from '../../lib/github-review-thread/parse-reaction.js';

await test('normalizes dashed option names', () => {
  assert.equal(normalizeOptionName('dry-run'), 'dryRun');
});

await test('parses boolean and value options', () => {
  assert.deepEqual(parseOptions(['--dry-run=false', '--repo', 'OWNER/Repo', '--comment-id=42']), {
    dryRun: false,
    repo: 'OWNER/Repo',
    commentId: '42',
  });
});

await test('normalizes repository names', () => {
  assert.equal(normalizeRepository('OWNER/Repo-ONE'), 'owner/repo-one');
});

await test('rejects a missing resolve reaction', () => {
  assert.throws(() => parseReaction({}), /requires --reaction \+1 or --reaction -1/u);
});

await test('accepts a rejected-feedback reaction', () => {
  assert.equal(parseReaction({ reaction: '-1' }), '-1');
});
