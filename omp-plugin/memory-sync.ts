import type { ExtensionAPI, ExtensionContext, Settings } from "@oh-my-pi/pi-coding-agent"
import { lookup } from "@oh-my-pi/pi-coding-agent/config/registry"
import { getMemoriesDir } from "@oh-my-pi/pi-utils"
import { withFileLock } from "@oh-my-pi/pi-utils/file-lock"
import { randomUUID } from "node:crypto"
import { lstat, mkdir, readFile, realpath, rename, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { captureInstalledConventions } from "../lib/conventions-memory/source.js"
import { synchronizeConventions } from "../lib/conventions-memory/sync.js"

const packageRoot = fileURLToPath(new URL("../", import.meta.url))
const help =
  "Usage: /mssrt memory sync on|status|off\non: import installed guidance now and refresh on future starts; status: source, last result and live recall; off: stop refresh, keep memories and recall settings."

type ImportResult = {
  inserted: number
  updated: number
  retired: number
  unchanged: number
  sections: number
  revision: string
  database: string
}
type Target = { database: string; bank: string }
type Completion = {
  id: string
  completedAt: string
  version: string
  revision: string
  target: Target
  result: ImportResult
}
type SyncState = {
  schema: 1
  enabled: boolean
  completion?: Completion
  failure?: { at: string; message: string }
}

function setting(id: string) {
  const handle = lookup(id)
  if (!handle)
    throw new Error(
      `This OMP version does not expose ${id}; update OMP before enabling memory sync.`
    )
  return handle
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// Kept in step with OMP 18.18.5 mnemopi/config.ts; that internal module is not exported.
function sharedBank(value: string | undefined): string {
  const sanitized = value
    ?.trim()
    .replace(/[^a-zA-Z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
  if (!sanitized) return "default"
  if (sanitized.length <= 64) return sanitized
  const hash = Bun.hash(sanitized).toString(36)
  const prefix = sanitized.slice(0, Math.max(1, 63 - hash.length)).replace(/-+$/gu, "") || "bank"
  return `${prefix}-${hash}`
}

function syncTarget(settings: Settings): Target {
  const configured = setting("mnemopi.dbPath").get(settings) as string | undefined
  const rawPath = configured?.trim()
  const database = rawPath
    ? rawPath.replace(/^~(?=$|[/\\])/u, homedir())
    : join(getMemoriesDir(settings.getAgentDir()), "mnemopi", "mnemopi.db")
  // Native state.ts resolveBankDbPath maps globalBank to the base dbPath even
  // for a non-default shared bank. Only project-local banks use banks/<name>.
  return {
    database: resolve(database),
    bank: sharedBank(setting("mnemopi.bank").get(settings) as string | undefined),
  }
}

async function canonicalTarget(settings: Settings): Promise<Target> {
  const target = syncTarget(settings)
  await mkdir(dirname(target.database), { recursive: true })
  try {
    target.database = await realpath(target.database)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    target.database = join(
      await realpath(dirname(target.database)),
      target.database.split(/[/\\]/u).at(-1)!
    )
  }
  return target
}

async function loadState(path: string): Promise<SyncState> {
  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { schema: 1, enabled: false }
    throw error
  }
  const state = JSON.parse(text)
  if (state?.schema !== 1 || typeof state.enabled !== "boolean") {
    throw new Error(
      `Invalid MSSRT memory-sync state at ${path}; restore its backup or move it aside explicitly.`
    )
  }
  const completed = state.completion
  if (
    completed &&
    (typeof completed.id !== "string" ||
      typeof completed.completedAt !== "string" ||
      typeof completed.version !== "string" ||
      typeof completed.revision !== "string" ||
      typeof completed.target?.database !== "string" ||
      typeof completed.target?.bank !== "string" ||
      !completed.result ||
      !["inserted", "updated", "retired", "unchanged", "sections"].every(
        (key) => Number.isInteger(completed.result[key]) && completed.result[key] >= 0
      ))
  )
    throw new Error(
      `Invalid MSSRT synchronization receipt in ${path}; refusing to trust or overwrite it.`
    )
  if (
    state.failure &&
    (typeof state.failure.message !== "string" || typeof state.failure.at !== "string")
  ) {
    throw new Error(`Invalid MSSRT failure record in ${path}; restore it before syncing.`)
  }
  return state
}

async function saveState(path: string, state: SyncState): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: "wx", mode: 0o600 })
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error
    })
  }
}

