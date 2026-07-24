import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verificationModule = path.join(root, 'verifications/no-envrc-example.mjs');


function createGitProject() {
  const projectDirectory = mkdtempSync(path.join(os.tmpdir(), 'marlens-verification-'));
  execFileSync('git', ['init', '--quiet'], { cwd: projectDirectory });
  return projectDirectory;
}

const gitProject = createGitProject();
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), 'marlens-verification-'));
try {
  function runEntry(projectDirectory) {
    const output = execFileSync(process.execPath, [verificationModule], {
      cwd: projectDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    assert.equal(output.split('\n').length, 1);
    const parsed = JSON.parse(output);
    assert.deepEqual(Object.keys(parsed).sort(), ['evidence', 'nextCheck', 'status', 'summary']);
    return parsed;
  }

  assert.equal(runEntry(gitProject).status, 'PASS');

  writeFileSync(path.join(gitProject, '.envrc.example'), 'export TOKEN=local-only\n');
  assert.equal(runEntry(gitProject).status, 'PASS');

  execFileSync('git', ['add', '.envrc.example'], { cwd: gitProject });
  mkdirSync(path.join(gitProject, 'nested'));
  assert.equal(runEntry(path.join(gitProject, 'nested')).status, 'FAIL');
  assert.equal(runEntry(gitProject).status, 'FAIL');

  execFileSync('git', ['rm', '--cached', '--quiet', '.envrc.example'], { cwd: gitProject });
  assert.equal(runEntry(path.join(gitProject, 'nested')).status, 'PASS');
  assert.equal(runEntry(gitProject).status, 'PASS');
  assert.equal(runEntry(nonGitProject).status, 'BLOCKED');

  console.log('Verification manifest checks passed');

} finally {
  rmSync(gitProject, { recursive: true, force: true });
  rmSync(nonGitProject, { recursive: true, force: true });
}
