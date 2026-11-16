import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent"
import {
  changeReminder,
  createReminder,
  describeReminder,
  prepareReminder,
  resumeInstructions,
  returningReminders,
} from "../lib/reminders/reminders.mjs"
import { disableReminders, enableReminders, reminderStatus } from "../lib/reminders/systemd.mjs"

const help = `One-shot desktop reminders, not /loop: no model or task execution.
/remind setup — explicitly enable the Linux user timer (login + desktop notification service required)
/remind status | list | off
/remind create tomorrow at 09:00 | check the release
/remind create tomorrow at 09:00 | America/Vancouver | check the release
/remind create 2026-12-01T09:00:00-08:00 | check the release
/remind show ID | cancel ID | retry ID
Review the exact date/time/timezone/message/session before saving. Strict time input only; DST ambiguity requires an ISO offset. Delivery is at the next minute/check after wake/login, not a model run. Setup is opt-in; off keeps records. See docs/references/persistent-reminders-reference.md for recovery.`

async function reviewedCreate(
  ctx: ExtensionContext,
  when: string,
  timezone: string | undefined,
  message: string,
  directory?: string
) {
  if (!ctx.hasUI)
    throw new Error(
      "Reminder creation requires interactive review. Use /remind create in an interactive session."
    )
  const sessionId = ctx.sessionManager.getSessionId()
  const sessionPath = ctx.sessionManager.getSessionFile()
  const prepared = prepareReminder({
    when,
    timezone,
    message,
    session: {
      id: sessionId,
      path: sessionPath,
      project: ctx.cwd,
    },
  })
  if (!(await ctx.ui.confirm("Schedule this one-shot reminder?", describeReminder(prepared)))) {
    return "Reminder not saved."
  }
  const record = await createReminder(prepared, directory)
  return `Reminder saved: ${record.id}\n${describeReminder(record)}\nUse /remind status to check timer health. No model/task will run.`
}

