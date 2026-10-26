import { requireEvery, requireText } from "./verify-skill-workflows-assertions.mjs"

export function verifyReviewProcedures({ read, fail }) {
  const commentResolutionWorkflow = read(
    "docs/workflows/pull-request-comment-resolution-workflow.md"
  )

  const pullRequestWorkflow = read("skills/pull-request-management/workflow.md")

  requireEvery(
    commentResolutionWorkflow,
    [
      "react with `+1`",
      "react with `-1`",
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
      "resolveReviewThread",
      "reviewThread.isResolved",
      "After every fixup commit",
    ],
    (requiredText) => `comment resolution workflow must require ${requiredText}`,
    fail
  )
  requireEvery(
    commentResolutionWorkflow,
    [
      "inspect the complete PR diff for the same underlying issue",
      "dedicated `:ok_hand:` commit",
      "PR scope checked",
    ],
    (requiredText) => `comment resolution workflow must require ${requiredText}`,
    fail
  )

  const authoritativePullRequestWorkflow = read(
    "docs/workflows/pull-request-management-workflow.md"
  )
  const pullRequestWorkflowVariants = [
    ["authoritative pull request workflow", authoritativePullRequestWorkflow],
    ["packaged pull request workflow", pullRequestWorkflow],
  ]
  for (const [name, workflow] of pullRequestWorkflowVariants) {
    requireEvery(
      workflow,
      ["react `+1`", "react `-1`", "reviewThread.isResolved"],
      (requiredText) => `${name} must require review reaction verification: ${requiredText}`,
      fail
    )
    requireEvery(
      workflow,
      [
        "gh api --method PUT",
        "pulls/$number/merge-async",
        '-f sha="$head_sha"',
        '-f merge_method="$method"',
        "-f merge_action=default",
        "details.uuid",
        "pending",
        "enqueued",
        "merged",
        "failed",
        "max_attempts=60",
        "Last response",
      ],
      (requiredText) =>
        `${name} must provide executable asynchronous stacked-merge guidance: ${requiredText}`,
      fail
    )

    if (workflow.includes("Keep the PR `BLOCKED` and do not merge while")) {
      fail(`${name} must not impose an unconditional blocked merge gate`)
    }
    if (
      workflow.includes(
        "Resolve every actionable review finding or comment before marking the PR ready or merging."
      )
    ) {
      fail(`${name} must qualify merge resolution as the default`)
    }
    if (/^#{1,6} (?:Verification|Evidence)\b/im.test(workflow)) {
      fail(`${name} must not prescribe reviewer-facing Verification or Evidence sections`)
    }
    if (
      !workflow.includes("inspect the complete PR diff for the same underlying issue") ||
      !workflow.includes("dedicated `:ok_hand:` commit") ||
      !workflow.includes("PR scope checked")
    ) {
      fail(`${name} must preserve review-derived correction history`)
    }
  }

  requireText(
    pullRequestWorkflow,
    "upload-pr-screenshots-workflow.md",
    "packaged pull request workflow must link the screenshot upload workflow",
    fail
  )
  requireEvery(
    commentResolutionWorkflow,
    [
      "Fix every actionable review finding or comment",
      "After a fixup, re-review the complete PR diff",
    ],
    (requiredText) => `comment resolution workflow must require ${requiredText}`,
    fail
  )

  const githubToolingReference = read("docs/references/github-tooling-reference.md")
  requireEvery(
    githubToolingReference,
    [
      "does not provide a public upload endpoint that hosts a local screenshot",
      "For non-UI GitHub administration",
      "prefer an authenticated `gh`/GitHub API path when available",
      "A signed-out browser session does not make API-backed work `BLOCKED`",
      "After an API mutation, perform a fresh API read that confirms the intended remote state",
      "repository.pullRequest.projectCards",
      "gh api -X PATCH repos/OWNER/REPOSITORY/pulls/NUMBER",
      "Do not pass shell-sensitive Markdown inline",
      "Reserve browser authentication blockers for explicit browser UI validation",
    ],
    (requiredText) => `github tooling reference must document ${requiredText}`,
    fail
  )
}
