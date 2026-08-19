import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bin = path.join(root, 'bin/github-review-thread');
const repository = 'klondikemarlen/marlens-skills-rules-and-tools';

await test('rejects an external repository before any dry-run plan', () => {
  const result = spawnSync(
    process.execPath,
    [bin, 'resolve', '--repo', 'evil/repo', '--pr', '456', '--comment-id', '123', '--reaction', '+1', '--dry-run'],
    { cwd: root, encoding: 'utf8' },
  );

  assert.deepEqual(
    { status: result.status, error: result.stderr.trim() },
    {
      status: 1,
      error:
        'github-review-thread: Refusing external target: evil/repo != checkout repository klondikemarlen/marlens-skills-rules-and-tools',
    },
  );
});

await test('requires the reaction gate in resolve dry runs', () => {
  const result = spawnSync(
    process.execPath,
    [bin, 'resolve', '--repo', repository, '--pr', '456', '--comment-id', '123', '--dry-run'],
    { cwd: root, encoding: 'utf8' },
  );

  assert.deepEqual(
    { status: result.status, error: result.stderr.trim() },
    {
      status: 1,
      error: 'github-review-thread: resolve requires --reaction +1 or --reaction -1.',
    },
  );
});

await test('previews accepted feedback with the final verification operations', () => {
  const result = spawnSync(
    process.execPath,
    [bin, 'resolve', '--repo', repository, '--pr', '456', '--comment-id', '123', '--reaction', '+1', '--dry-run'],
    { cwd: root, encoding: 'utf8' },
  );
  const output = JSON.parse(result.stdout);

  assert.deepEqual(
    {
      status: result.status,
      reaction: output.reaction,
      operationCount: output.plan.length,
      finalQuery: output.plan.at(-1).query,
    },
    {
      status: 0,
      reaction: '+1',
      operationCount: 8,
      finalQuery: 'CheckReviewThreadResolved',
    },
  );
});

await test('previews rejected feedback with the matching reaction', () => {
  const result = spawnSync(
    process.execPath,
    [bin, 'resolve', '--repo', repository, '--pr', '456', '--comment-id', '123', '--reaction', '-1', '--dry-run'],
    { cwd: root, encoding: 'utf8' },
  );
  const output = JSON.parse(result.stdout);

  assert.equal(output.plan[3].body.content, '-1');
});
