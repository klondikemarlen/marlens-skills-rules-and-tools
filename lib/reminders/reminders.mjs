import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import { open } from "node:fs/promises"
import { isAbsolute } from "node:path"
import { resolveDue } from "./time.mjs"
import { reminderDirectory, withStore } from "./store.mjs"

export function prepareReminder({ when, timezone, message, session }, now = new Date()) {
  const hasControls =
    typeof message === "string" &&
    [...message].some((character) => {
      const code = character.charCodeAt(0)
      return (code < 32 && code !== 9 && code !== 10) || code === 127
    })
  if (typeof message !== "string" || !message.trim() || message.length > 2000 || hasControls) {
    throw new Error(
      "Use a nonempty reminder message of at most 2000 characters without control characters."
    )
  }
  if (!session?.id || !isAbsolute(session.path || "") || !isAbsolute(session.project || "")) {
    throw new Error(
      "A persisted originating session ID, absolute session file, and project path are required."
    )
  }

  const due = resolveDue(when, timezone, now)
  const trimmedMessage = message.trim()
  return {
    ...due,
    message: trimmedMessage,
    session: {
      ...session,
    },
  }
}

export function describeReminder(record) {
  return `${record.localTime} [${record.timezone}]\nUTC: ${record.dueAt}\nMessage: ${record.message}\nProject: ${record.session.project}\nSession: ${record.session.id}\nFile: ${record.session.path}`
}

export async function createReminder(prepared, directory = reminderDirectory(), now) {
  return withStore(directory, async (state, save) => {
    const created = now ?? new Date()
    if (Date.parse(prepared.dueAt) <= created.getTime())
      throw new Error("The reviewed due time has passed; resolve and review a new time.")
    if (!state.isEnabled)
      throw new Error(
        "Desktop reminders are off. Run /remind setup explicitly, then create the reminder."
      )
    const id = randomUUID()
    const createdAt = created.toISOString()
    const reminder = {
      ...prepared,
      id,
      status: "pending",
      createdAt,
    }
    state.reminders.push(reminder)
    await save(state)
    return reminder
  })
}

export async function changeReminder(id, action, directory = reminderDirectory()) {
  return withStore(directory, async (state, save) => {
    const record = state.reminders.find((record) => record.id === id)
    if (!record) throw new Error("No reminder has that exact ID. Use /remind list.")

    if (action === "cancel") {
      if (!["pending", "uncertain"].includes(record.status))
        throw new Error(`Cannot cancel a ${record.status} reminder.`)
      record.status = "cancelled"
    } else if (action === "retry") {
      if (record.status !== "uncertain")
        throw new Error("Only uncertain reminders need explicit retry.")
      record.status = "pending"
      delete record.lastError
    } else {
      throw new Error("Unknown reminder action.")
    }

    await save(state)
    return record
  })
}

function quoteShell(value) {
  return `'${value.replaceAll("'", "'\\''")}'`
}

export async function returningReminders(directory = reminderDirectory(), now = new Date()) {
  return withStore(directory, async (state, save) => {
    const records = state.reminders.filter(
      (record) =>
        record.status !== "cancelled" &&
        Date.parse(record.dueAt) <= now.getTime() &&
        record.surfacedStatus !== record.status
    )
    for (const record of records) record.surfacedStatus = record.status
    if (records.length) await save(state)
    return records
  })
}

export async function resumeInstructions(record) {
  let file
  try {
    file = await open(record.session.path, "r")
    const buffer = Buffer.alloc(8192)
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0)
    const lines = buffer.subarray(0, bytesRead).toString("utf8").split("\n")
    const header = lines
      .slice(0, 3)
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .find((entry) => entry?.type === "session")
    if (header?.id !== record.session.id) throw new Error("Session identity does not match.")
  } catch {
    return `Session unavailable or identity changed. Locate session ID ${record.session.id} manually; do not resume another file. Original: ${record.session.path}`
  } finally {
    await file?.close()
  }

  return `Resume manually (no command has been run):\ncd -- ${quoteShell(record.session.project)} && omp --session ${quoteShell(record.session.path)}`
}

export async function dispatch(
  directory = reminderDirectory(),
  {
    now = new Date(),
    notify = (title, body) => {
      const escapedBody = body
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
      return execFileSync("notify-send", ["--app-name=OMP Reminders", "--", title, escapedBody], {
        timeout: 15_000,
      })
    },
  } = {}
) {
  return withStore(directory, async (state, save) => {
    const interrupted = state.reminders.filter((record) => record.status === "delivering")
    for (const record of interrupted) {
      record.status = "uncertain"
      record.lastError =
        "Dispatcher interrupted around notification delivery. Inspect the desktop/history before explicitly retrying; delivery may already have happened."
    }
    if (interrupted.length) await save(state)
    if (!state.isEnabled)
      return {
        delivered: 0,
      }

    const due = state.reminders.filter(
      (record) => record.status === "pending" && Date.parse(record.dueAt) <= now.getTime()
    )
    if (!due.length)
      return {
        delivered: 0,
      }

    // Claim durably before the external side effect. Crashes become uncertain, never an automatic duplicate.
    for (const record of due) record.status = "delivering"
    await save(state)
    const previews = due
      .slice(0, 5)
      .map(
        (record) =>
          `${record.message}\nProject: ${record.session.project}\nSession: ${record.session.id}\nID: ${record.id}`
      )
    const body = `${previews.join("\n\n")}\n${due.length > 5 ? `\nAnd ${due.length - 5} more.\n` : ""}\nOpen OMP: /remind list, then /remind show ID for safe resume instructions. No task was executed.`

    try {
      await notify(due.length === 1 ? "OMP reminder" : `${due.length} OMP reminders due`, body)
    } catch (error) {
      for (const record of due) {
        record.status = "uncertain"
        record.lastError = `Notification failed or completion is unknown: ${error.message}. Check /remind show ID, then explicitly retry if needed.`
      }
      await save(state)
      throw error
    }

    for (const record of due) {
      record.status = "delivered"
      record.deliveredAt = now.toISOString()
    }
    await save(state)
    return {
      delivered: due.length,
    }
  })
}
