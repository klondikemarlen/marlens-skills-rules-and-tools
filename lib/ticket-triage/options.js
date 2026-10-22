const REPOSITORY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/(?!\.{1,2}$)[a-zA-Z0-9._-]{1,100}$/

export const USAGE = `Usage:
  triage snapshot --repo OWNER/REPO --issue NUMBER [--search TEXT]
  triage validate --snapshot FILE --assessment FILE
  triage render --snapshot FILE --assessment FILE

Commands:
  snapshot   Capture a read-only GitHub issue snapshot as JSON on stdout.
  validate   Validate a snapshot and assessment JSON pair without network access.
  render     Validate the pair and print compact advisory Markdown.

Snapshot capture requires an authenticated GitHub CLI (gh auth login). It uses GET requests only.
No command writes to GitHub or creates local files.
Use --help with any command to show this help.
`

const COMMAND_OPTIONS = {
  snapshot: new Set(["--repo", "--issue", "--search"]),
  validate: new Set(["--snapshot", "--assessment"]),
  render: new Set(["--snapshot", "--assessment"]),
}

function parseOptions(argumentsList, acceptedOptions) {
  const options = {}
  for (let index = 0; index < argumentsList.length; index += 1) {
    const option = argumentsList[index]
    if (!acceptedOptions.has(option)) throw new Error(`Unknown option: ${option}`)
    if (Object.hasOwn(options, option))
      throw new Error(`Option ${option} may be supplied only once.`)
    const value = argumentsList[index + 1]
    if (value === undefined || value.startsWith("--"))
      throw new Error(`Option ${option} requires a value.`)
    options[option] = value
    index += 1
  }
  return options
}

export function parseCommand(argv) {
  if (!Array.isArray(argv)) throw new Error("Command arguments must be an array.")
  if (argv.includes("--help") || argv[0] === "help" || argv.length === 0) return { command: "help" }

  const command = argv[0]
  if (!Object.hasOwn(COMMAND_OPTIONS, command)) throw new Error(`Unknown command: ${command}`)
  const options = parseOptions(argv.slice(1), COMMAND_OPTIONS[command])

  if (command === "snapshot") {
    if (!options["--repo"] || !REPOSITORY_PATTERN.test(options["--repo"]))
      throw new Error("Use --repo OWNER/REPO with a valid GitHub repository name.")
    if (!options["--issue"])
      throw new Error("Use --issue with a positive whole-number issue number.")
    if (options["--search"] !== undefined) {
      const search = options["--search"]
      if (search.trim().length === 0 || search.length > 200)
        throw new Error("--search must contain 1 to 200 plain-text characters.")
      if (/[\u0000-\u001f\u007f]/u.test(search))
        throw new Error("--search cannot contain control characters.")
    }
  } else if (!options["--snapshot"] || !options["--assessment"]) {
    throw new Error(`Use --snapshot FILE and --assessment FILE with ${command}.`)
  }

  return { command, options }
}