export function registerReminders(
  pi: ExtensionAPI,
  options: {
    directory?: string
    unitDirectory?: string
    unitName?: string
  } = {}
): void {
  const { z } = pi.zod
  const when = z.string()
  const timezone = z.string().optional()
  const message = z.string()
  const parameters = z.object({
    when,
    timezone,
    message,
  })
  pi.registerCommand("remind", {
    description:
      "One-shot persistent desktop reminder; no model execution (unlike /loop). Create, list, cancel, setup/status/off",
    getArgumentCompletions(prefix) {
      const matches = [
        "create ",
        "list",
        "cancel ",
        "show ",
        "retry ",
        "setup",
        "status",
        "off",
        "help",
      ]
        .filter((value) => value.startsWith(prefix))
        .map((value) => ({
          value,
          label: value,
        }))
      return matches.length ? matches : null
    },
    async handler(args, ctx) {
      try {
        const [action, ...rest] = args.trim().split(/\s+/u)
        const argument = rest.join(" ")
        if (action === "create") {
          const parts = argument.split("|").map((part) => part.trim())
          if (parts.length !== 2 && parts.length !== 3)
            throw new Error("Use /remind create TIME | [TIMEZONE |] MESSAGE")
          ctx.ui.notify(
            await reviewedCreate(
              ctx,
              parts[0],
              parts.length === 3 ? parts[1] : undefined,
              parts.at(-1)!,
              options.directory
            ),
            "info"
          )
        } else if (action === "setup" && !argument) {
          if (!ctx.hasUI) throw new Error("Setup requires interactive opt-in.")
          if (
            !(await ctx.ui.confirm(
              "Enable persistent desktop reminders?",
              "Install only MSSRT's Linux user timer/service and a private stable dispatcher. Check once a minute while the user manager is running; catch up after login/wake. A desktop notification service must be available. No model/task execution, no lingering or shared environment changes. Re-running setup refreshes the dispatcher after upgrades. Records survive off/uninstall. Enable now?"
            ))
          )
            return
          const setup = await enableReminders(options)
          ctx.ui.setStatus("mssrt-reminders", "Reminders on · /remind status")
          ctx.ui.notify(
            `Desktop reminder timer enabled: ${setup.unitName}.timer\nDispatcher: ${setup.dispatcher}\nUse /remind status; /remind off disables delivery without deleting records.`,
            "info"
          )
        } else if (action === "off" && !argument) {
          await disableReminders(options)
          ctx.ui.setStatus("mssrt-reminders", undefined)
          ctx.ui.notify(
            "Desktop reminders disabled; saved records retained. Use /remind setup to resume.",
            "info"
          )
        } else if (["status", "list"].includes(action) && !argument) {
          const state = await reminderStatus(options.directory)
          const records = state.reminders.map(
            (record: {
              id: string
              status: string
              localTime: string
              timezone: string
              message: string
            }) =>
              `${record.id} [${record.status}] ${record.localTime} [${record.timezone}] — ${record.message}`
          )
          ctx.ui.notify(
            `Reminders: ${state.isEnabled ? "on" : "off"}; timer ${JSON.stringify(state.timer)}\nRuntime: ${JSON.stringify(state.runtime)}\nSetup: ${JSON.stringify(state.setup || "not configured")}\nPrivate state: ${state.directory}\n${records.join("\n") || "No reminders."}\nUse /remind show ID for session/recovery details. If timer is inactive/missing or runtime needsRefresh is true, run /remind setup explicitly.`,
            "info"
          )
        } else if (action === "show" && argument) {
          const state = await reminderStatus(options.directory)
          const record = state.reminders.find((record: { id: string }) => record.id === argument)
          if (!record) throw new Error("No reminder has that exact ID.")
          ctx.ui.notify(
            `${record.id} [${record.status}]\n${describeReminder(record)}\n${record.lastError || ""}\n${await resumeInstructions(record)}`,
            "info"
          )
        } else if (["cancel", "retry"].includes(action) && argument) {
          if (
            action === "retry" &&
            (!ctx.hasUI ||
              !(await ctx.ui.confirm(
                "Retry uncertain reminder?",
                "A notification may already have appeared. This explicit retry can produce a duplicate. Retry this exact reminder?"
              )))
          )
            return
          const record = await changeReminder(argument, action, options.directory)
          ctx.ui.notify(`Reminder ${record.id}: ${record.status}`, "info")
        } else {
          ctx.ui.notify(help, "info")
        }
      } catch (error) {
        ctx.ui.notify(
          `Reminder action failed: ${error instanceof Error ? error.message : String(error)}\nUse /remind help or /remind status. No successful save/activation is implied.`,
          "error"
        )
      }
    },
  })

  pi.registerTool({
    name: "remind_create",
    label: "Create Requested Reminder",
    description:
      "Only for an explicit user request for a one-shot reminder. Never invent a reminder or execute its task. Requires interactive user review of due date/time/timezone, message and originating session before persistence. Activation is separately opt-in through /remind setup. Use strict 'tomorrow at HH:MM' with an IANA timezone, or ISO date/time with an explicit offset; ask about ambiguous input instead of guessing.",
    parameters,
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const text = await reviewedCreate(
        ctx,
        params.when,
        params.timezone,
        params.message,
        options.directory
      )
      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
        details: {},
      }
    },
  })

  pi.on("session_start", async (_event, ctx) => {
    if (process.platform !== "linux" || !ctx.hasUI) return
    try {
      const state = await reminderStatus(options.directory)
      const needsAttention = await returningReminders(options.directory)
      if (needsAttention.length) {
        ctx.ui.notify(
          `${needsAttention.length} due reminders (delivered, overdue, or uncertain). Use /remind list, then /remind show ID for context and safe resume. No model/task was executed.`,
          "warning"
        )
      }
      ctx.ui.setStatus(
        "mssrt-reminders",
        state.isEnabled ? "Reminders on · /remind status" : undefined
      )
    } catch (error) {
      ctx.ui.notify(
        `Reminder state unavailable: ${error instanceof Error ? error.message : String(error)}. Use /remind status for recovery.`,
        "warning"
      )
    }
  })
}
