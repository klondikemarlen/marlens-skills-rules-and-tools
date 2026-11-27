import { requireEvery, requireText } from "./verify-skill-workflows-assertions.mjs"

export function verifyReviewProcedures({ read, fail }) {
  verifyMergeEntrypoints({ read, fail })

  const commentResolutionWorkflow = read(
    "docs/workflows/pull-request-comment-resolution-workflow.md"
  )

  const pullRequestWorkflow = read("skills/pr/workflow.md")

  requireEvery(
    commentResolutionWorkflow,
    [
      "react with `+1`",
      "react with `-1`",
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
      "resolveReviewThread",
      "reviewThread.isResolved",
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
        "When revising previously corrected behavior, check its history before editing.",
        "git blame -L <start>,<end> -- <file>",
        "git log --follow -- <file>",
        "git show <commit> -- <path-at-that-commit>",
        "consult the linked review when the reason is unclear",
        "scoped to the touched behavior, separate from the current PR recurrence check",
        "surface the conflict explicitly",
        "unless an accepted new requirement supersedes it",
      ],
      (requiredText) => `${name} must preserve prior corrections with scoped history: ${requiredText}`,
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
  }

  requireText(
    pullRequestWorkflow,
    "upload-pr-screenshots-workflow.md",
    "packaged pull request workflow must link the screenshot upload workflow",
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

function verifyMergeEntrypoints({ read, fail }) {
  for (const [owner, entry] of [
    ["docs/workflows/feature-workflow.md", "../../skills/autonomous-merge/SKILL.md"],
    ["skills/feature/workflow.md", "../autonomous-merge/SKILL.md"],
    ["docs/workflows/evolve-workflow.md", "../../skills/autonomous-merge/SKILL.md"],
    ["skills/evolve/workflow.md", "../autonomous-merge/SKILL.md"],
  ]) {
    requireText(
      read(owner),
      `[Autonomous Merge](${entry})`,
      `${owner} must select the discoverable autonomous merge entrypoint`,
      fail
    )
  }

  for (const [name, decision] of [
    ["autonomous-merge", "A correction does not create an extra manual re-review hold"],
    [
      "review-and-merge",
      "If corrections were required and there is no explicit post-fix merge authority",
    ],
  ]) {
    for (const [workflow, shared] of [
      [`docs/workflows/${name}-workflow.md`, "verified-merge-workflow.md"],
      [`skills/${name}/workflow.md`, "../../docs/workflows/verified-merge-workflow.md"],
    ]) {
      const guidance = read(workflow)
      requireText(
        guidance,
        `[shared verified merge procedure](${shared})`,
        `${workflow} must use the common merge gates`,
        fail
      )
      requireText(
        guidance,
        decision,
        `${workflow} must preserve its own corrected-head decision`,
        fail
      )
    }
  }

  requireEvery(
    read("docs/workflows/verified-merge-workflow.md"),
    [
      "base branch and SHA, and head repository, branch, and SHA",
      "obtain fresh applicable verification, named review, and CI",
      "A required approval is a gate even if the host does not enforce it",
      "Do not merge, enable auto-merge, or enqueue",
      "--match-head-commit <SHA>",
    ],
    (requiredText) => `shared merge procedure must require ${requiredText}`,
    fail
  )
}
