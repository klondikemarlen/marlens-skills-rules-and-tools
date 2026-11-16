import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { registerReminders } from "../../omp-plugin/reminders.ts"
import { createReminder, dispatch, prepareReminder } from "../../lib/reminders/reminders.mjs"
import { loadState, withStore } from "../../lib/reminders/store.mjs"

function capturePlugin(directory) {
  const commands = new Map()
  const tools = new Map()
  const handlers = new Map()
  const pi = {
    zod: {
      z: {
        string: () => ({
          optional() {
            return this
          },
        }),
        object: (schema) => schema,
      },
    },
    registerCommand: (name, command) => commands.set(name, command),
    registerTool: (tool) => tools.set(tool.name, tool),
    on: (name, handler) => handlers.set(name, handler),
  }
  registerReminders(pi, {
    directory,
  })
  return {
    commands,
    tools,
    handlers,
  }
}

async function isolate(t) {
  const directory = await mkdtemp(join(tmpdir(), "mssrt-reminder-plugin-test-"))
  t.after(() =>
    rm(directory, {
      recursive: true,
      force: true,
    })
  )
  await withStore(directory, async (state, save) => {
    state.isEnabled = true
    await save(state)
  })
  return directory
}

test(
  "when startup is headless, due notices remain for the next interactive user",
  {
    skip: process.platform !== "linux",
  },
  async (t) => {
    // Arrange
    const directory = await isolate(t)
    const due = new Date(Date.now() - 60_000)
    const created = new Date(due.getTime() - 60_000)
    const when = due.toISOString()
    const path = join(directory, "original.jsonl")
    const prepared = prepareReminder(
      {
        when,
        timezone: "UTC",
        message: "Return to the original session",
        session: {
          id: "original-session",
          path,
          project: directory,
        },
      },
      created
    )
    await createReminder(prepared, directory, created)
    await dispatch(directory, {
      notify: () => {},
    })
    const plugin = capturePlugin(directory)
    const start = plugin.handlers.get("session_start")
    const notices = []
    // Act and Assert
    await start(
      {},
      {
        hasUI: false,
        ui: {
          notify: (message) => notices.push(message),
        },
      }
    )
    assert.equal((await loadState(directory)).reminders[0].surfacedStatus, undefined)
    assert.deepEqual(notices, [])

    const interactive = {
      hasUI: true,
      ui: {
        notify: (message) => notices.push(message),
        setStatus: () => {},
      },
    }
    await start({}, interactive)
    assert.equal(notices.length, 1)
    assert.match(notices[0], /1 due reminders/u)
    assert.equal((await loadState(directory)).reminders[0].surfacedStatus, "delivered")
    await start({}, interactive)
    assert.equal(notices.length, 1)
  }
)

test("when creation is declined, reviewed session details are not persisted", async (t) => {
  // Arrange
  const directory = await isolate(t)
  const plugin = capturePlugin(directory)
  const sessionPath = join(directory, "original.jsonl")
  const command = plugin.commands.get("remind")
  let review
  let stateAtReview
  const context = {
    hasUI: true,
    cwd: directory,
    sessionManager: {
      getSessionId: () => "original-session",
      getSessionFile: () => sessionPath,
    },
    ui: {
      async confirm(_title, body) {
        stateAtReview = await loadState(directory)
        review = body
        return false
      },
      notify: () => {},
    },
  }

  // Act
  await command.handler("create tomorrow at 09:00 | UTC | Check the release", context)

  // Assert
  assert.deepEqual(stateAtReview.reminders, [])
  assert.match(review, /\[UTC\]/u)
  assert.match(review, /Session: original-session/u)
  assert.ok(review.includes(sessionPath))
  assert.deepEqual((await loadState(directory)).reminders, [])
})

test("when creation is accepted, persistence follows review of the original session", async (t) => {
  // Arrange
  const directory = await isolate(t)
  const plugin = capturePlugin(directory)
  const sessionPath = join(directory, "original.jsonl")
  const command = plugin.commands.get("remind")
  let stateAtReview
  const notices = []
  const context = {
    hasUI: true,
    cwd: directory,
    sessionManager: {
      getSessionId: () => "original-session",
      getSessionFile: () => sessionPath,
    },
    ui: {
      async confirm() {
        stateAtReview = await loadState(directory)
        return true
      },
      notify: (message) => notices.push(message),
    },
  }

  // Act
  await command.handler("create tomorrow at 09:00 | UTC | Check the release", context)

  // Assert
  assert.deepEqual(stateAtReview.reminders, [])
  const state = await loadState(directory)
  assert.equal(state.reminders.length, 1)
  const record = state.reminders[0]
  assert.equal(record.session.path, sessionPath)
  assert.equal(record.message, "Check the release")
  assert.ok(notices.some((notice) => notice.includes(`Reminder saved: ${record.id}`)))
})
