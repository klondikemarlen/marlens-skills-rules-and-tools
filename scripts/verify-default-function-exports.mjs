import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runVerification } from '../verifications/default-function-exports.mjs';

function write(projectDirectory, relativePath, contents) {
  const filePath = path.join(projectDirectory, relativePath);
  const directory = path.dirname(filePath);
  mkdirSync(directory, { recursive: true });
  writeFileSync(filePath, contents);
}

const projectDirectory = mkdtempSync(path.join(os.tmpdir(), 'marlens-default-function-exports-'));
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), 'marlens-default-function-exports-'));
try {
  execFileSync('git', ['init', '--quiet'], { cwd: projectDirectory });
  const notConfigured = runVerification(projectDirectory);
  assert.equal(notConfigured.status, 'PASS');
  assert.match(notConfigured.summary, /No default-function export convention/u);

  write(projectDirectory, '.marlens-verifications.json', JSON.stringify({
    defaultFunctionExports: { paths: ['src/**/*.ts'] },
  }));
  write(projectDirectory, 'src/request.ts', 'export default function isRequestDatabaseCancellationError() {\n  return false;\n}\n');
  write(projectDirectory, 'src/anonymous.ts', 'export default function () {\n  return false;\n}\n');
  write(projectDirectory, 'src/value.ts', 'export default class RequestError {}\n');
  write(projectDirectory, 'other/ignored.ts', 'export default function ignoredOutsideConfiguredPath() {}\n');

  const failing = runVerification(projectDirectory);
  assert.equal(failing.status, 'FAIL');
  assert.match(failing.evidence, /src\/request\.ts:1 exports default function isRequestDatabaseCancellationError/u);
  assert.match(failing.evidence, /export function isRequestDatabaseCancellationError/u);
  assert.doesNotMatch(failing.evidence, /anonymous|RequestError|ignoredOutsideConfiguredPath/u);

  write(projectDirectory, 'src/request.ts', 'export function isRequestDatabaseCancellationError() {\n  return false;\n}\n\nexport default isRequestDatabaseCancellationError\n');
  const passing = runVerification(projectDirectory);
  assert.equal(passing.status, 'PASS');
  assert.match(passing.evidence, /Inspected 3 configured TypeScript module/u);

  write(projectDirectory, '.marlens-verifications.json', JSON.stringify({
    defaultFunctionExports: { paths: ['../outside/**/*.ts'] },
  }));
  const invalid = runVerification(projectDirectory);
  assert.equal(invalid.status, 'BLOCKED');
  assert.match(invalid.evidence, /must stay inside the project/u);

  write(projectDirectory, '.marlens-verifications.json', JSON.stringify({
    defaultFunctionExports: { paths: [] },
  }));
  const emptyConfiguration = runVerification(projectDirectory);
  assert.equal(emptyConfiguration.status, 'BLOCKED');
  assert.match(emptyConfiguration.evidence, /non-empty paths array/u);

  assert.equal(runVerification(nonGitProject).status, 'BLOCKED');

  console.log('Default function export verification checks passed');
} finally {
  rmSync(projectDirectory, { recursive: true, force: true });
  rmSync(nonGitProject, { recursive: true, force: true });
}
