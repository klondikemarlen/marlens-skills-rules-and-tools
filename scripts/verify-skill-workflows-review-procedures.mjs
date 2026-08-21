import { requireEvery, requireText } from "./verify-skill-workflows-assertions.mjs"

function normalizePullRequestWorkflow(workflow) {
  return workflow
    .replace(
      /\n\s+(?:When\s+the\s+follow-up\s+work\s+resolves\s+review\s+comments,\s+use\s+`docs\/workflows\/pull-request-comment-resolution-workflow\.md`\s+and\s+restore\s+ready-for-review\s+status\s+after\s+resolved\s+thread\s+state\s+is\s+verified\s+unless\s+the\s+PR\s+was\s+intentionally\s+left\s+draft\.|After\s+follow-up\s+work\s+resolves\s+review\s+comments,\s+verify\s+every\s+addressed\s+thread\s+is\s+resolved,\s+restore\s+ready-for-review\s+status\s+unless\s+the\s+PR\s+was\s+intentionally\s+left\s+draft,\s+and\s+re-check\s+the\s+remote\s+PR\s+state\s+before\s+reporting\s+it\s+ready\.)/u,
      "\n   [follow-up review state]"
    )
    .replace(/\n\s+Use\s+`github-review-thread resolve[\s\S]*?checks\s+pass\./u, "")
    .replace(
      "the packaged `../../docs/workflows/upload-pr-screenshots-workflow.md`",
      "`docs/workflows/upload-pr-screenshots-workflow.md`"
    )
    .replace(
      "`docs/workflows/upload-pr-screenshots-workflow.md` workflow for upload",
      "`docs/workflows/upload-pr-screenshots-workflow.md` for upload"
    )
    .replace(
      "../../docs/references/engineering-techniques-reference.md",
      "../references/engineering-techniques-reference.md"
    )
}

export function verifyReviewProcedures({ read, fail }) {
  const commentResolutionWorkflow = read(
    "docs/workflows/pull-request-comment-resolution-workflow.md"
  )
  requireText(
    commentResolutionWorkflow,
    "temporarily draft",
    "comment resolution workflow must distinguish temporary draft state",
    fail
  )
  requireText(
    commentResolutionWorkflow,
    "mark it ready for review again",
    "comment resolution workflow must restore ready-for-review status after resolved follow-up threads",
    fail
  )
  requireText(
    commentResolutionWorkflow,
    "Re-check the remote PR state",
    "comment resolution workflow must verify remote PR state before reporting ready",
    fail
  )

  const pullRequestWorkflow = read("skills/pull-request-management/workflow.md")
  requireText(
    pullRequestWorkflow,
    "restore ready-for-review status unless the PR was intentionally left draft",
    "packaged pull request workflow must include self-contained restored ready-for-review guidance",
    fail
  )

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
        "After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default",
        "Wait only for specifically required end-user testing the agent cannot perform",
        "If the user explicitly requests a waiver, drop, or cleanup",
        "record the missing evidence",
      ],
      (requiredText) => `${name} must require ${requiredText}`,
      fail
    )
    requireEvery(
      workflow,
      [
        "Review and QA status",
        "Testing instructions: runnable steps a reviewer can execute without branch-author context.",
        "Do not add reviewer-facing `Verification` or `Evidence` sections",
        "one clearly labeled PR comment or linked traceable artifact",
        "material findings, decisions, limitations, fixups, blockers",
        "Self-review the complete PR diff",
        "Run targeted QA for the user-visible changed behavior",
        "Resolve every actionable review finding or comment",
        "Keep the PR `BLOCKED`",
        "Learner coverage: a concise triage outcome for each non-learner-authored issue",
        "`PASS`, `FAIL`, and `BLOCKED` outcomes",
        "After creating or updating a PR body, read the PR from GitHub",
        "A local draft or body artifact is input only",
      ],
      (requiredText) => `${name} must require ${requiredText}`,
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

  if (
    normalizePullRequestWorkflow(authoritativePullRequestWorkflow) !==
    normalizePullRequestWorkflow(pullRequestWorkflow)
  ) {
    fail(
      "pull request workflow and packaged fallback must stay synchronized except for self-contained path and review-helper guidance"
    )
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
      "Keep the PR `BLOCKED`",
    ],
    (requiredText) => `comment resolution workflow must require ${requiredText}`,
    fail
  )

  const uploadScreenshotsWorkflow = read("docs/workflows/upload-pr-screenshots-workflow.md")
  requireEvery(
    uploadScreenshotsWorkflow,
    [
      "addImageToGitHubMarkdownEditor",
      "editorSelector",
      "fileInputSelector",
      "user-attachments/assets",
      "not already present before upload",
      "verify that exact staged copy is readable before Browser upload",
      "REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL",
      "After the web upload has produced a URL, API text edits may update PR/comment Markdown",
      "copy each upload image to `~/Downloads`",
      "existing PR body editor—not the temporary new-comment composer",
      "one stable HTML-comment placeholder per screenshot",
      "Submit the PR body form, reload the persisted target",
      "confirm each image appears directly after its reviewer-facing caption and route",
      "If GitHub appended an attachment elsewhere, use `gh api` only after the web upload has produced its URL",
      "Keep QA logs, local file paths, and internal verification evidence out of the PR body",
      "github_pr_screenshot_upload_path",
      "uploadPullRequestCommentScreenshots",
      "#issuecomment-…",
      "not a `raw.githubusercontent.com` URL",
    ],
    (requiredText) => `upload screenshot workflow must document ${requiredText}`,
    fail
  )
  if (uploadScreenshotsWorkflow.includes("prefer the GitHub REST API")) {
    fail(
      "upload screenshot workflow must not present REST as the primary local screenshot upload path"
    )
  }

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
