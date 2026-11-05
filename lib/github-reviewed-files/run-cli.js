import { callGraphql } from "../github-review-thread/call-graphql.js"
import { resolveToken } from "../github-review-thread/resolve-token.js"
import { parseOptions, USAGE } from "./parse-options.js"
import { reviewedFiles } from "./reviewed-files.js"

export async function runCli(
  argv,
  environment = process.env,
  {
    output = console.log,
    errorOutput = console.error,
    authenticate = resolveToken,
    graphql = callGraphql,
  } = {}
) {
  let options
  try {
    options = parseOptions(argv)
  } catch (error) {
    errorOutput(`github-reviewed-files: ${error.message}\n${USAGE}`)
    return 2
  }
  if (options.help) {
    output(USAGE)
    return 0
  }
  try {
    const token = authenticate(environment)
    if (!token)
      throw new Error(
        "Authenticate with gh auth login or existing GH_TOKEN/GITHUB_TOKEN credentials."
      )
    const result = await reviewedFiles(options, (query, variables) =>
      graphql(query, variables, token)
    )
    output(JSON.stringify(result, null, 2))
    return ["inspected", "confirmed"].includes(result.status) ? 0 : 1
  } catch (error) {
    errorOutput(`github-reviewed-files: ${error.message}`)
    return 1
  }
}
