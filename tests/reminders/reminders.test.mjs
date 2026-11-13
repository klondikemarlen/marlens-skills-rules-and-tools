import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import test from "node:test"
import {
  changeReminder,
  createReminder,
  dispatch,
  prepareReminder,
  resumeInstructions,
  returningReminders,
} from "../../lib/reminders/reminders.mjs"
import { loadState, withStore } from "../../lib/reminders/store.mjs"
import { resolveDue } from "../../lib/reminders/time.mjs"

const execute = promisify(execFile)
const now = new Date("2030-01-01T12:00:00Z")
const due = new Date("2030-01-02T12:00:00Z")

async function isolated(t) {
  const directory = await mkdtemp(join(tmpdir(), "mssrt-reminders-test-"))
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

function prepared(directory, message = "Check the release") {
  const when = due.toISOString()
  const path = join(directory, "session.jsonl")
  return prepareReminder(
    {
      when,
      timezone: "America/Vancouver",
      message,
      session: {
        id: "original-session",
        path,
        project: directory,
      },
    },
    now
  )
}

test("strict local dates reject both DST gaps and folds, while explicit offsets select the instant", () => {
  assert.throws(
    () => resolveDue("tomorrow at 02:30", "America/Vancouver", new Date("2024-03-09T20:00:00Z")),
    /nonexistent or ambiguous/u
  )
  assert.throws(
    () => resolveDue("tomorrow at 01:30", "America/Vancouver", new Date("2024-11-02T20:00:00Z")),
    /nonexistent or ambiguous/u
  )
  assert.equal(
    resolveDue("2024-11-03T01:30:00-07:00", "America/Vancouver", new Date("2024-11-02T20:00:00Z"))
      .dueAt,
    "2024-11-03T08:30:00.000Z"
  )
  assert.equal(
    resolveDue("tomorrow at 09:00", "Asia/Tokyo", new Date("2026-11-13T23:00:00Z")).dueAt,
    "2026-11-15T00:00:00.000Z"
  )
  for (const input of [
    "tomorrow",
    "next Monday",
    "2030-02-30T09:00:00Z",
    "2030-01-02T09:00",
    "2030-01-02T24:00:00Z",
  ]) {
    assert.throws(() => resolveDue(input, "UTC", now))
  }
})

test("private persistence survives a fresh process and cancellation affects only the exact reminder", async (t) => {
  const directory = await isolated(t)
  const first = await createReminder(prepared(directory), directory, now)
  const second = await createReminder(prepared(directory, "Other task"), directory, now)
  await changeReminder(first.id, "cancel", directory)
  const cli = new URL("../../bin/omp-remind", import.meta.url).pathname
  const { stdout } = await execute(process.execPath, [cli, "--state-dir", directory, "list"])
  const state = JSON.parse(stdout)
  assert.equal(state.reminders.find((record) => record.id === first.id).status, "cancelled")
  assert.equal(state.reminders.find((record) => record.id === second.id).status, "pending")
  assert.equal((await stat(directory)).mode & 0o777, 0o700)
  assert.equal((await stat(join(directory, "state.json"))).mode & 0o777, 0o600)
  await assert.rejects(changeReminder("not-an-id", "cancel", directory), /exact ID/u)
})

test("desktop previews prioritize the message without exposing private session coordinates", async (t) => {
  const directory = await isolated(t)
  const record = await createReminder(prepared(directory), directory, now)
  let notification
  await dispatch(directory, {
    now: due,
    notify: (title, body) => {
      notification = {
        title,
        body,
      }
    },
  })

  assert.equal(notification.title, record.message)
  assert.ok(notification.body.includes("/remind list"))
  assert.ok(!notification.body.includes(record.session.path))
  assert.ok(!notification.body.includes(record.session.id))
  assert.ok(!notification.body.includes(record.id))
  assert.ok(!notification.body.includes(directory))
  assert.equal((await loadState(directory)).reminders[0].session.path, record.session.path)
})

test("overdue catch-up batches reminders once under concurrent dispatch, without invoking remembered tasks", async (t) => {
  const directory = await isolated(t)
  for (let index = 0; index < 8; index++) {
    await createReminder(
      prepared(directory, `$(touch /not-executed) task ${index}`),
      directory,
      now
    )
  }
  const notifications = []
  const notify = async (title, body) => {
    notifications.push({
      title,
      body,
    })
    await new Promise((done) => setTimeout(done, 30))
  }
  const firstDispatch = dispatch(directory, {
    now: due,
    notify,
  })
  const secondDispatch = dispatch(directory, {
    now: due,
    notify,
  })
  const results = await Promise.all([firstDispatch, secondDispatch])
  assert.equal(
    results.reduce((total, result) => total + result.delivered, 0),
    8
  )
  assert.equal(notifications.length, 1)
  assert.match(notifications[0].body, /\$\(touch \/not-executed\)/u)
  assert.equal(
    (await loadState(directory)).reminders.filter((record) => record.status === "delivered").length,
    8
  )
  assert.deepEqual(
    await dispatch(directory, {
      now: due,
      notify,
    }),
    {
      delivered: 0,
    }
  )
  assert.equal((await returningReminders(directory, due)).length, 8)
  assert.equal((await returningReminders(directory, due)).length, 0)
})

test("notification failures and interrupted claims are uncertain until an explicit retry", async (t) => {
  const directory = await isolated(t)
  const first = await createReminder(prepared(directory), directory, now)
  await assert.rejects(
    dispatch(directory, {
      now: due,
      notify: () => {
        throw new Error("Desktop unavailable")
      },
    }),
    /Desktop unavailable/u
  )
  let calls = 0
  const notify = () => {
    calls++
  }
  await dispatch(directory, {
    now: due,
    notify,
  })
  assert.equal(calls, 0)
  assert.equal((await loadState(directory)).reminders[0].status, "uncertain")
  await changeReminder(first.id, "retry", directory)
  await dispatch(directory, {
    now: due,
    notify,
  })
  assert.equal(calls, 1)

  const second = await createReminder(prepared(directory), directory, now)
  await withStore(directory, async (state, save) => {
    state.reminders.find((record) => record.id === second.id).status = "delivering"
    await save(state)
  })
  await dispatch(directory, {
    now: due,
    notify,
  })
  assert.equal(calls, 1)
  assert.equal((await loadState(directory)).reminders[1].status, "uncertain")
})

test("off prevents delivery and new saves; unavailable or replaced sessions never produce resume commands", async (t) => {
  const directory = await isolated(t)
  const record = await createReminder(prepared(directory), directory, now)
  assert.match(await resumeInstructions(record), /unavailable/u)
  await writeFile(
    record.session.path,
    `${JSON.stringify({
      type: "session",
      id: "different-session",
    })}\n`
  )
  assert.match(await resumeInstructions(record), /identity changed/u)
  const titleSlot = JSON.stringify({
    type: "title",
    title: "Original session",
  })
  const sessionHeader = JSON.stringify({
    type: "session",
    id: record.session.id,
  })
  await writeFile(record.session.path, `${titleSlot}\n${sessionHeader}\n`)
  assert.match(await resumeInstructions(record), /omp --session/u)
  await withStore(directory, async (state, save) => {
    state.isEnabled = false
    await save(state)
  })
  await assert.rejects(createReminder(prepared(directory), directory, now), /off/u)
  await dispatch(directory, {
    now: due,
    notify: () => assert.fail("Off must not notify"),
  })
  assert.equal((await loadState(directory)).reminders[0].status, "pending")
})

test("malformed state fails closed without overwriting the durable file", async (t) => {
  const directory = await isolated(t)
  const contents = '{"version":2,"reminders":[]}'
  await writeFile(join(directory, "state.json"), contents)
  await assert.rejects(dispatch(directory), /Invalid reminder state/u)
  assert.equal(await readFile(join(directory, "state.json"), "utf8"), contents)
})
