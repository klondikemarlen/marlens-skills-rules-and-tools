import { isAbsolute, resolve } from "node:path"
import { captureConventions } from "./source.js"

const HELP = `Usage:
  conventions-memory export --source CLONE
  conventions-memory sync --source CLONE --database ABSOLUTE_PATH [--apply]

Import committed MSSRT Markdown through Mnemopi 18.16.0's native API.
Requires Bun >=1.4.4. Git HEAD is authoritative; uncommitted changes are not imported.
export prints a native Mnemopi JSON export without opening a database.
sync without --apply previews the source only; it does not inspect or open the database.
--apply adds/refreshes importer-owned sections and retires removed sections.
Unrelated conversational memories are preserved. No OMP settings are changed.
Use the intended OMP bank's database path explicitly, then start a fresh OMP session.
`

export async function runCli(args, stdout = process.stdout, stderr = process.stderr) {
  try {
    if (args.length === 0 || (args.length === 1 && args[0] === "--help")) {
      stdout.write(HELP)
      return 0
    }
    const [command, ...rest] = args
    if (!["export", "sync"].includes(command)) throw new Error("Expected export or sync")

    const options = {}
    for (let index = 0; index < rest.length; index++) {
      const name = rest[index]
      if (!["--source", "--database", "--apply"].includes(name) || Object.hasOwn(options, name)) {
        throw new Error(`Unknown or repeated option: ${name}`)
      }
      if (name === "--apply") options[name] = true
      else {
        const value = rest[++index]
        if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`)
        options[name] = value
      }
    }
    if (!options["--source"]) throw new Error("--source is required")
    if (command === "export" && (options["--database"] || options["--apply"])) {
      throw new Error("export does not accept --database or --apply")
    }
    if (command === "sync" && (!options["--database"] || !isAbsolute(options["--database"]))) {
      throw new Error("sync requires an absolute --database path")
    }
    const captured = captureConventions(options["--source"])
    if (command === "export") {
      stdout.write(
        `${JSON.stringify({ mnemopi_export: { version: "1.0", component: "beam" }, working_memory: captured.records }, null, 2)}\n`
      )
      return 0
    }
    const database = resolve(options["--database"])
    if (!options["--apply"]) {
      stdout.write(
        `${JSON.stringify({ result: "preview", revision: captured.revision, files: captured.paths.length, sections: captured.records.length, database, destinationInspected: false })}\n`
      )
      return 0
    }
    const { synchronizeConventions } = await import("./sync.js")
    stdout.write(
      `${JSON.stringify({ result: "synchronized", ...synchronizeConventions(database, captured) })}\n`
    )
    return 0
  } catch (error) {
    stderr.write(`conventions-memory: ${error.message}\n`)
    return 1
  }
}
