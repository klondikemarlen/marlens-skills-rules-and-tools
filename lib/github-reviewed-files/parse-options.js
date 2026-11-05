export const USAGE = `Usage: github-reviewed-files --repo OWNER/REPOSITORY --pr NUMBER
  --viewer LOGIN --head FULL_OID --path EXACT_PATH [--path EXACT_PATH ...]
  [--dry-run | --mark-viewed]

Reads GitHub by default; only --mark-viewed permits writes. Repeat --path for
caller-approved, reviewed and verified repository-relative paths (including removed
files). No glob expansion, rename aliases, bulk selection, unmark, approval or merge.
Use --path=VALUE for a literal path beginning with --.
Authenticate using existing gh auth login or GH_TOKEN/GITHUB_TOKEN credentials.
Output: JSON target, viewer, head, per-file state/proposed action and outcomes.
Exit 0: inspection complete or all selected markers confirmed; 1: rejected,
partial, failed, raced or unconfirmed; 2: invalid arguments. --help exits 0.
Mutation has no expected-head input: checks are not atomic or revision-conditioned.
A marker result is not review/test PASS and cannot guarantee future head stability.`

export function parseOptions(argv) {
  const options = { paths: [], mutate: false }
  const values = new Map([
    ["--repo", "repository"],
    ["--pr", "pullRequest"],
    ["--viewer", "viewer"],
    ["--head", "head"],
  ])
  let mode
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--help") {
      if (argv.length !== 1) throw new Error("Use --help alone.")
      return { help: true }
    }
    if (argument === "--dry-run" || argument === "--mark-viewed") {
      if (mode) throw new Error("Specify only one of --dry-run or --mark-viewed.")
      mode = argument
      options.mutate = argument === "--mark-viewed"
      continue
    }
    if (argument.startsWith("--path=")) {
      options.paths.push(argument.slice("--path=".length))
      continue
    }
    const key = values.get(argument)
    if (!key && argument !== "--path") throw new Error(`Unknown argument: ${argument}`)
    const value = argv[++index]
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.`)
    if (argument === "--path") options.paths.push(value)
    else {
      if (options[key] !== undefined) throw new Error(`Duplicate option: ${argument}`)
      options[key] = value
    }
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repository ?? "")) {
    throw new Error("Require explicit --repo OWNER/REPOSITORY.")
  }
  if (
    !/^[1-9]\d*$/.test(options.pullRequest ?? "") ||
    !Number.isSafeInteger(Number(options.pullRequest))
  ) {
    throw new Error("Require explicit --pr positive integer.")
  }
  options.pullRequest = Number(options.pullRequest)
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(options.viewer ?? "")) {
    throw new Error("Require explicit --viewer GitHub login.")
  }
  if (!/^[a-fA-F0-9]{40}$/.test(options.head ?? "")) {
    throw new Error("Require explicit --head full 40-character reviewed commit OID.")
  }
  options.head = options.head.toLowerCase()
  if (options.paths.length === 0) throw new Error("Require at least one exact --path.")
  const unique = new Set()
  for (const path of options.paths) {
    if (
      path.startsWith("/") ||
      path.includes("\0") ||
      path.split("/").some((part) => !part || part === "." || part === "..")
    ) {
      throw new Error(`Not an exact repository-relative path: ${JSON.stringify(path)}`)
    }
    if (unique.has(path)) throw new Error(`Duplicate approved path: ${JSON.stringify(path)}`)
    unique.add(path)
  }
  return options
}
