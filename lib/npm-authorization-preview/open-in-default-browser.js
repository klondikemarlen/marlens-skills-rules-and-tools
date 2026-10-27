import { spawn } from "node:child_process"
import process from "node:process"

const OPEN_TIMEOUT_MS = 10_000
const TERMINATE_TIMEOUT_MS = 1_000

export async function openInDefaultBrowser(url, { signal } = {}) {
  const [command, args] = commandForCurrentPlatform(url)
  let child
  try {
    child = spawn(command, args, { stdio: "ignore", windowsHide: true })
  } catch {
    throw new Error("Could not start the system normal-browser opener.")
  }

  const closed = waitForProcessClose(child)
  const outcome = await waitForOpenResult(closed, signal)
  if (outcome.kind === "closed" && outcome.code === 0) return

  await stopOwnedProcess(child, closed)
  if (outcome.kind === "aborted") throw new Error("Normal-browser opening was cancelled.")
  throw new Error("The system normal-browser opener did not complete successfully.")
}

function commandForCurrentPlatform(url) {
  if (process.platform === "darwin") return ["open", [url]]
  if (process.platform === "win32") return ["rundll32.exe", ["url.dll,FileProtocolHandler", url]]
  return ["xdg-open", [url]]
}

function waitForProcessClose(child) {
  return new Promise((resolve) => {
    child.once("close", (code, signal) => resolve({ kind: "closed", code, signal }))
    child.once("error", () => resolve({ kind: "error" }))
  })
}

function waitForOpenResult(closed, signal) {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => finish({ kind: "timeout" }), OPEN_TIMEOUT_MS)
    const onAbort = () => finish({ kind: "aborted" })

    function finish(outcome) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
      resolve(outcome)
    }

    if (signal?.aborted) finish({ kind: "aborted" })
    else signal?.addEventListener("abort", onAbort, { once: true })
    void closed.then((outcome) => finish(outcome))
  })
}

async function stopOwnedProcess(child, closed) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
  child.kill("SIGTERM")
  const terminated = await waitForCloseOrTimeout(closed, TERMINATE_TIMEOUT_MS)
  if (!terminated) {
    child.kill("SIGKILL")
    await closed
  }
}

function waitForCloseOrTimeout(closed, milliseconds) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), milliseconds)
    void closed.then(() => {
      clearTimeout(timer)
      resolve(true)
    })
  })
}

export default openInDefaultBrowser
