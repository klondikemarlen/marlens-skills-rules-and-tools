import { createInterface } from "node:readline/promises"
import {
  changeReminder,
  createReminder,
  describeReminder,
  dispatch,
  prepareReminder,
  resumeInstructions,
} from "./reminders.mjs"
import { disableReminders, enableReminders, reminderStatus } from "./systemd.mjs"

const help = `Usage: omp-remind [--state-dir PATH] [--unit-dir PATH] [--unit-name mssrt-reminders-NAME] ACTION
Actions: help, status, list, show ID, cancel ID, retry ID, setup, off, dispatch, create JSON
create JSON: {"when":"tomorrow at 09:00","timezone":"America/Vancouver","message":"Check release","session":{"id":"ID","path":"/absolute/session.jsonl","project":"/absolute/project"}}
setup/create/retry require typing the requested confirmation after reviewing the output.
Explicit setup enables only this Linux user timer. No models/tasks run. Isolate QA with fresh state-dir AND unit-name/unit-dir; no production state is needed.
See docs/references/persistent-reminders-reference.md for login prerequisites and recovery.`

async function confirm(message, word) {
  console.log(message)
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    return (await terminal.question(`Type ${word} to continue: `)).trim() === word
  } finally {
    terminal.close()
  }
}

export async function runCli(args) {
  const options = {}
  while (args[0]?.startsWith("--")) {
    const flag = args.shift()
    const value = args.shift()
    const key = {
      "--state-dir": "directory",
      "--unit-dir": "unitDirectory",
      "--unit-name": "unitName",
    }[flag]
    if (!key || !value || value.startsWith("--")) throw new Error(`Invalid option: ${flag}`)
    options[key] = value
  }
  const [action = "help", argument, ...extra] = args
  if (extra.length) throw new Error("Unexpected extra arguments.")

  if (action === "help") {
    console.log(help)
  } else if (["status", "list"].includes(action)) {
    console.log(JSON.stringify(await reminderStatus(options.directory), null, 2))
  } else if (action === "setup") {
    if (
      !(await confirm(
        `Enable a finite desktop-only systemd USER timer, once per minute? No model execution, no lingering, no shared environment changes. Desktop notification service/login required. Units: ${options.unitName || "mssrt-reminders"}; state: ${options.directory || "default private state"}. Re-run setup to refresh the stable runtime after an upgrade.`,
        "enable"
      ))
    )
      return 1
    console.log(JSON.stringify(await enableReminders(options), null, 2))
  } else if (action === "off") {
    await disableReminders(options)
    console.log("Reminders disabled; records retained.")
  } else if (action === "dispatch") {
    console.log(JSON.stringify(await dispatch(options.directory)))
  } else if (action === "create" && argument) {
    const prepared = prepareReminder(JSON.parse(argument))
    if (!(await confirm(describeReminder(prepared), "schedule"))) return 1
    console.log(JSON.stringify(await createReminder(prepared, options.directory), null, 2))
  } else if (action === "show" && argument) {
    const state = await reminderStatus(options.directory)
    const record = state.reminders.find((record) => record.id === argument)
    if (!record) throw new Error("Unknown exact reminder ID.")
    console.log(`${JSON.stringify(record, null, 2)}\n${await resumeInstructions(record)}`)
  } else if (["cancel", "retry"].includes(action) && argument) {
    if (
      action === "retry" &&
      !(await confirm(
        "A notification may already have appeared. Explicit retry can duplicate it.",
        "retry"
      ))
    )
      return 1
    console.log(JSON.stringify(await changeReminder(argument, action, options.directory), null, 2))
  } else {
    throw new Error(help)
  }
  return 0
}
