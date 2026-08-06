import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = path.join(root, 'bin', 'agent-guidance-audit.js');
const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'agent-guidance-audit-verify-'));

function createRepository(name) {
  const repository = path.join(fixtureRoot, name);
  mkdirSync(repository, { recursive: true });
  return repository;
}

function write(repository, relativePath, contents) {
  const filePath = path.join(repository, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function runAudit(...args) {
  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8' });
}

function expectExit(result, expectedStatus, scenario) {
  assert.equal(
    result.status,
    expectedStatus,
    `${scenario} exited ${result.status}: ${result.stdout}${result.stderr}`,
  );
}

function failingFindings(scenario, ...args) {
  const result = runAudit(...args);
  expectExit(result, 1, scenario);
  return JSON.parse(result.stdout);
}

function testBrokenPaths() {
  const repository = createRepository('broken-paths');
  write(repository, 'docs/references/ok.md', '# OK\n');
  write(repository, 'docs/workflows/ok.md', '# OK\n');
  write(repository, 'docs/workflows/sibling.md', '# Sibling\n');
  write(repository, 'docs/workflows/nested.md', '[sibling](sibling.md) [missing sibling](missing-sibling.md)\n');
  write(repository, 'README.md', '[valid](docs/references/ok.md) [missing](./missing.md) `docs/workflows/nope.md`\n');

  const report = runAudit(repository);
  expectExit(report, 1, 'broken paths');
  assert.match(report.stdout, /markdown-link missing target \.\/missing\.md/);
  assert.match(report.stdout, /markdown-link missing target missing-sibling\.md/);
  assert.match(report.stdout, /backtick-path missing target docs\/workflows\/nope\.md/);
  assert.doesNotMatch(report.stdout, /docs\/references\/ok\.md/);
  assert.doesNotMatch(report.stdout, /sibling\.md:/);

  const findings = failingFindings('broken paths JSON report', '--json', repository);
  assert.equal(findings.length, 3);
}

function testLearnerCommands() {
  const repository = createRepository('learner-commands');
  write(repository, 'README.md', '/learner setup https://github.com/owner/repo\n/learner status\n');

  const findings = failingFindings('learner commands', '--json', repository);
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /learner moved out of this package/);
}

function testSuppressions() {
  const repository = createRepository('suppressions');
  write(
    repository,
    'README.md',
    [
      '[suppressed](./suppressed.md) <!-- agent-guidance-audit: ignore markdown-link ./suppressed.md -->',
      '[adjacent](./adjacent.md)',
      '`docs/workflows/nope.md` <!-- agent-guidance-audit: ignore markdown-link docs/workflows/nope.md -->',
      '[malformed](./malformed.md) <!-- agent-guidance-audit: ignore -->',
      '[valid](docs/workflows/ok.md) <!-- agent-guidance-audit: ignore markdown-link ./unused.md -->',
      '[unknown](docs/workflows/ok.md) <!-- agent-guidance-audit: ignore workflow-inventory -->',
      '',
    ].join('\n'),
  );
  write(repository, 'docs/workflows/ok.md', '# OK\n');

  const findings = failingFindings('suppressions', '--json', repository);
  const details = findings.map((item) => `${item.check} ${item.detail}`).join('\n');
  assert.doesNotMatch(details, /missing target \.\/suppressed\.md/);
  assert.match(details, /markdown-link missing target \.\/adjacent\.md/);
  assert.match(details, /backtick-path missing target docs\/workflows\/nope\.md/);
  assert.match(details, /audit-suppression invalid suppression ignore/);
  assert.match(details, /audit-suppression invalid suppression ignore workflow-inventory/);
  assert.match(details, /audit-suppression unused suppression markdown-link \.\/unused\.md/);
}

function testStrictInventoryExamples() {
  const repository = createRepository('strict-inventory-examples');
  write(repository, 'docs/workflows/README.md', 'Examples:\n- `ok-workflow.md`\n- `missing-example-workflow.md`\n');
  write(repository, 'docs/workflows/ok-workflow.md', '# OK\n');
  write(repository, 'docs/workflows/unlisted-example-workflow.md', '# Unlisted example\n');

  expectExit(runAudit('--strict', repository), 0, 'strict inventory examples');
}

function testStrictInventoryDrift() {
  const repository = createRepository('strict-inventory-drift');
  write(repository, 'docs/workflows/README.md', '<!-- agent-guidance-audit: inventory -->\n- `ok-workflow.md`\n- `missing-workflow.md`\n');
  write(repository, 'docs/workflows/ok-workflow.md', '# OK\n');
  write(repository, 'docs/workflows/unlisted-workflow.md', '# Unlisted\n');

  const report = runAudit('--strict', repository);
  expectExit(report, 1, 'strict inventory drift');
  assert.match(report.stdout, /workflow-inventory missing inventory entry docs\/workflows\/unlisted-workflow\.md/);
  assert.match(report.stdout, /workflow-inventory inventory lists missing workflow missing-workflow\.md/);
}

function testConditionalFallbacks() {
  const repository = createRepository('conditional-fallbacks');
  write(repository, 'docs/workflows/one-workflow.md', '# One\n');
  write(repository, 'docs/workflows/two-workflow.md', '# Two\n');
  write(repository, 'skills/example/workflow.md', '# Packaged\n');
  write(
    repository,
    'skills/example/SKILL.md',
    [
      'Use the local `docs/workflows/one-workflow.md`, then `agents/workflows/one-workflow.md`; otherwise use the [packaged workflow](workflow.md).',
      '',
      'Check `docs/workflows/two-workflow.md` if it exists.',
      'Otherwise, check whether `agents/workflows/two-workflow.md` exists. If it does, read it.',
      'If neither local workflow exists, read `skill://example/workflow.md`.',
      '',
    ].join('\n'),
  );
  write(repository, 'skills/example/negative.md', '`agents/workflows/missing-workflow.md`\n');

  const findings = failingFindings('conditional fallbacks', '--json', repository);
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /agents\/workflows\/missing-workflow\.md/);
}

function testCleanAudit() {
  const repository = createRepository('clean-audit');
  write(repository, 'docs/references/ok.md', '# OK\n');
  write(repository, 'docs/workflows/ok.md', '# OK\n');
  write(repository, 'docs/workflows/sibling.md', '# Sibling\n');
  write(repository, 'docs/workflows/nested.md', '[sibling](sibling.md)\n');
  write(repository, 'README.md', '[valid](docs/references/ok.md) `docs/workflows/ok.md`\n');

  const report = runAudit(repository);
  expectExit(report, 0, 'clean audit');
  assert.equal(report.stdout.trim(), '');
}

function testAuditSelfTest() {
  expectExit(runAudit('--self-test'), 0, 'audit self-test');
}

try {
  testBrokenPaths();
  testLearnerCommands();
  testSuppressions();
  testStrictInventoryExamples();
  testStrictInventoryDrift();
  testConditionalFallbacks();
  testCleanAudit();
  testAuditSelfTest();
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('agent guidance audit checks passed');
