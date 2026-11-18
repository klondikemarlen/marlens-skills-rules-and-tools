import assert from "node:assert/strict"
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { spawnSync } from "node:child_process"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  acquireLease,
  parseArgs,
  interruptExitStatus,
  recoverStaleLease,
  runTemporaryMcpTask,
  temporaryMcpConfig,
} from "../bin/temporary-mcp-task.js"

const root = mkdtempSync(path.join(os.tmpdir(), "temporary-mcp-task-"))
const originalCwd = process.cwd()
const originalCapturePath = process.env.TEMPORARY_MCP_CAPTURE
const launcherPath = fileURLToPath(new URL("../bin/temporary-mcp-task", import.meta.url))

try {
  process.chdir(root)
  mkdirSync(".omp")

  const configPath = path.join(root, ".omp", "mcp.json")
  const originalConfig = `{
  "mcpServers": {
    "github": { "type": "http", "url": "https://example.test/github", "enabled": false },
    "slack": { "type": "http", "url": "https://example.test/slack" }
  },
  "disabledServers": ["github"]
}
`
  writeFileSync(configPath, originalConfig, "utf8")

  assert.deepEqual(
    parseArgs([
      "--confirm",
      "--config",
      ".omp/mcp.json",
      "--server",
      "github",
      "--",
      "List",
      "issues",
    ]),
    {
      confirm: true,
      config: ".omp/mcp.json",
      server: "github",
      omp: "omp",
      prompt: ["List", "issues"],
    }
  )
  assert.throws(
    () => parseArgs(["--config", ".omp/mcp.json", "--server", "github", "--", "List"]),
    /without --confirm/
  )
  assert.equal(interruptExitStatus("SIGQUIT"), 131)

  const temporaryConfig = temporaryMcpConfig(JSON.parse(originalConfig), "github")
  assert.equal(temporaryConfig.mcpServers.github.enabled, true)
  assert.equal(temporaryConfig.mcpServers.slack.enabled, false)
  assert(!temporaryConfig.disabledServers.includes("github"))
  assert(temporaryConfig.disabledServers.includes("slack"))
  assert.throws(() => temporaryMcpConfig(JSON.parse(originalConfig), "missing"), /not defined/)

  const fakeOmpPath = path.join(root, "fake-omp")
  const capturePath = path.join(root, "captured-mcp.json")
  writeFileSync(fakeOmpPath, '#!/bin/sh\ncat .omp/mcp.json > "$TEMPORARY_MCP_CAPTURE"\n', "utf8")
  chmodSync(fakeOmpPath, 0o755)
  process.env.TEMPORARY_MCP_CAPTURE = capturePath

  assert.equal(
    runTemporaryMcpTask({
      configPath,
      serverName: "github",
      omp: fakeOmpPath,
      prompt: ["List issues"],
      cwd: root,
    }),
    0
  )
  assert.equal(readFileSync(configPath, "utf8"), originalConfig)

  const capturedConfig = JSON.parse(readFileSync(capturePath, "utf8"))
  assert.equal(capturedConfig.mcpServers.github.enabled, true)
  assert.equal(capturedConfig.mcpServers.slack.enabled, false)
  assert(!capturedConfig.disabledServers.includes("github"))
  assert(capturedConfig.disabledServers.includes("slack"))

  const { lockPath } = acquireLease(configPath)
  assert.throws(() => acquireLease(configPath), /another temporary MCP task/)
  assert.throws(
    () => runTemporaryMcpTask({
      configPath,
      serverName: "github",
      omp: fakeOmpPath,
      prompt: ["List issues"],
      cwd: root,
    }),
    /another temporary MCP task/
  )
  assert.equal(readFileSync(configPath, "utf8"), originalConfig)
  assert(existsSync(lockPath))
  rmSync(lockPath, { recursive: true, force: true })

  const staleLockPath = `${configPath}.temporary-mcp-task.lock`
  mkdirSync(staleLockPath)
  writeFileSync(
    path.join(staleLockPath, "owner.json"),
    JSON.stringify({ pid: 99999999, mode: 0o600 }),
    "utf8"
  )
  writeFileSync(path.join(staleLockPath, "mcp.json.backup"), originalConfig, "utf8")
  writeFileSync(configPath, JSON.stringify(temporaryConfig), "utf8")
  recoverStaleLease(configPath, staleLockPath)
  assert.equal(readFileSync(configPath, "utf8"), originalConfig)
  assert(!existsSync(staleLockPath))

  // The stale on-disk config is not the baseline for the next task.
  mkdirSync(staleLockPath)
  writeFileSync(
    path.join(staleLockPath, "owner.json"),
    JSON.stringify({ pid: 99999999, mode: 0o666 }),
    "utf8"
  )
  writeFileSync(path.join(staleLockPath, "mcp.json.backup"), originalConfig, "utf8")
  writeFileSync(
    configPath,
    '{"mcpServers":{"slack":{"url":"https://stale.example.test","enabled":true}}}\n',
    "utf8"
  )
  chmodSync(configPath, 0o600)
  writeFileSync(
    fakeOmpPath,
    '#!/bin/sh\ncat .omp/mcp.json > "$TEMPORARY_MCP_CAPTURE"\ncat .omp/mcp.json.temporary-mcp-task.lock/mcp.json.backup > "$TEMPORARY_MCP_CAPTURE.backup"\n',
    "utf8"
  )
  assert.equal(
    runTemporaryMcpTask({
      configPath,
      serverName: "github",
      omp: fakeOmpPath,
      prompt: ["List issues"],
      cwd: root,
    }),
    0
  )
  assert.deepEqual(readFileSync(configPath), Buffer.from(originalConfig))
  assert.deepEqual(readFileSync(`${capturePath}.backup`), Buffer.from(originalConfig))
  assert.equal(statSync(configPath).mode & 0o777, 0o666)
  assert.deepEqual(
    JSON.parse(readFileSync(capturePath, "utf8")),
    temporaryConfig
  )
  assert(!existsSync(staleLockPath))

  assert.throws(
    () => runTemporaryMcpTask({
      configPath,
      serverName: "missing",
      omp: fakeOmpPath,
      prompt: ["List issues"],
      cwd: root,
    }),
    /not defined/
  )
  assert.deepEqual(readFileSync(configPath), Buffer.from(originalConfig))
  assert.equal(statSync(configPath).mode & 0o777, 0o666)
  assert(!existsSync(staleLockPath))

  const invalidConfig = "{ invalid JSON }\r\n"
  writeFileSync(configPath, invalidConfig, "utf8")
  assert.throws(
    () => runTemporaryMcpTask({
      configPath,
      serverName: "github",
      omp: fakeOmpPath,
      prompt: ["List issues"],
      cwd: root,
    }),
    /invalid JSON/
  )
  assert.deepEqual(readFileSync(configPath), Buffer.from(invalidConfig))
  assert.equal(statSync(configPath).mode & 0o777, 0o666)
  assert(!existsSync(staleLockPath))
  writeFileSync(configPath, originalConfig, "utf8")

  const help = spawnSync(launcherPath, ["--help"], { encoding: "utf8", cwd: root })
  assert.equal(help.status, 0, help.stderr)
  assert.match(help.stdout, /Usage: temporary-mcp-task/)
  const invalidArgs = spawnSync(launcherPath, [], { encoding: "utf8", cwd: root })
  assert.equal(invalidArgs.status, 2)
  assert.match(invalidArgs.stderr, /temporary-mcp-task:/)
  const launchedTask = spawnSync(
    launcherPath,
    [
      "--confirm",
      "--config", configPath,
      "--server", "github",
      "--omp", fakeOmpPath,
      "--", "List issues",
    ],
    { encoding: "utf8", cwd: root }
  )
  assert.equal(launchedTask.status, 0, launchedTask.stderr)
  assert.deepEqual(JSON.parse(readFileSync(capturePath, "utf8")), temporaryConfig)
  assert.deepEqual(readFileSync(configPath), Buffer.from(originalConfig))
  assert.equal(statSync(configPath).mode & 0o777, 0o666)
  assert(!existsSync(staleLockPath))

  writeFileSync(fakeOmpPath, "#!/bin/sh\nexit 7\n", "utf8")
  const failedTask = spawnSync(
    launcherPath,
    [
      "--confirm",
      "--config", configPath,
      "--server", "github",
      "--omp", fakeOmpPath,
      "--", "List issues",
    ],
    { encoding: "utf8", cwd: root }
  )
  assert.equal(failedTask.status, 7, failedTask.stderr)
  assert.deepEqual(readFileSync(configPath), Buffer.from(originalConfig))
  assert.equal(statSync(configPath).mode & 0o777, 0o666)
  assert(!existsSync(staleLockPath))

  for (const modulePath of [launcherPath, `${launcherPath}.js`]) {
    const imported = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(modulePath).href)})`],
      { encoding: "utf8", cwd: root }
    )
    assert.equal(imported.status, 0, imported.stderr)
    assert.equal(imported.stdout, "")
    assert.equal(imported.stderr, "")
  }

  console.log("temporary MCP task checks passed")
} finally {
  process.chdir(originalCwd)
  if (originalCapturePath === undefined) delete process.env.TEMPORARY_MCP_CAPTURE
  else process.env.TEMPORARY_MCP_CAPTURE = originalCapturePath
  rmSync(root, { recursive: true, force: true })
}
