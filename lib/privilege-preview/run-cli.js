import process from "node:process"
import { TextDecoder } from "node:util"

import { runPreview } from "./run-preview.js"
import { MAX_REQUEST_BYTES } from "./validate-request.js"

const HELP = `Usage: privilege-preview [--demo] [--expires-in SECONDS]

Read one JSON request from stdin and show native GNOME context before a privilege
or credential request. Required fields: target: [{label,value}], reason, context:
{agent,task,whatHappened,completionEffect,repository?}, and command:
{executable: absolute path, arguments: string[], cwd: absolute existing directory}.
Optional execution: "administrator" (default) or "current-user".

  --demo                Show a safe built-in example; ignore stdin and never execute.
  --expires-in SECONDS  Expire unanswered approval after 30–86400 seconds (default: 1800).
  --help                Print this help without opening a window.

Requires a non-root desktop session and Python GTK4/libadwaita.
Administrator mode uses pkexec with a system polkit authentication agent and a
minimal PATH/LANG environment. Cached polkit authorization may skip a password prompt.
Current-user mode runs as the invoking user without pkexec, inheriting that user's
environment, including HOME, GNUPGHOME, and desktop integration. No request
environment overrides are accepted.
Only OS/application native UI collects credentials; this preview never does.
It does not intercept arbitrary credential popups or change policy or credential caches.
Approval executes the exact executable, argv, and cwd without a shell. Caller owns
the operation's safety; this tool is not a sandbox or a filesystem race guard.
Frozen command text does not pin executable or target-file contents.

One final JSON result is written to stdout. Command stdout and stderr stream to
stderr. In administrator mode, a nonzero pkexec status cannot distinguish
authorization failure from a command failure. After execution starts, interruption
cannot guarantee that the command stopped in either mode. No authentication retry
or terminal fallback occurs.
Exit codes: 0 completed/demo; 1 error/execution failure; 2 invalid input;
3 cancelled; 4 expired; 130 interrupted (SIGINT); 143 interrupted (SIGTERM).
`

export async function runCli(argumentsList) {
  let options
  try {
    options = parseOptions(argumentsList)
  } catch (error) {
    return printError(error, 2)
  }
  if (options.help) {
    process.stdout.write(HELP)
    return 0
  }
  if (typeof process.getuid !== "function" || process.getuid() === 0)
    return printError(new Error("privilege-preview requires a non-root Linux desktop session."), 1)

  const abortController = new AbortController()
  let interruptedSignal
  const interrupt = (signalName) => {
    interruptedSignal = signalName
    abortController.abort()
  }
  const onInterrupt = () => interrupt("SIGINT")
  const onTerminate = () => interrupt("SIGTERM")
  process.once("SIGINT", onInterrupt)
  process.once("SIGTERM", onTerminate)

  try {
    let request
    try {
      request = options.demo
        ? demoRequest()
        : await readRequest(process.stdin, abortController.signal)
    } catch (error) {
      if (!abortController.signal.aborted) return printError(error, 2)
    }
    const status = abortController.signal.aborted
      ? { result: "interrupted", executionMayContinue: false }
      : await runPreview(request, { ...options, signal: abortController.signal })
    process.stdout.write(`${JSON.stringify(status)}\n`)
    switch (status.result) {
      case "command-completed":
      case "demo-completed":
        return 0
      case "cancelled":
        return 3
      case "expired":
        return 4
      case "interrupted":
        return interruptedSignal === "SIGTERM" ? 143 : 130
      default:
        return 1
    }
  } catch (error) {
    return printError(error, 2)
  } finally {
    process.removeListener("SIGINT", onInterrupt)
    process.removeListener("SIGTERM", onTerminate)
  }
}

function parseOptions(argumentsList) {
  const options = { demo: false }
  const seen = new Set()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (seen.has(argument)) throw new Error(`Duplicate option: ${argument}`)
    seen.add(argument)
    if (argument === "--help") options.help = true
    else if (argument === "--demo") options.demo = true
    else if (argument === "--expires-in") {
      const value = argumentsList[index + 1]
      if (!value || !/^[0-9]+$/u.test(value) || Number(value) < 30 || Number(value) > 86_400)
        throw new Error("--expires-in requires an integer between 30 and 86400 seconds.")
      options.expiresInSeconds = Number(value)
      index += 1
    } else throw new Error(`Unknown option: ${argument}`)
  }
  return options
}

async function readRequest(input, signal) {
  const chunks = []
  let size = 0
  const interruptInput = () => input.destroy(new Error("Input interrupted."))
  signal.addEventListener("abort", interruptInput, { once: true })
  try {
    for await (const chunk of input) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.length
      if (size > MAX_REQUEST_BYTES) throw new Error("Request exceeds 65536 bytes.")
      chunks.push(bytes)
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
    return JSON.parse(text)
  } finally {
    signal.removeEventListener("abort", interruptInput)
  }
}

function demoRequest() {
  return {
    target: [{ label: "Project", value: "Example Project · Git Setup" }],
    reason:
      "Administrator access would let Ubuntu install Git and its required dependencies. Then I could check out the project.",
    context: {
      agent: "Privilege Preview Demo",
      task: "Download the example project's source code.",
      whatHappened:
        "The repository has been selected, but this example machine cannot download it because Git is not installed.",
      completionEffect:
        "Git would be available to download the repository. Demo mode never authenticates or runs the command.",
    },
    command: { executable: "/usr/bin/apt-get", arguments: ["install", "git"], cwd: "/" },
  }
}

function printError(error, exitCode) {
  process.stdout.write(`${JSON.stringify({ result: "error", message: error.message })}\n`)
  return exitCode
}
