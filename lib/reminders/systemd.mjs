import { execFileSync } from "node:child_process"
import { access, copyFile, mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { reminderDirectory, withStore } from "./store.mjs"

export function systemdOptions(options = {}) {
  const unitName = options.unitName || "mssrt-reminders"
  if (!/^mssrt-reminders(?:-[a-z0-9-]+)?$/u.test(unitName))
    throw new Error("Unit name must be mssrt-reminders or mssrt-reminders-<lowercase-name>.")

  const directory = resolve(options.directory || reminderDirectory())
  const unitDirectory = resolve(
    options.unitDirectory ||
      join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "systemd/user")
  )
  return {
    directory,
    unitDirectory,
    unitName,
  }
}

function systemctl(...args) {
  return execFileSync("systemctl", ["--user", ...args], {
    encoding: "utf8",
    timeout: 20_000,
  }).trim()
}

function unitQuote(value) {
  if (/[\n\r]/u.test(value) || value.includes("\0"))
    throw new Error("Unsupported newline or NUL in runtime path.")
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("%", "%%").replaceAll("$", "$$")}"`
}

export async function enableReminders(options = {}) {
  if (process.platform !== "linux")
    throw new Error("Desktop reminders require Linux systemd user services.")
  const { directory, unitDirectory, unitName } = systemdOptions(options)
  const unitIdentity = `# State directory: ${unitQuote(directory)}`
  const node = execFileSync("node", ["-p", "process.execPath"], {
    encoding: "utf8",
    timeout: 5000,
  }).trim()
  execFileSync("notify-send", ["--version"], {
    timeout: 5000,
  })
  execFileSync("flock", ["--version"], {
    timeout: 5000,
  })
  systemctl("show", "--property=Version", "--value")

  return withStore(directory, async (state, save) => {
    if (
      state.setup &&
      (state.setup.unitName !== unitName || state.setup.unitDirectory !== unitDirectory)
    ) {
      throw new Error(
        "This state directory belongs to different systemd units. Use the recorded unit options or a fresh isolated directory."
      )
    }
    state.isEnabled = false
    await save(state)
    const bundle = join(directory, `runtime-${randomUUID()}`)
    await mkdir(bundle, {
      mode: 0o700,
    })
    for (const name of ["dispatch.mjs", "reminders.mjs", "store.mjs", "time.mjs"]) {
      await copyFile(new URL(name, import.meta.url), join(bundle, name))
    }
    const nextLink = join(directory, `.dispatcher-${randomUUID()}`)
    await symlink(join(bundle, "dispatch.mjs"), nextLink)
    await rename(nextLink, join(directory, "dispatch.mjs"))
    await mkdir(unitDirectory, {
      recursive: true,
      mode: 0o700,
    })
    const servicePath = join(unitDirectory, `${unitName}.service`)
    const timerPath = join(unitDirectory, `${unitName}.timer`)
    for (const path of [servicePath, timerPath]) {
      try {
        const existing = await readFile(path, "utf8")
        if (!existing.startsWith(`# Managed by MSSRT reminders\n${unitIdentity}\n`)) {
          throw new Error(
            `Refusing to replace an unmanaged unit or another state directory's unit: ${path}`
          )
        }
      } catch (error) {
        if (error.code !== "ENOENT") throw error
      }
    }
    await writeFile(
      servicePath,
      `# Managed by MSSRT reminders\n${unitIdentity}\n[Unit]\nDescription=OMP finite desktop reminder delivery\n\n[Service]\nType=oneshot\nUMask=0077\nExecStart=${unitQuote(node)} ${unitQuote(join(directory, "dispatch.mjs"))} ${unitQuote(directory)}\n`,
      {
        mode: 0o600,
      }
    )
    await writeFile(
      timerPath,
      `# Managed by MSSRT reminders\n${unitIdentity}\n[Unit]\nDescription=Check OMP desktop reminders once a minute\n\n[Timer]\nOnCalendar=*-*-* *:*:00\nPersistent=true\nAccuracySec=1s\nUnit=${unitName}.service\n\n[Install]\nWantedBy=timers.target\n`,
      {
        mode: 0o600,
      }
    )
    const dispatcher = join(directory, "dispatch.mjs")
    const installedAt = new Date().toISOString()
    const packageJson = await readFile(new URL("../../package.json", import.meta.url), "utf8")
    const packageVersion = JSON.parse(packageJson).version
    state.setup = {
      unitName,
      unitDirectory,
      dispatcher,
      node,
      installedAt,
      packageVersion,
    }
    await save(state)
    systemctl("link", servicePath)
    systemctl("daemon-reload")
    systemctl("enable", "--now", timerPath)
    state.isEnabled = true
    await save(state)
    return state.setup
  })
}

export async function disableReminders(options = {}) {
  const { directory } = systemdOptions(options)
  return withStore(directory, async (state, save) => {
    state.isEnabled = false
    await save(state)
    if (state.setup) systemctl("disable", "--now", `${state.setup.unitName}.timer`)
    return state
  })
}

export async function reminderStatus(directory = reminderDirectory()) {
  return withStore(directory, async (state) => {
    const timer = {}
    const runtime = {}
    if (state.setup) {
      for (const action of ["is-enabled", "is-active"]) {
        try {
          timer[action] = systemctl(action, `${state.setup.unitName}.timer`)
        } catch (error) {
          timer[action] = error.stdout?.toString().trim() || error.message
        }
      }
      for (const [name, mode] of [
        ["dispatcher", constants.R_OK],
        ["node", constants.X_OK],
      ]) {
        try {
          await access(state.setup[name], mode)
          runtime[name] = "available"
        } catch (error) {
          runtime[name] =
            `Missing/unavailable: ${state.setup[name]} (${error.message}). Re-run setup explicitly after restoring Node/the plugin.`
        }
      }
      const packageJson = await readFile(new URL("../../package.json", import.meta.url), "utf8")
      runtime.packageVersion = JSON.parse(packageJson).version
      runtime.installedVersion = state.setup.packageVersion
      runtime.needsRefresh = runtime.packageVersion !== runtime.installedVersion
    }
    return {
      ...state,
      directory,
      timer,
      runtime,
    }
  })
}
