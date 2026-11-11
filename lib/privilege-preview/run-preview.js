import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { MAX_REQUEST_BYTES, validateRequest } from "./validate-request.js"

const DIALOG_PATH = fileURLToPath(new URL("./native-dialog.py", import.meta.url))
const MAX_DIALOG_OUTPUT_BYTES = 4_096

// spawnProcess is the sole process seam: production always uses Node's shell-free spawn.
export function runPreview(
  input,
  {
    demo = false,
    expiresInSeconds = 1_800,
    signal,
    spawnProcess = spawn,
    commandOutput = process.stderr,
  } = {}
) {
  if (Buffer.byteLength(JSON.stringify(input)) > MAX_REQUEST_BYTES)
    throw new Error("Request exceeds 65536 bytes.")
  const request = validateRequest(input)
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 30 || expiresInSeconds > 86_400)
    throw new Error("Expiry must be an integer between 30 and 86400 seconds.")

  return new Promise((resolve) => {
    let dialog
    let executor
    let ready = false
    let decided = false
    let settled = false
    let output = ""
    let outputBytes = 0
    let expiryTimer
    let startupTimer
    let cleanupTimer

    function finish(status) {
      if (settled) return
      settled = true
      clearTimeout(expiryTimer)
      clearTimeout(startupTimer)
      signal?.removeEventListener("abort", interrupt)
      if (dialog && dialog.exitCode === null && dialog.signalCode === null) {
        // EOF also closes the native window; a bounded grace handles an unresponsive GUI.
        dialog.stdin.end(`${JSON.stringify(status)}\n`)
        cleanupTimer = setTimeout(() => dialog.kill("SIGKILL"), 2_000)
        cleanupTimer.unref()
      }
      resolve(status)
    }

    function interrupt() {
      // Once execution starts, interrupting the preview cannot guarantee command cancellation.
      if (executor) executor.unref()
      finish({ result: "interrupted", executionMayContinue: Boolean(executor) })
    }

    function fail(message) {
      if (executor) return
      finish({ result: "error", message })
    }

    function startExecution() {
      try {
        const options = {
          cwd: request.command.cwd,
          // stdout stays machine-readable; command output streams directly to stderr.
          stdio: ["ignore", commandOutput, commandOutput],
          shell: false,
        }
        if (request.execution === "administrator") {
          executor = spawnProcess(
            "/usr/bin/pkexec",
            [
              "--disable-internal-agent",
              "--keep-cwd",
              request.command.executable,
              ...request.command.arguments,
            ],
            { ...options, env: { PATH: "/usr/bin:/bin", LANG: "C.UTF-8" } }
          )
        } else {
          executor = spawnProcess(request.command.executable, request.command.arguments, options)
        }
        executor.once("error", (error) =>
          finish({
            result: "authorization-or-command-failed",
            exitCode: null,
            signal: null,
            message: error.message,
          })
        )
        executor.once("close", (exitCode, exitSignal) =>
          finish({
            result: exitCode === 0 ? "command-completed" : "authorization-or-command-failed",
            exitCode,
            signal: exitSignal,
          })
        )
      } catch (error) {
        finish({
          result: "authorization-or-command-failed",
          exitCode: null,
          signal: null,
          message: error.message,
        })
      }
    }

    function receiveLine(line) {
      if (settled) return
      let event
      try {
        event = JSON.parse(line)
      } catch {
        fail("Native dialog sent invalid JSON.")
        return
      }
      if (
        !event ||
        typeof event !== "object" ||
        Array.isArray(event) ||
        Object.keys(event).length !== 1
      ) {
        fail("Native dialog sent an invalid event.")
        return
      }
      if (event.result === "ready" && !ready && !decided) {
        ready = true
        clearTimeout(startupTimer)
        return
      }
      if (!ready || decided) {
        fail("Native dialog violated the approval protocol.")
        return
      }
      if (!["approved", "cancelled", "expired", "demo-completed"].includes(event.result)) {
        fail("Native dialog sent an unknown result.")
        return
      }
      decided = true
      clearTimeout(expiryTimer)
      if (event.result === "approved") {
        if (demo) {
          fail("Demo mode cannot authorize execution.")
          return
        }
        startExecution()
        return
      }
      if (event.result === "demo-completed" && !demo) {
        fail("Native dialog sent a demo result outside demo mode.")
        return
      }
      finish({ result: event.result })
    }

    if (signal?.aborted) {
      interrupt()
      return
    }
    signal?.addEventListener("abort", interrupt, { once: true })
    try {
      dialog = spawnProcess("/usr/bin/python3", [DIALOG_PATH], {
        stdio: ["pipe", "pipe", "inherit"],
        shell: false,
      })
      dialog.stdin.on("error", () => fail("Native dialog input closed before completion."))
      dialog.once("error", (error) => fail(`Cannot start native dialog: ${error.message}`))
      dialog.once("close", () => {
        clearTimeout(cleanupTimer)
        fail("Native dialog closed without an approval result.")
      })
      dialog.stdout.on("data", (chunk) => {
        outputBytes += Buffer.byteLength(chunk)
        if (outputBytes > MAX_DIALOG_OUTPUT_BYTES) {
          fail("Native dialog exceeded its output limit.")
          return
        }
        output += chunk.toString("utf8")
        let newline
        while ((newline = output.indexOf("\n")) !== -1) {
          const line = output.slice(0, newline)
          output = output.slice(newline + 1)
          receiveLine(line)
        }
      })
      expiryTimer = setTimeout(() => {
        if (!decided) finish({ result: "expired" })
      }, expiresInSeconds * 1_000)
      startupTimer = setTimeout(() => fail("Native dialog did not become ready."), 10_000)
      dialog.stdin.write(`${JSON.stringify({ request, demo, expiresInSeconds })}\n`)
    } catch (error) {
      fail(`Cannot start native dialog: ${error.message}`)
    }
  })
}
