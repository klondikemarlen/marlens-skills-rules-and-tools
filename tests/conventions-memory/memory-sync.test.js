import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { mock, onTestFinished, test } from "bun:test"

import { version } from "../../package.json" with { type: "json" }

// The extension runtime is supplied by OMP, not an npm dependency of this plugin.
mock.module("@oh-my-pi/pi-coding-agent/config/registry", () => ({
  lookup: (id) => ({ get: (settings) => settings.values[id] }),
}))

const { registerMemorySync } = await import("../../omp-plugin/memory-sync.ts")

function enabledSyncFixture(readRecallStatus = (status) => status) {
  const agentDirectory = mkdtempSync(join(realpathSync(tmpdir()), "mssrt-memory-sync-notice-"))
  onTestFinished(() => rmSync(agentDirectory, { recursive: true, force: true }))
  const stateDirectory = join(agentDirectory, "mssrt", "memory-sync")
  const statePath = join(stateDirectory, "state.json")
  const database = join(agentDirectory, "mnemopi.db")
  mkdirSync(stateDirectory, { recursive: true })
  writeFileSync(statePath, JSON.stringify({ schema: 1, enabled: true }))

  const settings = {
    getAgentDir: () => agentDirectory,
    reloadFromDisk: async () => {},
    values: {
      "memory.backend": "mnemopi",
      "mnemopi.scoping": "per-project-tagged",
      "mnemopi.dbPath": database,
    },
  }
  const notices = []
  const context = {
    memory: {
      status: async () =>
        readRecallStatus({
          backend: "mnemopi",
          active: true,
          searchable: true,
          scope: "per-project-tagged",
          retainBank: "default",
          recallBanks: ["default"],
          database,
        }),
    },
    ui: {
      notify: (message, severity) => notices.push({ message, severity }),
    },
  }

  let startSession
  let runMssrt
  registerMemorySync({
    pi: { settings },
    on: (_event, handler) => {
      startSession = () => handler({}, context)
    },
    registerCommand: (_command, { handler }) => {
      runMssrt = (argumentsText) => handler(argumentsText, context)
    },
  })

  return { startSession, runMssrt, notices, database, statePath }
}

test("when startup updates guidance and recall is ready, the notice leads with its version", async () => {
  // Arrange
  const { startSession, notices } = enabledSyncFixture()

  // Act
  await startSession()

  // Assert
  assert.deepEqual(notices, [
    {
      message: `MSSRT ${version} guidance updated\nOMP can now recall these rules.\nDetails: /mssrt memory sync status`,
      severity: "info",
    },
  ])
})

test("when an explicit sync completes but OMP cannot see the shared bank, the notice gives a next step", async () => {
  // Arrange
  const { runMssrt, notices } = enabledSyncFixture((status) => ({
    ...status,
    recallBanks: ["project-only"],
  }))

  // Act
  await runMssrt("memory sync on")

  // Assert
  assert.deepEqual(notices, [
    {
      message: `MSSRT ${version} guidance updated\nOMP can't recall these rules yet.\nRestart OMP. If needed, run /memory diagnose.\nDetails: /mssrt memory sync status`,
      severity: "info",
    },
  ])
})

test("when the live recall check throws, the notice distinguishes unknown recall from a failed update", async () => {
  // Arrange
  const { startSession, notices } = enabledSyncFixture(() => {
    throw new Error("Memory status API unavailable")
  })

  // Act
  await startSession()

  // Assert
  assert.deepEqual(notices, [
    {
      message: `MSSRT ${version} guidance updated\nCould not check OMP recall.\nRestart OMP. If needed, run /memory diagnose.\nDetails: /mssrt memory sync status`,
      severity: "info",
    },
  ])
})

test("when startup reconciles the same source and target, it emits no notice", async () => {
  // Arrange
  const { startSession, notices } = enabledSyncFixture()
  await startSession()
  notices.length = 0

  // Act
  await startSession()

  // Assert
  assert.deepEqual(notices, [])
})

test("when an explicit sync is already current, it confirms the version and current recall without a receipt", async () => {
  // Arrange
  const { startSession, runMssrt, notices } = enabledSyncFixture()
  await startSession()
  notices.length = 0

  // Act
  await runMssrt("memory sync on")

  // Assert
  assert.deepEqual(notices, [
    {
      message: `MSSRT ${version} guidance is up to date\nOMP can now recall these rules.\nDetails: /mssrt memory sync status`,
      severity: "info",
    },
  ])
})

test("when recall status is unavailable after an import, the status command retains the receipt and diagnostic", async () => {
  // Arrange
  const { startSession, runMssrt, notices, database, statePath } = enabledSyncFixture(() => {
    throw new Error("Memory status API unavailable")
  })
  await startSession()
  const { completion } = JSON.parse(readFileSync(statePath, "utf8"))
  const { revision, id, completedAt, result } = completion
  notices.length = 0

  // Act
  await runMssrt("memory sync status")

  // Assert
  assert.deepEqual(notices, [
    {
      message: [
        "MSSRT memory sync: on",
        `Loaded installed source: ${version} / ${revision}`,
        `Configured shared target: ${database} (bank default)`,
        `Last successful synchronization: ${version} / ${revision}`,
        `Receipt: ${id} at ${completedAt}`,
        `Target: ${database} (shared bank default)`,
        `Result: ${result.sections} sections; ${result.inserted} inserted, 0 updated, 0 retired, 0 unchanged.`,
        "Last failure: none.",
        "Live recall: unavailable (Memory status API unavailable). Restart OMP and check native memory status.",
      ].join("\n"),
      severity: "info",
    },
  ])
})
