import { readJsonFile } from "./read-json.js"
import { renderAssessment } from "./render.js"
import { createSnapshot } from "./snapshot.js"
import { validateAssessment } from "./validate.js"
import { parseCommand, USAGE } from "./options.js"
import { readWithGh } from "./github-read.js"

export async function runCli(argv, dependencies = {}) {
  const writeOutput = dependencies.writeOutput ?? ((text) => process.stdout.write(text))
  const writeError = dependencies.writeError ?? ((text) => process.stderr.write(text))
  const read = dependencies.read ?? readWithGh

  try {
    const { command, options } = parseCommand(argv)
    if (command === "help") {
      writeOutput(USAGE)
      return 0
    }

    if (command === "snapshot") {
      const snapshot = await createSnapshot({
        repository: options["--repo"],
        issueNumber: options["--issue"],
        search: options["--search"],
        read,
      })
      writeOutput(`${JSON.stringify(snapshot, null, 2)}\n`)
      return 0
    }

    const snapshot = await readJsonFile(options["--snapshot"], "snapshot")
    const assessment = await readJsonFile(options["--assessment"], "assessment")
    validateAssessment(snapshot, assessment)

    if (command === "validate") {
      writeOutput(
        `${JSON.stringify({
          valid: true,
          snapshotId: snapshot.id,
          repository: snapshot.repository,
          issueNumber: snapshot.issue.number,
          readiness: assessment.readiness,
        })}\n`
      )
      return 0
    }

    writeOutput(renderAssessment(snapshot, assessment))
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket triage failed."
    writeError(`ticket-triage: ${message}\n`)
    return 1
  }
}
