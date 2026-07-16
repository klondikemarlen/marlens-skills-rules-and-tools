#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const usage = `Usage: temporary-mcp-task --confirm --config <mcp.json> --server <name> [--omp <command>] -- <prompt...>

Run one non-interactive OMP task with a named server temporarily enabled in a discoverable OMP-native mcp.json file. The exact original config is restored when the child exits.`;

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

export function parseArgs(argv) {
  const options = { confirm: false, config: null, server: null, omp: 'omp', prompt: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--') {
      options.prompt = argv.slice(index + 1);
      break;
    }

    if (argument === '--confirm') {
      options.confirm = true;
      continue;
    }

    if (argument === '--config' || argument === '--server' || argument === '--omp') {
      const value = requireValue(argv, index, argument);
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    throw new Error(`unknown option: ${argument}`);
  }

  if (!options.confirm) throw new Error('refusing to mutate MCP config without --confirm');
  if (!options.config) throw new Error('--config is required');
  if (!options.server) throw new Error('--server is required');
  if (options.prompt.length === 0) throw new Error('provide the child task after --');

  return options;
}

export function nativeMcpConfigPaths({ cwd = process.cwd(), home = os.homedir(), profile = process.env.OMP_PROFILE } = {}) {
  const userConfig = profile
    ? path.join(home, '.omp', 'profiles', profile, 'agent', 'mcp.json')
    : path.join(home, '.omp', 'agent', 'mcp.json');

  return [path.join(cwd, '.omp', 'mcp.json'), userConfig].map((candidate) => path.resolve(candidate));
}

export function assertDiscoverableConfigPath(configPath, options = {}) {
  const resolvedConfigPath = path.resolve(configPath);

  if (!nativeMcpConfigPaths(options).includes(resolvedConfigPath)) {
    throw new Error(`--config must be this project's .omp/mcp.json or the active profile's user mcp.json: ${resolvedConfigPath}`);
  }

  return resolvedConfigPath;
}

export function parseMcpConfig(text, configPath) {
  let config;

  try {
    config = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid JSON in ${configPath}: ${error.message}`);
  }

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${configPath} must contain a JSON object`);
  }

  if (!config.mcpServers || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) {
    throw new Error(`${configPath} must contain an mcpServers object`);
  }

  return config;
}

export function temporaryMcpConfig(config, serverName) {
  if (!Object.hasOwn(config.mcpServers, serverName)) {
    throw new Error(`MCP server "${serverName}" is not defined in the selected config`);
  }

  const temporaryConfig = structuredClone(config);
  const serverNames = Object.keys(temporaryConfig.mcpServers);

  for (const name of serverNames) {
    const server = temporaryConfig.mcpServers[name];
    if (!server || typeof server !== 'object' || Array.isArray(server)) {
      throw new Error(`MCP server "${name}" must be an object`);
    }

    server.enabled = name === serverName;
  }

  const disabledServers = Array.isArray(temporaryConfig.disabledServers) ? temporaryConfig.disabledServers : [];
  temporaryConfig.disabledServers = [...new Set([...disabledServers.filter((name) => name !== serverName), ...serverNames.filter((name) => name !== serverName)])];

  return temporaryConfig;
}
function writeAtomically(filePath, content, mode) {
  const temporaryPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.temporary-mcp-task-${process.pid}-${Date.now()}`);
  writeFileSync(temporaryPath, content, { encoding: 'utf8', mode });
  renameSync(temporaryPath, filePath);
}

function readLockOwner(lockPath) {
  const ownerPath = path.join(lockPath, 'owner.json');
  if (!existsSync(ownerPath)) return null;

  try {
    return JSON.parse(readFileSync(ownerPath, 'utf8'));
  } catch {
    return null;
  }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

export function recoverStaleLease(configPath, lockPath) {
  if (!existsSync(lockPath)) return;

  const owner = readLockOwner(lockPath);
  if (owner && processIsAlive(owner.pid)) {
    throw new Error(`another temporary MCP task is using ${configPath} (pid ${owner.pid})`);
  }

  const backupPath = path.join(lockPath, 'mcp.json.backup');
  if (!existsSync(backupPath)) {
    throw new Error(`stale temporary MCP lock has no restorable backup: ${lockPath}`);
  }

  writeAtomically(configPath, readFileSync(backupPath, 'utf8'), owner?.mode ?? statSync(backupPath).mode);
  rmSync(lockPath, { recursive: true, force: true });
}

export function acquireLease(configPath, originalText, originalMode) {
  const lockPath = `${configPath}.temporary-mcp-task.lock`;
  const stagingLockPath = `${lockPath}.staging-${process.pid}-${Date.now()}`;
  recoverStaleLease(configPath, lockPath);
  mkdirSync(stagingLockPath);

  try {
    writeFileSync(path.join(stagingLockPath, 'mcp.json.backup'), originalText, 'utf8');
    writeFileSync(path.join(stagingLockPath, 'owner.json'), JSON.stringify({ pid: process.pid, mode: originalMode }), 'utf8');
    renameSync(stagingLockPath, lockPath);
  } catch (error) {
    rmSync(stagingLockPath, { recursive: true, force: true });
    throw error;
  }

  return lockPath;
}

export function interruptExitStatus(signal) {
  return { SIGHUP: 129, SIGINT: 130, SIGQUIT: 131, SIGTERM: 143 }[signal];
}

export function runTemporaryMcpTask({ configPath, serverName, omp = 'omp', prompt, cwd = process.cwd() }) {
  const resolvedConfigPath = assertDiscoverableConfigPath(configPath, { cwd });
  if (!existsSync(resolvedConfigPath)) throw new Error(`MCP config does not exist: ${resolvedConfigPath}`);

  const originalText = readFileSync(resolvedConfigPath, 'utf8');
  const originalConfig = parseMcpConfig(originalText, resolvedConfigPath);
  const temporaryConfig = temporaryMcpConfig(originalConfig, serverName);
  const originalMode = statSync(resolvedConfigPath).mode;
  const lockPath = acquireLease(resolvedConfigPath, originalText, originalMode);
  let restored = false;

  const restore = () => {
    if (restored) return;
    writeAtomically(resolvedConfigPath, originalText, originalMode);
    rmSync(lockPath, { recursive: true, force: true });
    restored = true;
  };

  const interrupt = (signal) => {
    restore();
    process.exit(interruptExitStatus(signal));
  };

  process.once('SIGHUP', () => interrupt('SIGHUP'));
  process.once('SIGINT', () => interrupt('SIGINT'));
  process.once('SIGQUIT', () => interrupt('SIGQUIT'));
  process.once('SIGTERM', () => interrupt('SIGTERM'));

  try {
    writeAtomically(resolvedConfigPath, `${JSON.stringify(temporaryConfig, null, 2)}\n`, originalMode);
    const childPrompt = `Use only MCP server "${serverName}" for this task. Do not use another MCP server.\n\n${prompt.join(' ')}`;
    const result = spawnSync(omp, ['--no-session', '--cwd', cwd, '-p', childPrompt], { stdio: 'inherit' });

    if (result.error) throw result.error;
    if (result.signal) return 1;
    return result.status ?? 1;
  } finally {
    restore();
  }
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage);
    return 0;
  }

  return runTemporaryMcpTask({
    configPath: options.config,
    serverName: options.server,
    omp: options.omp,
    prompt: options.prompt,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`temporary-mcp-task: ${error.message}`);
    process.exitCode = 2;
  }
}
