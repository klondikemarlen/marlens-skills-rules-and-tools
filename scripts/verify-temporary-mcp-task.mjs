import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  acquireLease,
  parseArgs,
  interruptExitStatus,
  recoverStaleLease,
  runTemporaryMcpTask,
  temporaryMcpConfig,
} from '../bin/temporary-mcp-task.js';

const root = mkdtempSync(path.join(os.tmpdir(), 'temporary-mcp-task-'));
const originalCwd = process.cwd();
const originalCapturePath = process.env.TEMPORARY_MCP_CAPTURE;

try {
  process.chdir(root);
  mkdirSync('.omp');

  const configPath = path.join(root, '.omp', 'mcp.json');
  const originalConfig = `{
  "mcpServers": {
    "github": { "type": "http", "url": "https://example.test/github", "enabled": false },
    "slack": { "type": "http", "url": "https://example.test/slack" }
  },
  "disabledServers": ["github"]
}
`;
  writeFileSync(configPath, originalConfig, 'utf8');

  assert.deepEqual(parseArgs(['--confirm', '--config', '.omp/mcp.json', '--server', 'github', '--', 'List', 'issues']), {
    confirm: true,
    config: '.omp/mcp.json',
    server: 'github',
    omp: 'omp',
    prompt: ['List', 'issues'],
  });
  assert.throws(() => parseArgs(['--config', '.omp/mcp.json', '--server', 'github', '--', 'List']), /without --confirm/);
  assert.equal(interruptExitStatus('SIGQUIT'), 131);

  const temporaryConfig = temporaryMcpConfig(JSON.parse(originalConfig), 'github');
  assert.equal(temporaryConfig.mcpServers.github.enabled, true);
  assert.equal(temporaryConfig.mcpServers.slack.enabled, false);
  assert(!temporaryConfig.disabledServers.includes('github'));
  assert(temporaryConfig.disabledServers.includes('slack'));
  assert.throws(() => temporaryMcpConfig(JSON.parse(originalConfig), 'missing'), /not defined/);

  const fakeOmpPath = path.join(root, 'fake-omp');
  const capturePath = path.join(root, 'captured-mcp.json');
  writeFileSync(fakeOmpPath, '#!/bin/sh\ncat .omp/mcp.json > "$TEMPORARY_MCP_CAPTURE"\n', 'utf8');
  chmodSync(fakeOmpPath, 0o755);
  process.env.TEMPORARY_MCP_CAPTURE = capturePath;

  assert.equal(
    runTemporaryMcpTask({
      configPath,
      serverName: 'github',
      omp: fakeOmpPath,
      prompt: ['List issues'],
      cwd: root,
    }),
    0,
  );
  assert.equal(readFileSync(configPath, 'utf8'), originalConfig);

  const capturedConfig = JSON.parse(readFileSync(capturePath, 'utf8'));
  assert.equal(capturedConfig.mcpServers.github.enabled, true);
  assert.equal(capturedConfig.mcpServers.slack.enabled, false);
  assert(!capturedConfig.disabledServers.includes('github'));
  assert(capturedConfig.disabledServers.includes('slack'));

  const lockPath = acquireLease(configPath, originalConfig, 0o600);
  assert.throws(
    () => acquireLease(configPath, originalConfig, 0o600),
    /another temporary MCP task/,
  );
  rmSync(lockPath, { recursive: true, force: true });

  const staleLockPath = `${configPath}.temporary-mcp-task.lock`;
  mkdirSync(staleLockPath);
  writeFileSync(path.join(staleLockPath, 'owner.json'), JSON.stringify({ pid: 99999999, mode: 0o600 }), 'utf8');
  writeFileSync(path.join(staleLockPath, 'mcp.json.backup'), originalConfig, 'utf8');
  writeFileSync(configPath, JSON.stringify(temporaryConfig), 'utf8');
  recoverStaleLease(configPath, staleLockPath);
  assert.equal(readFileSync(configPath, 'utf8'), originalConfig);
  assert(!existsSync(staleLockPath));

  console.log('temporary MCP task checks passed');
} finally {
  process.chdir(originalCwd);
  if (originalCapturePath === undefined) delete process.env.TEMPORARY_MCP_CAPTURE;
  else process.env.TEMPORARY_MCP_CAPTURE = originalCapturePath;
  rmSync(root, { recursive: true, force: true });
}
