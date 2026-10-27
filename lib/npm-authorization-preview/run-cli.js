import process from "node:process"
import { TextDecoder } from "node:util"

import { openInDefaultBrowser } from "./open-in-default-browser.js"
import {
  DEFAULT_PREVIEW_TTL_MS,
  MAX_PREVIEW_TTL_MS,
  startPreviewServer,
} from "./start-preview-server.js"
import { validateRequest } from "./validate-request.js"

const MAX_INPUT_BYTES = 64 * 1_024
const DEFAULT_EXPIRY_SECONDS = DEFAULT_PREVIEW_TTL_MS / 1_000
const MIN_EXPIRY_SECONDS = 30
const MAX_EXPIRY_SECONDS = MAX_PREVIEW_TTL_MS / 1_000

export const USAGE = `Usage: npm-authorization-preview [--manual] [--expires-in SECONDS]

Read one JSON request from stdin. By default, open the local preview with the
operating system's normal-browser opener. --manual prints a private loopback URL
without opening a browser; it expires after 30–900 seconds (default 300).

A local Continue result is not proof of npm sign-in, approval, or publication.
`

export async function runCli(argv) {
  const writeOutput = (text) => process.stdout.write(text)
  const writeError = (text) => process.stderr.write(text)

  try {
    const options = parseOptions(argv)
    if (options.help) {
      writeOutput(USAGE)
      return 0
    }

    const input = process.stdin
    if (input.isTTY) throw new Error("Provide one structured JSON request on stdin.")
    const request = validateRequest(await readJsonInput(input))
    const signalController = new AbortController()
    let signalExitCode = 0
    const handleSigint = () => {
      signalExitCode = 130
      signalController.abort()
    }
    const handleSigterm = () => {
      signalExitCode = 143
      signalController.abort()
    }
    process.once("SIGINT", handleSigint)
    process.once("SIGTERM", handleSigterm)

    let result
    try {
      result = await runPreview(request, {
        manual: options.manual,
        ttlMs: options.expiresInSeconds * 1_000,
        writeOutput,
        signal: signalController.signal,
      })
    } finally {
      process.removeListener("SIGINT", handleSigint)
      process.removeListener("SIGTERM", handleSigterm)
    }

    writeOutput(
      `${JSON.stringify({
        result: result.result,
        providerCompletion: result.result === "continued" ? "unverified" : "not-attempted",
      })}\n`
    )
    if (result.result === "launch-failed") {
      writeError(
        "npm-authorization-preview: normal-browser opening failed; no npm page was opened.\n"
      )
      return 1
    }
    return signalExitCode || 0
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed."
    writeError(`npm-authorization-preview: ${message}\n`)
    return 1
  }
}

async function runPreview(request, { manual, ttlMs, writeOutput, signal }) {
  const session = await startPreviewServer(request, { ttlMs, ready: manual })
  let openerController
  let openerPromise
  const onAbort = () => void session.close()

  if (signal?.aborted) await session.close()
  else signal?.addEventListener("abort", onAbort, { once: true })

  try {
    if (signal?.aborted) return await session.completion

    if (manual) {
      writeOutput(
        `${JSON.stringify({
          result: "preview-ready",
          previewUrl: session.previewUrl,
          expiresInSeconds: ttlMs / 1_000,
        })}\n`
      )
    } else {
      openerController = new AbortController()
      openerPromise = Promise.resolve().then(() =>
        openInDefaultBrowser(session.previewUrl, { signal: openerController.signal })
      )
      const launchState = await Promise.race([
        openerPromise.then(
          () => ({ kind: "opened" }),
          () => ({ kind: "failed" })
        ),
        session.completion.then((result) => ({ kind: "finished", result })),
      ])

      if (launchState.kind === "finished") {
        openerController.abort()
        await openerPromise.catch(() => {})
        return launchState.result
      }
      if (launchState.kind === "failed") {
        await session.failLaunch()
        return await session.completion
      }
      session.markReady()
    }

    return await session.completion
  } finally {
    signal?.removeEventListener("abort", onAbort)
    await session.close()
    if (openerController && openerPromise) {
      openerController.abort()
      await openerPromise.catch(() => {})
    }
  }
}

function parseOptions(argv) {
  const options = {
    help: false,
    manual: false,
    expiresInSeconds: DEFAULT_EXPIRY_SECONDS,
    expiryWasSet: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--help") {
      if (argv.length !== 1) throw new Error("--help cannot be combined with other options.")
      options.help = true
      return options
    }
    if (argument === "--manual") {
      if (options.manual) throw new Error("--manual may be supplied only once.")
      options.manual = true
      continue
    }
    if (argument === "--expires-in") {
      if (options.expiryWasSet) throw new Error("--expires-in may be supplied only once.")
      options.expiryWasSet = true
      const value = argv[index + 1]
      if (!value || !/^\d+$/u.test(value))
        throw new Error("--expires-in requires an integer number of seconds.")
      const seconds = Number(value)
      if (
        !Number.isSafeInteger(seconds) ||
        seconds < MIN_EXPIRY_SECONDS ||
        seconds > MAX_EXPIRY_SECONDS
      )
        throw new Error("--expires-in must be between 30 and 900 seconds.")
      options.expiresInSeconds = seconds
      index += 1
      continue
    }
    throw new Error(`Unknown option: ${argument}`)
  }
  return options
}

async function readJsonInput(input) {
  const chunks = []
  let totalBytes = 0
  for await (const chunk of input) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += bytes.length
    if (totalBytes > MAX_INPUT_BYTES)
      throw new Error("The JSON request exceeds the 64 KiB input limit.")
    chunks.push(bytes)
  }

  let text
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
  } catch {
    throw new Error("stdin must contain valid UTF-8 JSON.")
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error("stdin must contain one valid JSON request.")
  }
}

export default runCli
