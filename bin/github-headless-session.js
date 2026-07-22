#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const repository = option('--repo');
const pullRequest = option('--pr');
const continueFile = option('--continue-file');
if (!/^[\w.-]+\/[\w.-]+$/u.test(repository ?? '') || !/^\d+$/u.test(pullRequest ?? '') || !continueFile) throw new Error('Usage: github-headless-session --repo OWNER/REPOSITORY --pr NUMBER --continue-file FILE');
if (await access(continueFile, constants.F_OK).then(() => true, () => false)) throw new Error('--continue-file must not exist before manual sign-in.');

const profile = await mkdtemp(path.join(tmpdir(), 'github-headless-session-'));
const pullRequestUrl = `https://github.com/${repository}/pull/${pullRequest}`;
let browser;
let browserExited;
let browserRunning = false;
let launchError;
let stderr = '';
let cleanupPromise;
let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  shuttingDown = true;
  cleanup().finally(() => process.exit(1));
});

try {
  browser = launch(false);
  await endpoint();
  await waitForContinuation();
  await stopBrowser();
  if (shuttingDown) throw new Error('Shutdown requested before headless relaunch.');
  browser = launch(true);
  const headlessExit = browserExited;
  console.error('Warning: the local CDP endpoint is not an authorization boundary; its consumer has the signed-in GitHub account’s normal permissions. Use a dedicated test account with repository-only access.');
  console.log(JSON.stringify({ cdpUrl: await endpoint(), pullRequestUrl }));
  await headlessExit;
} finally {
  await cleanup();
}

function option(flag) { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; }
function launch(headless) {
  launchError = undefined;
  stderr = '';
  const child = spawn(process.env.CHROMIUM ?? 'chromium', [`--user-data-dir=${profile}`, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', ...(headless ? ['--headless=new'] : []), pullRequestUrl], { stdio: ['ignore', 'ignore', 'pipe'] });
  let resolveExited;
  browserRunning = true;
  browserExited = new Promise((resolve) => { resolveExited = resolve; });
  child.once('close', () => { browserRunning = false; resolveExited(); });
  child.once('error', (error) => {
    launchError = error;
    if (child.pid === undefined) { browserRunning = false; resolveExited(); }
  });
  child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-16_384); });
  return child;
}
async function endpoint() {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (launchError) throw launchError;
    if (!browser || !browserRunning) throw new Error(`Chromium closed before exposing CDP. ${stderr}`);
    const port = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//u)?.[1]
      ?? (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
    const cdpUrl = `http://127.0.0.1:${port}`;
    if (port && await fetch(`${cdpUrl}/json/version`).then((response) => response.ok, () => false)) return cdpUrl;
    await delay(100);
  }
  throw new Error(`Chromium did not expose a local CDP endpoint. ${stderr}`);
}
async function waitForContinuation() {
  for (let attempt = 0; attempt < 1200; attempt += 1) {
    if (launchError) throw launchError;
    if (!browser || !browserRunning) throw new Error('Chromium closed before manual sign-in confirmation.');
    if (await access(continueFile, constants.F_OK).then(() => true, () => false)) return;
    await delay(250);
  }
  throw new Error('Timed out waiting for sign-in confirmation.');
}
async function stopBrowser() {
  const child = browser;
  const exited = browserExited;
  if (!child || !exited) return;
  if (browserRunning) {
    child.kill('SIGTERM');
    await Promise.race([exited, delay(5000)]);
  }
  if (browserRunning) {
    child.kill('SIGKILL');
    await Promise.race([exited, delay(5000)]);
  }
  if (browserRunning) throw new Error('Chromium did not close after SIGKILL.');
  browser = undefined;
  browserExited = undefined;
}
function cleanup() {
  cleanupPromise ??= (async () => {
    await stopBrowser();
    await rm(profile, { force: true, recursive: true });
  })();
  return cleanupPromise;
}
function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
