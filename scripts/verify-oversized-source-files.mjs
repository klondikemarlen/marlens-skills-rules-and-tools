import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runStagedVerification, runVerification } from '../verifications/no-oversized-source-files.mjs';

function createGitProject() {
  const projectDirectory = mkdtempSync(path.join(os.tmpdir(), 'marlens-source-size-'));
  execFileSync('git', ['init', '--quiet'], { cwd: projectDirectory });
  return projectDirectory;
}

const projectDirectory = createGitProject();
const nonGitProject = mkdtempSync(path.join(os.tmpdir(), 'marlens-source-size-'));
try {
  mkdirSync(path.join(projectDirectory, 'src'));
  mkdirSync(path.join(projectDirectory, 'vendor'));
  mkdirSync(path.join(projectDirectory, 'generated'));
  writeFileSync(path.join(projectDirectory, 'src/ok.js'), 'export const ok = true;\n');
  writeFileSync(path.join(projectDirectory, 'src/large.js'), 'line\n'.repeat(1201));
  writeFileSync(path.join(projectDirectory, 'vendor/large.js'), 'line\n'.repeat(2000));
  writeFileSync(path.join(projectDirectory, 'generated/large.js'), 'line\n'.repeat(2000));
  writeFileSync(path.join(projectDirectory, 'package-lock.json'), 'line\n'.repeat(2000));
  writeFileSync(path.join(projectDirectory, 'binary.js'), Buffer.from([0, 1, 2]));
  execFileSync('git', ['add', '.'], { cwd: projectDirectory });

  const failed = runVerification(projectDirectory, {});
  assert.equal(failed.status, 'FAIL');
  assert.match(failed.evidence, /src\/large\.js \(1201 lines\)/);
  assert.doesNotMatch(failed.evidence, /vendor|generated|package-lock/);

  symlinkSync('src/ok.js', path.join(projectDirectory, 'broken.js'));
  execFileSync('git', ['add', 'broken.js'], { cwd: projectDirectory });

  const allowlisted = runVerification(projectDirectory, {
    MARLENS_SOURCE_SIZE_ALLOWLIST: 'src/large.js',
  });
  assert.equal(allowlisted.status, 'BLOCKED');
  assert.match(allowlisted.evidence, /broken\.js/);

  rmSync(path.join(projectDirectory, 'broken.js'));
  execFileSync('git', ['add', '-u'], { cwd: projectDirectory });

  const configured = runVerification(projectDirectory, {
    MARLENS_MAX_SOURCE_LINES: '1000',
    MARLENS_SOURCE_SIZE_ALLOWLIST: 'src/large.js',
  });
  assert.equal(configured.status, 'PASS');
  assert.match(configured.evidence, /Explicitly allowlisted: src\/large\.js/);
  assert.match(configured.evidence, /Inspected 3 tracked source file/);

  execFileSync('git', ['reset', '--quiet'], { cwd: projectDirectory });
  execFileSync('git', ['add', 'src/ok.js'], { cwd: projectDirectory });
  assert.equal(runStagedVerification(projectDirectory, {}).status, 'PASS');

  execFileSync('git', ['add', 'src/large.js'], { cwd: projectDirectory });
  writeFileSync(path.join(projectDirectory, 'src/large.js'), 'export const nowSmall = true;\n');
  const staged = runStagedVerification(projectDirectory, {});
  assert.equal(staged.status, 'FAIL');
  assert.match(staged.evidence, /src\/large\.js \(1201 lines\)/);

  assert.equal(runStagedVerification(nonGitProject, {}).status, 'BLOCKED');
  assert.equal(runVerification(nonGitProject, {}).status, 'BLOCKED');
  assert.equal(runVerification(projectDirectory, { MARLENS_MAX_SOURCE_LINES: '0' }).status, 'BLOCKED');

  console.log('Oversized source-file verification checks passed');
} finally {
  rmSync(projectDirectory, { recursive: true, force: true });
  rmSync(nonGitProject, { recursive: true, force: true });
}
