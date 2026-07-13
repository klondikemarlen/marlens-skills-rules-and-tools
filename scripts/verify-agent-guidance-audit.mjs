import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = path.join(root, 'bin', 'agent-guidance-audit.js');
const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'agent-guidance-audit-verify-'));

function fail(message) {
  throw new Error(message);
}

try {
  const repo = path.join(fixtureRoot, 'repo');
  const workflowDir = path.join(repo, 'docs', 'workflows');
  const referenceDir = path.join(repo, 'docs', 'references');
  mkdirSync(workflowDir, { recursive: true });
  mkdirSync(referenceDir, { recursive: true });
  writeFileSync(path.join(referenceDir, 'ok.md'), '# OK\n');
  writeFileSync(path.join(workflowDir, 'ok.md'), '# OK\n');
  writeFileSync(path.join(workflowDir, 'sibling.md'), '# Sibling\n');
  writeFileSync(path.join(workflowDir, 'nested.md'), '[sibling](sibling.md) [missing sibling](missing-sibling.md)\n');

  writeFileSync(
    path.join(repo, 'README.md'),
    '[valid](docs/references/ok.md) [missing](./missing.md) `docs/workflows/nope.md`\n',
  );

  const broken = spawnSync(process.execPath, [command, repo], { encoding: 'utf8' });
  if (broken.status !== 1) fail(`expected broken fixture exit 1, got ${broken.status}: ${broken.stdout}${broken.stderr}`);
  if (!broken.stdout.includes('markdown-link missing target ./missing.md')) fail('missing root Markdown broken-link finding');
  if (!broken.stdout.includes('markdown-link missing target missing-sibling.md')) fail('missing sibling Markdown broken-link finding');
  if (!broken.stdout.includes('backtick-path missing target docs/workflows/nope.md')) fail('missing backtick-path finding');
  if (broken.stdout.includes('docs/references/ok.md')) fail('valid root Markdown target was reported');
  if (broken.stdout.includes('sibling.md:')) fail('valid sibling Markdown target was reported');

  const json = spawnSync(process.execPath, [command, '--json', repo], { encoding: 'utf8' });
  if (json.status !== 1) fail(`expected JSON fixture exit 1, got ${json.status}`);
  const findings = JSON.parse(json.stdout);
  if (findings.length !== 3) fail(`expected 3 JSON findings, got ${findings.length}`);

  const strictExampleRepo = path.join(fixtureRoot, 'strict-example-repo');
  const strictExampleWorkflowDir = path.join(strictExampleRepo, 'docs', 'workflows');
  mkdirSync(strictExampleWorkflowDir, { recursive: true });
  writeFileSync(path.join(strictExampleWorkflowDir, 'README.md'), 'Examples:\n- `ok-workflow.md`\n- `missing-example-workflow.md`\n');
  writeFileSync(path.join(strictExampleWorkflowDir, 'ok-workflow.md'), '# OK\n');
  writeFileSync(path.join(strictExampleWorkflowDir, 'unlisted-example-workflow.md'), '# Unlisted example\n');
  const strictExample = spawnSync(process.execPath, [command, '--strict', strictExampleRepo], { encoding: 'utf8' });
  if (strictExample.status !== 0) fail(`expected strict example fixture exit 0, got ${strictExample.status}: ${strictExample.stdout}${strictExample.stderr}`);

  const strictRepo = path.join(fixtureRoot, 'strict-repo');
  const strictWorkflowDir = path.join(strictRepo, 'docs', 'workflows');
  mkdirSync(strictWorkflowDir, { recursive: true });
  writeFileSync(path.join(strictWorkflowDir, 'README.md'), '<!-- agent-guidance-audit: inventory -->\n- `ok-workflow.md`\n- `missing-workflow.md`\n');
  writeFileSync(path.join(strictWorkflowDir, 'ok-workflow.md'), '# OK\n');
  writeFileSync(path.join(strictWorkflowDir, 'unlisted-workflow.md'), '# Unlisted\n');
  const strict = spawnSync(process.execPath, [command, '--strict', strictRepo], { encoding: 'utf8' });
  if (strict.status !== 1) fail(`expected strict inventory fixture exit 1, got ${strict.status}: ${strict.stdout}${strict.stderr}`);
  if (!strict.stdout.includes('workflow-inventory missing inventory entry docs/workflows/unlisted-workflow.md')) fail('missing unlisted workflow finding');
  if (!strict.stdout.includes('workflow-inventory inventory lists missing workflow missing-workflow.md')) fail('missing listed-but-absent workflow finding');

  writeFileSync(path.join(repo, 'README.md'), '[valid](docs/references/ok.md) `docs/workflows/ok.md`\n');
  writeFileSync(path.join(workflowDir, 'nested.md'), '[sibling](sibling.md)\n');
  const clean = execFileSync(process.execPath, [command, repo], { encoding: 'utf8' });
  if (clean.trim() !== '') fail(`expected clean fixture silence, got ${clean}`);

  execFileSync(process.execPath, [command, '--self-test'], { encoding: 'utf8' });
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('agent guidance audit checks passed');