async function assertWritableConfig(settings: Settings): Promise<void> {
  const agentDir = settings.getAgentDir()
  for (const name of ["config.yml", "config.yaml"]) {
    const path = join(agentDir, name)
    try {
      const entry = await lstat(path)
      if (entry.isSymbolicLink() || entry.nlink > 1) {
        throw new Error(
          `${path} is managed through a link. Set memory.backend=mnemopi and mnemopi.scoping=per-project-tagged in its owning configuration, then retry; MSSRT will not edit the backing file.`
        )
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
}

function requiredChanges(settings: Settings) {
  const required = [
    { handle: setting("memory.backend"), value: "mnemopi" },
    { handle: setting("mnemopi.scoping"), value: "per-project-tagged" },
  ]
  return required.filter(({ handle, value }) => handle.get(settings) !== value)
}

function assertRecallPreference(settings: Settings): void {
  if (setting("mnemopi.autoRecall").get(settings) === false) {
    throw new Error(
      "mnemopi.autoRecall is disabled. MSSRT will not change your recall preference. Enable it explicitly in its owning settings before running /mssrt memory sync on."
    )
  }
}

function assertEffectiveSettings(settings: Settings): void {
  assertRecallPreference(settings)
  const changes = requiredChanges(settings)
  if (changes.length) {
    throw new Error(
      `Memory sync requires ${changes.map(({ handle, value }) => `${handle.id}=${value} (currently ${handle.provenance(settings)})`).join(" and ")}. Run /mssrt memory sync on to review changes, or update the owning settings.`
    )
  }
}

async function enableSettings(
  settings: Settings,
  ctx: ExtensionContext,
  alreadyEnabled: boolean
): Promise<boolean> {
  assertRecallPreference(settings)
  const changes = requiredChanges(settings)
  const approvedValues = new Map(changes.map(({ handle }) => [handle.id, handle.get(settings)]))
  for (const { handle } of changes) {
    const provenance = handle.provenance(settings)
    if (provenance !== "global" && provenance !== "default") {
      throw new Error(
        `${handle.id} is controlled by ${provenance} settings. Update that source to ${handle.id === "memory.backend" ? "mnemopi" : "per-project-tagged"}, then retry. MSSRT will not bypass a higher-priority setting.`
      )
    }
  }
  if (changes.length) await assertWritableConfig(settings)
  if (!alreadyEnabled || changes.length) {
    const details = changes.length
      ? `Persist globally: ${changes.map(({ handle, value }) => `${handle.id}: ${String(handle.get(settings))} → ${value}`).join("; ")}. This can replace your current memory backend or change its scope.`
      : "Native Mnemopi and shared recall/project-local retention are already configured; no native settings need changing."
    const explanation = `${details}\nImport this installed package's guidance into the shared recall bank now and automatically refresh after installed updates. Keep ordinary recall/retention, models, providers, credentials and embeddings unchanged. Off stops only MSSRT refresh and never deletes memories or restores settings.`
    if (!ctx.hasUI)
      throw new Error(
        `Interactive consent required: ${explanation} Run /mssrt memory sync on in an interactive OMP session.`
      )
    if (!(await ctx.ui.confirm("Enable MSSRT guidance memory sync?", explanation))) return false
  }
  // Recheck after the dialog: another process may have edited the global file.
  await settings.reloadFromDisk({ includeParents: true })
  const refreshed = requiredChanges(settings)
  if (
    refreshed.some(
      ({ handle }) =>
        approvedValues.has(handle.id) && approvedValues.get(handle.id) !== handle.get(settings)
    )
  ) {
    throw new Error(
      "Memory settings changed while consent was open; retry on to review the new backend/scope."
    )
  }
  if (
    refreshed.some(
      ({ handle, value }) =>
        !changes.some((change) => change.handle.id === handle.id && change.value === value)
    )
  ) {
    throw new Error(
      "Memory settings changed while consent was open; retry /mssrt memory sync on to review the current changes."
    )
  }
  for (const { handle } of refreshed) {
    if (!["global", "default"].includes(handle.provenance(settings))) {
      throw new Error(
        `${handle.id} is now controlled by ${handle.provenance(settings)} settings; update its owning source and retry.`
      )
    }
  }
  assertRecallPreference(settings)
  if (refreshed.length) {
    await assertWritableConfig(settings)
    for (const { handle, value } of refreshed) handle.set(settings, value)
    await settings.flush()
  }
  assertEffectiveSettings(settings)
  return true
}

async function recallReadiness(
  ctx: ExtensionContext,
  settings: Settings,
  target?: Target
): Promise<string> {
  try {
    const status = await ctx.memory.status()
    const bankVisible = target && status.recallBanks?.includes(target.bank)
    const expectedLiveDatabase =
      target && status.retainBank
        ? status.retainBank === target.bank
          ? target.database
          : join(dirname(target.database), "banks", status.retainBank, "mnemopi.db")
        : undefined
    const liveDatabase = status.database?.replace(/^~(?=$|[/\\])/u, homedir())
    const databaseMatches =
      liveDatabase &&
      expectedLiveDatabase &&
      (await realpath(liveDatabase).catch(() => resolve(liveDatabase))) ===
        (await realpath(expectedLiveDatabase).catch(() => resolve(expectedLiveDatabase)))
    const ready =
      status.backend === "mnemopi" &&
      status.active &&
      status.searchable &&
      status.scope === "per-project-tagged" &&
      bankVisible &&
      databaseMatches &&
      setting("mnemopi.autoRecall").get(settings) !== false &&
      !status.error
    return ready
      ? "Live recall: ready — shared conventions, project-local conversations."
      : `Live recall: not ready${status.error ? ` (${status.error})` : ""}. Restart OMP; if this persists, run /memory diagnose.`
  } catch (error) {
    return `Live recall: unavailable (${errorMessage(error)}). Restart OMP and check native memory status.`
  }
}

function renderCompletion(completion: Completion | undefined): string {
  if (!completion) return "Last successful synchronization: none."
  const { result } = completion
  return `Last successful synchronization: ${completion.version} / ${completion.revision}\nReceipt: ${completion.id} at ${completion.completedAt}\nTarget: ${completion.target.database} (shared bank ${completion.target.bank})\nResult: ${result.sections} sections; ${result.inserted} inserted, ${result.updated} updated, ${result.retired} retired, ${result.unchanged} unchanged.`
}

export function registerMemorySync(pi: ExtensionAPI): void {
  const settings = pi.pi.settings
  const sourceAtLoad = (() => {
    try {
      return { captured: captureInstalledConventions(packageRoot) }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  })()

  async function run(
    action: "on" | "off" | "status" | "startup",
    ctx: ExtensionContext
  ): Promise<void> {
    const stateDirectory = join(settings.getAgentDir(), "mssrt", "memory-sync")
    const statePath = join(stateDirectory, "state.json")
    try {
      await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
      await withFileLock(statePath, async () => {
        const state = await loadState(statePath)
        if (action === "off") {
          state.enabled = false
          await saveState(statePath, state)
          ctx.ui.notify(
            "MSSRT memory sync is off. Existing memories and native recall/retention settings are unchanged.",
            "info"
          )
          return
        }
        if (action === "startup" && !state.enabled) return
        try {
          await settings.reloadFromDisk({ includeParents: true })
          let sourceNow
          let sourceFailure
          try {
            sourceNow = captureInstalledConventions(packageRoot)
          } catch (error) {
            sourceFailure = errorMessage(error)
          }
          const captured = sourceAtLoad.captured
          const sourceChanged =
            captured &&
            sourceNow &&
            (captured.version !== sourceNow.version || captured.revision !== sourceNow.revision)
          if (action === "status") {
            const target = syncTarget(settings)
            const readiness = await recallReadiness(ctx, settings, target)
            ctx.ui.notify(
              [
                `MSSRT memory sync: ${state.enabled ? "on" : "off"}`,
                captured
                  ? `Loaded installed source: ${captured.version} / ${captured.revision}`
                  : `Loaded source unavailable: ${sourceAtLoad.error}`,
                sourceChanged
                  ? `Installed source changed to ${sourceNow?.version}; restart OMP to load it before synchronization.`
                  : "",
                sourceFailure ? `Installed source failure: ${sourceFailure}` : "",
                `Configured shared target: ${target.database} (bank ${target.bank})`,
                renderCompletion(state.completion),
                state.failure
                  ? `Last failure (${state.failure.at}): ${state.failure.message}`
                  : "Last failure: none.",
                readiness,
              ]
                .filter(Boolean)
                .join("\n"),
              "info"
            )
            return
          }
          if (!captured)
            throw new Error(`Cannot capture loaded installed guidance: ${sourceAtLoad.error}`)
          if (sourceFailure) throw new Error(`Cannot read installed guidance: ${sourceFailure}`)
          if (sourceChanged)
            throw new Error(
              "The installed guidance changed after this plugin loaded. Restart OMP to synchronize the new installed version."
            )
          if (action === "on") {
            if (!(await enableSettings(settings, ctx, state.enabled))) {
              ctx.ui.notify("MSSRT memory sync activation cancelled; opt-in unchanged.", "info")
              return
            }
            state.enabled = true
            await saveState(statePath, state)
          } else {
            assertEffectiveSettings(settings)
          }
          const target = await canonicalTarget(settings)
          // Different profiles can intentionally point at one physical database.
          // Lock that exact target as well as this profile's enablement/receipt.
          const result = await withFileLock(target.database, async () => {
            return synchronizeConventions(target.database, captured) as ImportResult
          })
          const prior = state.completion
          if (
            prior?.revision === captured.revision &&
            prior.version === captured.version &&
            prior.target.database === target.database &&
            prior.target.bank === target.bank &&
            result.inserted === 0 &&
            result.updated === 0 &&
            result.retired === 0
          ) {
            if (state.failure) {
              delete state.failure
              await saveState(statePath, state)
            }
            if (action === "on") {
              ctx.ui.notify(
                `MSSRT memory sync is on; this installed source and target are already synchronized.\n${renderCompletion(prior)}\n${await recallReadiness(ctx, settings, target)}`,
                "info"
              )
            }
            return
          }
          const completion: Completion = {
            id: randomUUID(),
            completedAt: new Date().toISOString(),
            version: captured.version,
            revision: captured.revision,
            target,
            result,
          }
          state.completion = completion
          delete state.failure
          await saveState(statePath, state)
          ctx.ui.notify(
            `MSSRT guidance synchronized.\n${renderCompletion(completion)}\n${await recallReadiness(ctx, settings, target)}`,
            "info"
          )
        } catch (error) {
          if (action !== "status") {
            state.failure = { at: new Date().toISOString(), message: errorMessage(error) }
            await saveState(statePath, state)
          }
          throw error
        }
      })
    } catch (error) {
      ctx.ui.notify(
        `MSSRT memory sync failed: ${errorMessage(error)}\nUse /mssrt memory sync status; fix the reported prerequisite, then retry on. No failed import is marked complete.`,
        "error"
      )
    }
  }

  pi.registerCommand("mssrt", {
    description: "Installed guidance memory sync: memory sync on|status|off",
    getArgumentCompletions(prefix) {
      const values = ["memory sync on", "memory sync status", "memory sync off", "help"]
      const matches = values
        .filter((value) => value.startsWith(prefix))
        .map((value) => ({ value, label: value }))
      return matches.length ? matches : null
    },
    async handler(args, ctx) {
      const match = /^memory\s+sync\s+(on|off|status)$/u.exec(args.trim())
      if (!match) {
        ctx.ui.notify(help, "info")
        return
      }
      await run(match[1] as "on" | "off" | "status", ctx)
    },
  })
  pi.on("session_start", async (_event, ctx) => {
    await run("startup", ctx)
  })
}
