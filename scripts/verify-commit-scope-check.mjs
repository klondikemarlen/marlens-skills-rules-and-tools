import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCommitScope, classifyCommitPath } from '../lib/commit-scope-check.mjs';

const commandPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/check-commit-scope.js');

function writeStagedFiles(directory, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(directory, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }

  execFileSync('git', ['add', '.'], { cwd: directory });
}

function runScopeCheck(files, args = []) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'commit-scope-check-'));

  try {
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    writeStagedFiles(directory, files);

    const result = spawnSync(process.execPath, [commandPath, ...args], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      status: result.status,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

assert.deepEqual(checkCommitScope(['src/order.ts', 'test/order.test.ts']).boundaries, []);
assert.equal(classifyCommitPath('src/migration-helper.ts'), 'application code');
assert.equal(classifyCommitPath('.env.local'), 'configuration');

for (const { files, boundary, paths } of [
  {
    files: { 'src/order.ts': 'export const order = true;\n', 'docs/orders.md': '# Orders\n' },
    boundary: 'Application code and Documentation must be separate',
    paths: ['src/order.ts', 'docs/orders.md'],
  },
  {
    files: { 'src/order.ts': 'export const order = true;\n', 'migrations/001-orders.sql': 'create table orders ();\n' },
    boundary: 'Application code and Migrations must be separate',
    paths: ['src/order.ts', 'migrations/001-orders.sql'],
  },
  {
    files: { 'src/order.ts': 'export const order = true;\n', 'scripts/build.js': 'console.log("build");\n' },
    boundary: 'Application code and Developer tooling must be separate',
    paths: ['src/order.ts', 'scripts/build.js'],
  },
  {
    files: { 'src/order.ts': 'export const order = true;\n', 'tsconfig.json': '{}\n' },
    boundary: 'Configuration and non-configuration changes must be separate',
    paths: ['src/order.ts', 'tsconfig.json'],
  },
]) {
  const result = runScopeCheck(files);

  assert.equal(result.status, 1);
  assert.match(result.output, new RegExp(boundary));
  for (const filePath of paths) assert.match(result.output, new RegExp(filePath.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')));
}

const allowed = runScopeCheck({ 'src/order.ts': 'export const order = true;\n', 'test/order.test.ts': 'test("order", () => {});\n' });
assert.equal(allowed.status, 0);
assert.match(allowed.output, /Staged files satisfy commit file-type boundaries/u);

const overridden = runScopeCheck({ 'src/order.ts': 'export const order = true;\n', 'docs/orders.md': '# Orders\n' }, ['--allow-mixed']);
assert.equal(overridden.status, 0);
assert.match(overridden.output, /Override accepted/u);

console.log('commit scope checks passed');
