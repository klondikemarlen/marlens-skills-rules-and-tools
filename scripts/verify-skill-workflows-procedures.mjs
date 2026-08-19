function requireText(text, requiredText, message, fail) {
  if (!text.includes(requiredText)) fail(message);
}

function requireEvery(text, requiredTexts, messageFor, fail) {
  for (const requiredText of requiredTexts) {
    requireText(text, requiredText, messageFor(requiredText), fail);
  }
}

export function verifyWorkflowProcedures({ read, fail, alwaysLoadedGuidance }) {
  const commentResolutionWorkflow = read('docs/workflows/pull-request-comment-resolution-workflow.md');
  requireText(commentResolutionWorkflow, 'temporarily draft', 'comment resolution workflow must distinguish temporary draft state', fail);
  requireText(commentResolutionWorkflow, 'mark it ready for review again', 'comment resolution workflow must restore ready-for-review status after resolved follow-up threads', fail);
  requireText(commentResolutionWorkflow, 'Re-check the remote PR state', 'comment resolution workflow must verify remote PR state before reporting ready', fail);

  const pullRequestWorkflow = read('skills/pull-request-management/workflow.md');
  requireText(pullRequestWorkflow, 'restore ready-for-review status unless the PR was intentionally left draft', 'packaged pull request workflow must include self-contained restored ready-for-review guidance', fail);

  requireEvery(commentResolutionWorkflow, [
    'react with `+1`',
    'react with `-1`',
    'POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions',
    'resolveReviewThread',
    'reviewThread.isResolved',
    'After every fixup commit',
  ], requiredText => `comment resolution workflow must require ${requiredText}`, fail);

  requireEvery(commentResolutionWorkflow, [
    'inspect the complete PR diff for the same underlying issue',
    'dedicated `:ok_hand:` commit',
    'PR scope checked',
  ], requiredText => `comment resolution workflow must require ${requiredText}`, fail);

  for (const [name, workflow] of [
    ['authoritative pull request workflow', read('docs/workflows/pull-request-management-workflow.md')],
    ['packaged pull request workflow', pullRequestWorkflow],
  ]) {
    requireEvery(workflow, ['react `+1`', 'react `-1`', 'reviewThread.isResolved'], requiredText => `${name} must require review reaction verification: ${requiredText}`, fail);
    requireEvery(workflow, [
      'After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the PR ready and merge it with a merge commit by default',
      'Wait only for specifically required end-user testing the agent cannot perform',
      'If the user explicitly requests a waiver, drop, or cleanup',
      'record the missing evidence',
    ], requiredText => `${name} must require ${requiredText}`, fail);
    if (workflow.includes('Keep the PR `BLOCKED` and do not merge while')) {
      fail(`${name} must not impose an unconditional blocked merge gate`);
    }
    if (workflow.includes('Resolve every actionable review finding or comment before marking the PR ready or merging.')) {
      fail(`${name} must qualify merge resolution as the default`);
    }
  }

  const featureWorkflow = read('docs/workflows/feature-workflow.md');
  const packagedFeatureWorkflow = read('skills/feature/workflow.md');
  for (const [name, workflow] of [
    ['authoritative feature workflow', featureWorkflow],
    ['packaged feature workflow', packagedFeatureWorkflow],
  ]) {
    requireEvery(workflow, [
      'Open a draft pull request',
      'Self-review the complete PR diff',
      'Run targeted QA for the user-visible changed behavior',
      'in this package that gate includes `node scripts/verify-oversized-source-files.mjs`',
      'material findings, decisions, limitations, fixups, blockers',
      'concise status in the PR body',
      'one clearly labeled PR comment or linked traceable artifact',
      'preserving `PASS`, `FAIL`, and `BLOCKED` outcomes',
      'Resolve every actionable review finding or comment',
      'After a fixup, repeat the complete self-review and targeted QA',
      'Merge verified pull requests by default with a merge commit',
      'After all repository- or platform-enforced review requirements, checks, and actionable feedback are resolved, mark the pull request ready and merge it with a merge commit by default',
      'Wait only when the work specifically requires end-user testing the agent cannot perform',
      'explicit user or maintainer request to waive, drop, or clean up',
      'record the missing evidence',
      'Learner Coverage During Issue Triage',
      'Learner coverage: no action',
      'Learner coverage: propose bug/feature',
      'Learner coverage: filed',
      "Before opening a PR, verify its base is the repository's default branch or a documented release branch.",
      'After merge, fetch and prune remote refs (`git fetch --prune origin`) and check out the intended default/release branch.',
      'Delete the merged issue branch locally and remotely only when it is agent-owned and no longer needed, then fast-forward the default/release branch from origin',
      'Any test-only follow-up must start on an issue-named topic branch before staging or committing',
      'reset it to `origin/main`; never discard unpushed work silently',
      'git status --short --branch',
      'git branch --list',
      'Retain and report user-owned branches instead of deleting them.',
      'Run `git worktree prune` and inspect `git worktree list`',
      'Final branch/sync:',
      'Retained worktrees:',
      "External or unresolved GitHub writes defer to `omp-repository-boundary-guard`'s single standard Ask",
      'Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference',
      'Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis',
      'Treat GitHub administration as distinct from browser UI validation',
      'prefer an authenticated `gh`/GitHub API path when available',
      'A signed-out browser does not block completed remote work',
      'Report browser authentication as `BLOCKED` only when browser UI behavior is the explicit requirement',
      'After any API mutation, perform a fresh API read that confirms the intended remote state',
      '## Requirements Snapshot',
      'ambiguous or cross-cutting feature work',
      '**Problem:**',
      '**Desired result/Gold:**',
      '**Acceptance criteria:**',
      '**Assumptions:**',
      '**Open questions:**',
      '**Non-goals:**',
      'Skip the snapshot for mechanical changes with an obvious scope',
      'check-title-case --title "<final title>"',
      're-read the created title through GitHub and run the same final check',
      '## Contract Closure',
      'cross-cutting change whose observable semantic reaches product or runtime boundaries',
      'recording each boundary as `verified` or `N/A`',
      'Verify parity between equivalent user-visible paths',
      'Mechanical local changes skip contract closure.',
      'only when the changed contract actually reaches it',
      'not a generic whole-repository audit.',
      '## Conditional CI and Cache Closure',
      'changes to build images, dependency-install layers, migrations, bootstrap or initializers, generated artifacts, or test provisioning',
      'one representative changed file per relevant path class',
      'each path must independently enable the expected job or cache invalidation',
      'composition of positive rules',
      'no path-filtered CI or cache tied to the changed surface',
      'Ordinary source-only changes do not require CI/cache closure, generic CI edits, cache busting, or full-suite reruns.',
      'A UI notification alone is not correction evidence',
      'resolved model rather than `[no model]`',
    ], requiredText => `${name} must require ${requiredText}`, fail);
    if (workflow.includes('Keep the PR `BLOCKED` and do not merge while')) {
      fail(`${name} must not impose an unconditional blocked merge gate`);
    }
    if (workflow.includes('Resolve every actionable review finding or comment before merge.')) {
      fail(`${name} must qualify merge resolution as the default`);
    }
  }

  for (const [name, workflow] of [
    ['AGENTS.md', alwaysLoadedGuidance],
    ['authoritative feature workflow', featureWorkflow],
    ['packaged feature workflow', packagedFeatureWorkflow],
    ['authoritative hands-off workflow', read('docs/workflows/hands-off-agentic-coding-workflow.md')],
    ['packaged hands-off workflow', read('skills/hands-off-agentic-coding/workflow.md')],
  ]) {
    requireEvery(workflow, [
      'Run an installed verifier only when its declared contract directly covers a changed acceptance criterion',
      'a generic repository-hygiene check is not relevant merely because a source file changed',
      'Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`',
    ], requiredText => `${name} must scope verifier gates to relevant contracts`, fail);
  }

  const layeredPageWorkflows = [
    ['authoritative layered-page workflow', read('docs/workflows/layered-page-orchestration-workflow.md')],
    ['packaged layered-page workflow', read('skills/layered-page-orchestration/workflow.md')],
  ];
  for (const [name, workflow] of layeredPageWorkflows) {
    requireEvery(workflow, [
      'initial route only decides between concrete pathways',
      'route replacement',
      'unmounted after redirect',
      'Do not add a resolver layer',
      '## Routing Example',
    ], requiredText => `${name} must include ${requiredText}`, fail);
  }

  const testingInstructionsWorkflow = read('docs/workflows/testing-instructions-workflow.md');
  const packagedTestingInstructionsWorkflow = read('skills/testing-instructions/workflow.md');
  const browserQaTestingInstructionsWorkflow = read('skills/browser-qa/testing-instructions-workflow.md');
  for (const [name, workflow] of [
    ['authoritative testing instructions workflow', testingInstructionsWorkflow],
    ['packaged testing instructions workflow', packagedTestingInstructionsWorkflow],
    ['browser QA testing instructions workflow', browserQaTestingInstructionsWorkflow],
  ]) {
    requireEvery(workflow, ['Start from Gold', 'Use `PASS`, `FAIL`, and `BLOCKED`'], requiredText => `${name} must require ${requiredText}`, fail);
  }
  for (const [name, workflow] of [
    ['authoritative testing instructions workflow', testingInstructionsWorkflow],
    ['packaged testing instructions workflow', packagedTestingInstructionsWorkflow],
  ]) {
    requireEvery(workflow, ['## Evidence Ownership', 'Documentation or guidance', "Tura's [contribution guide]"], requiredText => `${name} must include ${requiredText}`, fail);
  }

  const authoritativePullRequestWorkflow = read('docs/workflows/pull-request-management-workflow.md');
  const pullRequestWorkflowVariants = [
    ['authoritative pull request workflow', authoritativePullRequestWorkflow],
    ['packaged pull request workflow', pullRequestWorkflow],
  ];
  for (const [name, workflow] of pullRequestWorkflowVariants) {
    requireEvery(workflow, [
      'Review and QA status',
      'Testing instructions: runnable steps a reviewer can execute without branch-author context.',
      'Do not add reviewer-facing `Verification` or `Evidence` sections',
      'one clearly labeled PR comment or linked traceable artifact',
      'material findings, decisions, limitations, fixups, blockers',
      'Self-review the complete PR diff',
      'Run targeted QA for the user-visible changed behavior',
      'Resolve every actionable review finding or comment',
      'Keep the PR `BLOCKED`',
      'Learner coverage: a concise triage outcome for each non-learner-authored issue',
      '`PASS`, `FAIL`, and `BLOCKED` outcomes',
      'After creating or updating a PR body, read the PR from GitHub',
      'A local draft or body artifact is input only',
    ], requiredText => `${name} must require ${requiredText}`, fail);
    if (/^#{1,6} (?:Verification|Evidence)\b/im.test(workflow)) {
      fail(`${name} must not prescribe reviewer-facing Verification or Evidence sections`);
    }
    if (
      !workflow.includes('inspect the complete PR diff for the same underlying issue')
      || !workflow.includes('dedicated `:ok_hand:` commit')
      || !workflow.includes('PR scope checked')
    ) {
      fail(`${name} must preserve review-derived correction history`);
    }
  }

  const normalizedPullRequestWorkflow = workflow => workflow
    .replace(
      /\n   (?:When the follow-up work resolves review comments, use `docs\/workflows\/pull-request-comment-resolution-workflow\.md` and restore ready-for-review status after resolved thread state is verified unless the PR was intentionally left draft\.|After follow-up work resolves review comments, verify every addressed thread is resolved, restore ready-for-review status unless the PR was intentionally left draft, and re-check the remote PR state before reporting it ready\.)/,
      '\n   [follow-up review state]',
    )
    .replace(/\n   Use `github-review-thread resolve .*?checks pass\./, '')
    .replace('the packaged `../../docs/workflows/upload-pr-screenshots-workflow.md`', '`docs/workflows/upload-pr-screenshots-workflow.md`')
    .replace('`docs/workflows/upload-pr-screenshots-workflow.md` workflow for upload', '`docs/workflows/upload-pr-screenshots-workflow.md` for upload');

  if (normalizedPullRequestWorkflow(authoritativePullRequestWorkflow) !== normalizedPullRequestWorkflow(pullRequestWorkflow)) {
    fail('pull request workflow and packaged fallback must stay synchronized except for self-contained path and review-helper guidance');
  }

  requireText(pullRequestWorkflow, 'upload-pr-screenshots-workflow.md', 'packaged pull request workflow must link the screenshot upload workflow', fail);
  requireEvery(commentResolutionWorkflow, [
    'Fix every actionable review finding or comment',
    'After a fixup, re-review the complete PR diff',
    'Keep the PR `BLOCKED`',
  ], requiredText => `comment resolution workflow must require ${requiredText}`, fail);

  const uploadScreenshotsWorkflow = read('docs/workflows/upload-pr-screenshots-workflow.md');
  requireEvery(uploadScreenshotsWorkflow, [
    'addImageToGitHubMarkdownEditor',
    'editorSelector',
    'fileInputSelector',
    'user-attachments/assets',
    'not already present before upload',
    'verify that exact staged copy is readable before Browser upload',
    'REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL',
    'After the web upload has produced a URL, API text edits may update PR/comment Markdown',
    'copy each upload image to `~/Downloads`',
    'existing PR body editor—not the temporary new-comment composer',
    'one stable HTML-comment placeholder per screenshot',
    'Submit the PR body form, reload the persisted target',
    'confirm each image appears directly after its reviewer-facing caption and route',
    'If GitHub appended an attachment elsewhere, use `gh api` only after the web upload has produced its URL',
    'Keep QA logs, local file paths, and internal verification evidence out of the PR body',
    'github_pr_screenshot_upload_path',
    'uploadPullRequestCommentScreenshots',
    '#issuecomment-…',
    'not a `raw.githubusercontent.com` URL',
  ], requiredText => `upload screenshot workflow must document ${requiredText}`, fail);
  if (uploadScreenshotsWorkflow.includes('prefer the GitHub REST API')) {
    fail('upload screenshot workflow must not present REST as the primary local screenshot upload path');
  }

  const githubToolingReference = read('docs/references/github-tooling-reference.md');
  requireEvery(githubToolingReference, [
    'does not provide a public upload endpoint that hosts a local screenshot',
    'For non-UI GitHub administration',
    'prefer an authenticated `gh`/GitHub API path when available',
    'A signed-out browser session does not make API-backed work `BLOCKED`',
    'After an API mutation, perform a fresh API read that confirms the intended remote state',
    'repository.pullRequest.projectCards',
    'gh api -X PATCH repos/OWNER/REPOSITORY/pulls/NUMBER',
    'Do not pass shell-sensitive Markdown inline',
    'Reserve browser authentication blockers for explicit browser UI validation',
  ], requiredText => `github tooling reference must document ${requiredText}`, fail);

  return { featureWorkflow, packagedFeatureWorkflow };
}
