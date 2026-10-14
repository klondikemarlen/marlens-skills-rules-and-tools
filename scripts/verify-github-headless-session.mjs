import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { constants } from "node:fs"
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const temp = await mkdtemp(path.join(os.tmpdir(), "github-session-test-"))
const fake = path.join(temp, "fake-chromium.mjs")

await access(path.join(root, "bin/github-headless-session"), constants.X_OK)
await writeFile(
  fake,
  `#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
let profile = process.argv.find((arg) => arg.startsWith('--user-data-dir=')).slice(16);
if (process.env.FAKE_PRIVATE_TMP && profile.startsWith(process.env.TMPDIR + '/')) {
  profile = path.join(process.env.FAKE_PRIVATE_TMP, path.basename(profile));
  await mkdir(profile + '/Default', { recursive: true });
  await writeFile(profile + '/Default/Preferences', JSON.stringify({ credentials_enable_service: true, profile: { password_manager_enabled: true } }));
}
const headless = process.argv.includes('--headless=new');
const server = createServer((request, response) => response.end('{}'));
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.error('DevTools listening on ws://127.0.0.1:' + port + '/devtools/browser/test');
  await writeFile(profile + '/DevToolsActivePort', port + '\\n');
  const preferences = JSON.parse(await readFile(profile + '/Default/Preferences', 'utf8'));
  await appendFile(process.env.FAKE_LOG, JSON.stringify({ profile, headless, passwordManagerEnabled: preferences.credentials_enable_service || preferences.profile.password_manager_enabled }) + '\\n');
  if (headless && process.env.FAKE_NORMAL_EXIT) setTimeout(() => server.close(() => process.exit(0)), 200);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
`
)
await chmod(fake, 0o755)

try {
  await signedInCase("SIGTERM", { signal: "SIGTERM" })
  await signedInCase("SIGINT", { signal: "SIGINT" })
  await signedInCase("normal exit", { normalExit: true })
  await missingBrowserCase()
  await cancelBeforeContinuationCase()
  await sandboxedProfileCase()
} finally {
  await rm(temp, { recursive: true, force: true })
}

console.log("github headless session checks passed")

async function signedInCase(name, { signal, normalExit = false }) {
  const directory = await mkdtemp(path.join(temp, `${name.replaceAll(" ", "-")}-`))
  const log = path.join(directory, "launches.jsonl")
  const sentinel = path.join(directory, "continue")
  const child = spawn(process.execPath, launcherArguments(sentinel), {
    cwd: root,
    env: {
      ...process.env,
      HOME: directory,
      CHROMIUM: fake,
      FAKE_LOG: log,
      TMPDIR: directory,
      ...(normalExit ? { FAKE_NORMAL_EXIT: "1" } : {}),
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const output = capture(child)

  try {
    await waitFor(() => launches(log).then((rows) => rows.length === 1), name, output)
    await writeFile(sentinel, "confirmed")
    await waitFor(() => output.stdout.includes("cdpUrl"), name, output)
    const handoff = JSON.parse(output.stdout.trim())
    assert.deepEqual(Object.keys(handoff).sort(), ["cdpUrl", "pullRequestUrl"])
    assert.match(handoff.cdpUrl, /^http:\/\/127\.0\.0\.1:\d+$/)
    assert.equal(handoff.pullRequestUrl, "https://github.com/owner/repo/pull/1")
    assert.match(output.stderr, /not an authorization boundary/)
    const [headed, headless] = await waitFor(
      () => launches(log).then((rows) => (rows.length === 2 ? rows : false)),
      name,
      output
    )
    assert.equal(headed.headless, false)
    assert.equal(headless.headless, true)
    assert.equal(headed.passwordManagerEnabled, false)
    assert.equal(headed.profile, headless.profile)
    if (signal) child.kill(signal)
    await waitForExit(child, name, output)
    await assert.rejects(access(headed.profile))
  } finally {
    await stop(child)
    await rm(directory, { recursive: true, force: true })
  }
}

async function sandboxedProfileCase() {
  const directory = await mkdtemp(path.join(temp, "sandboxed-profile-"))
  const temporaryDirectory = path.join(directory, "host-temporary")
  const log = path.join(directory, "launches.jsonl")
  await mkdir(temporaryDirectory)
  const child = spawn(process.execPath, launcherArguments(path.join(directory, "continue")), {
    cwd: root,
    env: {
      ...process.env,
      HOME: path.join(directory, "shared-home"),
      CHROMIUM: fake,
      FAKE_LOG: log,
      TMPDIR: temporaryDirectory,
      FAKE_PRIVATE_TMP: path.join(directory, "browser-private-temporary"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const output = capture(child)

  try {
    const [headed] = await waitFor(
      () => launches(log).then((rows) => (rows.length === 1 ? rows : false)),
      "sandboxed profile",
      output
    )

    assert.equal(headed.passwordManagerEnabled, false)
  } finally {
    child.kill("SIGTERM")
    await waitForExit(child, "sandboxed profile", output)
    await stop(child)
    await rm(directory, { recursive: true, force: true })
  }
}

async function cancelBeforeContinuationCase() {
  const directory = await mkdtemp(path.join(temp, "cancel-manual-sign-in-"))
  const log = path.join(directory, "launches.jsonl")
  const sentinel = path.join(directory, "continue")
  const child = spawn(process.execPath, launcherArguments(sentinel), {
    cwd: root,
    env: {
      ...process.env,
      HOME: directory,
      CHROMIUM: fake,
      FAKE_LOG: log,
      TMPDIR: directory,
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const output = capture(child)

  try {
    const [headed] = await waitFor(
      () => launches(log).then((rows) => (rows.length === 1 ? rows : false)),
      "cancel manual sign-in",
      output
    )

    child.kill("SIGTERM")
    await waitForExit(child, "cancel manual sign-in", output)
    await assert.rejects(access(headed.profile))
  } finally {
    await stop(child)
    await rm(directory, { recursive: true, force: true })
  }
}

async function missingBrowserCase() {
  const directory = await mkdtemp(path.join(temp, "missing-browser-"))
  const child = spawn(process.execPath, launcherArguments(path.join(directory, "continue")), {
    cwd: root,
    env: {
      ...process.env,
      HOME: directory,
      CHROMIUM: path.join(directory, "missing"),
      TMPDIR: directory,
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const output = capture(child)

  try {
    await waitForExit(child, "missing browser", output)
    assert.notEqual(child.exitCode, 0)
  } finally {
    await stop(child)
    await rm(directory, { recursive: true, force: true })
  }
}

function launcherArguments(sentinel) {
  return [
    "bin/github-headless-session",
    "--repo",
    "owner/repo",
    "--pr",
    "1",
    "--continue-file",
    sentinel,
  ]
}

function capture(child) {
  const output = { stdout: "", stderr: "" }
  child.stdout.on("data", (chunk) => {
    output.stdout += chunk
  })
  child.stderr.on("data", (chunk) => {
    output.stderr += chunk
  })
  return output
}

async function launches(log) {
  const content = await readFile(log, "utf8").catch(() => "")
  return content.trim() ? content.trim().split("\n").map(JSON.parse) : []
}

async function waitFor(check, name, output) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await check()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`${name} timed out. stdout=${output.stdout} stderr=${output.stderr}`)
}

function waitForExit(child, name, output) {
  return waitFor(() => child.exitCode !== null || child.signalCode !== null, name, output)
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill("SIGKILL")
  await new Promise((resolve) => child.once("close", resolve))
}
