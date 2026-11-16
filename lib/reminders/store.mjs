import { spawn } from "node:child_process"
import { chmod, lstat, mkdir, open, readFile, rename } from "node:fs/promises"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"

export function reminderDirectory() {
  return join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "mssrt-reminders")
}

export async function privateDirectory(directory) {
  await mkdir(directory, {
    recursive: true,
    mode: 0o700,
  })
  const stat = await lstat(directory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid()) {
    throw new Error(`Reminder directory must be a real directory owned by this user: ${directory}`)
  }
  await chmod(directory, 0o700)
}

export async function saveState(directory, state) {
  const temporary = join(directory, `.state-${randomUUID()}.json`)
  const file = await open(temporary, "wx", 0o600)
  try {
    await file.writeFile(`${JSON.stringify(state, null, 2)}\n`)
    await file.sync()
  } finally {
    await file.close()
  }
  await rename(temporary, join(directory, "state.json"))
  const folder = await open(directory, "r")
  try {
    await folder.sync()
  } finally {
    await folder.close()
  }
}

export async function loadState(directory) {
  let state
  try {
    state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"))
  } catch (error) {
    if (error.code === "ENOENT")
      return {
        version: 1,
        isEnabled: false,
        reminders: [],
      }
    throw error
  }

  const statuses = ["pending", "delivering", "delivered", "uncertain", "cancelled"]
  if (
    state.setup &&
    (!/^mssrt-reminders(?:-[a-z0-9-]+)?$/u.test(state.setup.unitName) ||
      typeof state.setup.unitDirectory !== "string" ||
      !state.setup.unitDirectory.startsWith("/") ||
      typeof state.setup.dispatcher !== "string" ||
      !state.setup.dispatcher.startsWith("/") ||
      typeof state.setup.node !== "string" ||
      !state.setup.node.startsWith("/"))
  ) {
    throw new Error(
      "Invalid reminder unit identity. Preserve state.json; no systemd action was performed."
    )
  }
  if (
    state.version !== 1 ||
    typeof state.isEnabled !== "boolean" ||
    !Array.isArray(state.reminders) ||
    !state.reminders.every(
      (record) =>
        typeof record.id === "string" &&
        statuses.includes(record.status) &&
        typeof record.message === "string" &&
        Number.isFinite(Date.parse(record.dueAt)) &&
        typeof record.timezone === "string" &&
        typeof record.localTime === "string" &&
        typeof record.session?.id === "string" &&
        typeof record.session?.path === "string" &&
        typeof record.session?.project === "string"
    )
  ) {
    throw new Error(
      "Invalid reminder state. Preserve state.json and recover from a backup; it was not overwritten."
    )
  }

  return state
}

export async function withStore(directory, action) {
  directory = resolve(directory)
  await privateDirectory(directory)
  // The kernel releases flock when this finite child's stdin closes, including on parent crash.
  const lockPath = join(directory, "state.lock")
  const lock = spawn("flock", ["--exclusive", "--timeout", "15", lockPath, "cat"], {
    stdio: ["pipe", "pipe", "pipe"],
  })
  let diagnostic = ""
  lock.stderr.on("data", (chunk) => {
    diagnostic += chunk
  })
  const closed = new Promise((done) => {
    lock.once("close", done)
  })
  lock.stdin.on("error", () => {})

  try {
    await new Promise((ready, reject) => {
      lock.once("error", reject)
      lock.once("exit", (code) =>
        reject(new Error(`Cannot lock reminders (${code}): ${diagnostic}`))
      )
      lock.stdout.once("data", ready)
      lock.stdin.write("locked\n")
    })
    return await action(await loadState(directory), (state) => saveState(directory, state))
  } finally {
    lock.stdin.end()
    await closed
  }
}
