import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVerification } from '../verifications/test-alignment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(directory, argumentsList) {
  return execFileSync('git', argumentsList, { cwd: directory, stdio: 'ignore' });
}

function write(directory, relativePath, contents) {
  const filePath = path.join(directory, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function createProject() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'marlens-test-alignment-'));
  git(directory, ['init', '--quiet']);
  git(directory, ['config', 'user.email', 'test@example.com']);
  git(directory, ['config', 'user.name', 'Test User']);
  git(directory, ['branch', '-M', 'main']);
  return directory;
}

function commit(directory, message) {
  git(directory, ['add', '.']);
  git(directory, ['commit', '--quiet', '-m', message]);
}

const guidance = `<!-- marlens-test-alignment: test-name-when -->
<!-- marlens-test-alignment: arrange-act-assert -->
<!-- marlens-test-alignment: one-direct-expect -->
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
`;

const alignedTest = `describe('widget.test.ts', () => {
  describe('Widget', () => {
    describe('save', () => {
      it('when the widget is valid, saves the widget', () => {
        // Arrange
        const widget = createWidget();

        // Act
        const saved = save(widget);

        // Assert
        expect(saved).toEqual(widget);
      });
    });
  });
});
`;

const project = createProject();
const noGuidanceProject = createProject();
const nonTestProject = createProject();
const untrackedTestProject = createProject();
try {
  write(project, 'tests/README.md', guidance);
  write(project, 'tests/widget.test.ts', alignedTest);
  commit(project, 'baseline');
  git(project, ['switch', '--quiet', '-c', 'feature']);
  write(project, 'tests/widget.test.ts', `${alignedTest}\n// Changed on this branch.\n`);
  commit(project, 'aligned test change');

  const aligned = runVerification(project, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(aligned.status, 'PASS');
  assert.match(aligned.evidence, /tests\/widget\.test\.ts/);

  write(project, 'tests/widget.test.ts', `describe('widget.test.ts', () => {
  it('saves widget', () => {
    expect(save.mock.calls).toEqual([]);
    expect(true).toEqual(true);
  });
});
`);
  commit(project, 'misaligned test change');

  const misaligned = runVerification(project, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(misaligned.status, 'FAIL');
  assert.match(misaligned.evidence, /tests\/widget\.test\.ts:2/);
  assert.match(misaligned.evidence, /marlens-test-alignment: test-name-when/);
  assert.match(misaligned.evidence, /marlens-test-alignment: arrange-act-assert/);
  assert.match(misaligned.evidence, /marlens-test-alignment: one-direct-expect/);
  assert.match(misaligned.evidence, /marlens-test-alignment: no-mock-calls/);
  assert.match(misaligned.evidence, /marlens-test-alignment: describe-file-class-method/);
  assert.match(misaligned.nextCheck, /Rename the test/);

  write(noGuidanceProject, 'tests/widget.test.ts', alignedTest);
  commit(noGuidanceProject, 'baseline');
  git(noGuidanceProject, ['switch', '--quiet', '-c', 'feature']);
  write(noGuidanceProject, 'tests/widget.test.ts', `${alignedTest}\n// Changed on this branch.\n`);
  commit(noGuidanceProject, 'test without guidance');

  const unconfigured = runVerification(noGuidanceProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(unconfigured.status, 'NOT_CONFIGURED');
  assert.match(unconfigured.evidence, /tests\/widget\.test\.ts/);

  write(nonTestProject, 'src/widget.ts', 'export const widget = 1;\n');
  commit(nonTestProject, 'baseline');
  git(nonTestProject, ['switch', '--quiet', '-c', 'feature']);
  write(nonTestProject, 'src/widget.ts', 'export const widget = 2;\n');
  commit(nonTestProject, 'non-test change');

  const noTests = runVerification(nonTestProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(noTests.status, 'PASS');
  assert.match(noTests.summary, /No changed test files/);

  write(untrackedTestProject, 'README.md', guidance);
  commit(untrackedTestProject, 'baseline');
  git(untrackedTestProject, ['switch', '--quiet', '-c', 'feature']);
  write(untrackedTestProject, 'tests/untracked.test.ts', `it('saves widget', () => {
  expect(save.mock.calls).toEqual([]);
  expect(true).toEqual(true);
});
`);

  const untracked = runVerification(untrackedTestProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(untracked.status, 'FAIL');
  assert.match(untracked.evidence, /tests\/untracked\.test\.ts:1/);

  console.log('Test alignment verification checks passed');
} finally {
  rmSync(project, { recursive: true, force: true });
  rmSync(noGuidanceProject, { recursive: true, force: true });
  rmSync(nonTestProject, { recursive: true, force: true });
  rmSync(untrackedTestProject, { recursive: true, force: true });
}
