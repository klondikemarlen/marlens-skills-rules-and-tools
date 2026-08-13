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
const exemptionProject = createProject();
const suppressionProject = createProject();
const invalidSuppressionProject = createProject();
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
  test('saves widget', () => {
    expect(save.mock.calls).toEqual([]);
    expect(true).toEqual(true);
  });

  it.only('returns its state', function () {
    expect(state).toEqual('ready');
    expect(result).toEqual(state);
    expect(complete).toBe(true);
  });

  it('waits for completion', done => {
    expect(complete).toBe(true);
    expect(done).toBeDefined();
  });

  it.each([[true]])('reports parameterized cases', () => {
    expect(complete).toBe(true);
    expect(result).toEqual('ready');
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
  assert.match(misaligned.evidence, /test "saves widget" contains 2 direct `expect\(\.\.\.\)` calls/);
  assert.match(misaligned.evidence, /test "returns its state" contains 3 direct `expect\(\.\.\.\)` calls/);
  assert.match(misaligned.evidence, /test "waits for completion" contains 2 direct `expect\(\.\.\.\)` calls/);
  assert.match(misaligned.evidence, /test "reports parameterized cases" contains 2 direct `expect\(\.\.\.\)` calls/);
  assert.match(misaligned.evidence, /marlens-test-alignment: no-mock-calls/);
  assert.match(misaligned.evidence, /marlens-test-alignment: describe-file-class-method/);
  assert.match(misaligned.nextCheck, /Rename the test/);
  assert.throws(
    () => execFileSync(process.execPath, [path.join(root, 'verifications/test-alignment.mjs')], {
      cwd: project,
      encoding: 'utf8',
      env: { ...process.env, MARLENS_TEST_ALIGNMENT_BASE: 'main' },
    }),
    (error) => error.status === 1,
  );

  write(noGuidanceProject, 'tests/widget.test.ts', alignedTest);
  commit(noGuidanceProject, 'baseline');
  git(noGuidanceProject, ['switch', '--quiet', '-c', 'feature']);
  write(noGuidanceProject, 'tests/widget.test.ts', `it('saves widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`);
  commit(noGuidanceProject, 'test without guidance');

  const baseline = runVerification(noGuidanceProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(baseline.status, 'FAIL');
  assert.match(baseline.evidence, /shared baseline:1/);
  assert.match(baseline.evidence, /marlens-test-alignment: test-name-when/);
  assert.match(baseline.evidence, /marlens-test-alignment: arrange-act-assert/);
  assert.match(baseline.evidence, /marlens-test-alignment: one-direct-expect/);

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

  write(exemptionProject, 'README.md', '<!-- marlens-test-alignment: one-direct-expect -->\n');
  commit(exemptionProject, 'baseline');
  git(exemptionProject, ['switch', '--quiet', '-c', 'feature']);
  write(exemptionProject, 'tests/controller.test.ts', `describe('controller', () => {
  it('when recording a request, keeps the diagnostic local', () => {
    // Arrange
    const diagnostic = 'expect(';

    // Act
    recordRequest();

    // Assert
    void diagnostic;
  });

  test('when the response succeeds, returns the response', () => {
    // Arrange
    const response = fetchResponse();

    // Act
    recordResponse(response);

    // Assert
    // marlens-test-alignment: allow-multiple-expects -- status and body are independent observable contracts.
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ saved: true });
  });
});
`);

  const exempt = runVerification(exemptionProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(exempt.status, 'PASS');
  assert.match(exempt.evidence, /tests\/controller\.test\.ts/);

  write(suppressionProject, '.marlens-verifications.json', JSON.stringify({
    suppressions: [{
      id: 'marlens-rules:test-alignment',
      path: 'tests/legacy',
      reason: 'Legacy tests are being migrated separately.',
      expiresOn: '2099-01-01',
    }],
  }));
  write(suppressionProject, 'tests/legacy/widget.test.ts', alignedTest);
  write(suppressionProject, 'tests/current/widget.test.ts', alignedTest);
  commit(suppressionProject, 'baseline');
  git(suppressionProject, ['switch', '--quiet', '-c', 'feature']);
  write(suppressionProject, 'tests/legacy/widget.test.ts', `it('legacy widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`);
  write(suppressionProject, 'tests/current/widget.test.ts', `it('current widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`);
  commit(suppressionProject, 'scoped suppression');

  const suppression = runVerification(suppressionProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(suppression.status, 'FAIL');
  assert.match(suppression.evidence, /shared baseline:1/);
  assert.match(suppression.evidence, /Suppressed marlens-rules:test-alignment for tests\/legacy\/widget\.test\.ts/);

  write(invalidSuppressionProject, 'tests/widget.test.ts', alignedTest);
  commit(invalidSuppressionProject, 'baseline');
  git(invalidSuppressionProject, ['switch', '--quiet', '-c', 'feature']);
  write(invalidSuppressionProject, '.marlens-verifications.json', JSON.stringify({
    suppressions: [{ id: 'marlens-rules:test-alignment', path: 'tests' }],
  }));
  write(invalidSuppressionProject, 'tests/widget.test.ts', `${alignedTest}\n// Changed on this branch.\n`);

  const invalidSuppression = runVerification(invalidSuppressionProject, { MARLENS_TEST_ALIGNMENT_BASE: 'main' });
  assert.equal(invalidSuppression.status, 'BLOCKED');
  assert.match(invalidSuppression.evidence, /reason must be a non-empty string/);

  console.log('Test alignment verification checks passed');
} finally {
  rmSync(project, { recursive: true, force: true });
  rmSync(noGuidanceProject, { recursive: true, force: true });
  rmSync(nonTestProject, { recursive: true, force: true });
  rmSync(untrackedTestProject, { recursive: true, force: true });
  rmSync(exemptionProject, { recursive: true, force: true });
  rmSync(suppressionProject, { recursive: true, force: true });
  rmSync(invalidSuppressionProject, { recursive: true, force: true });
}
