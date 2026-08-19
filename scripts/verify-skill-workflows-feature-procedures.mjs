import { requireEvery } from './verify-skill-workflows-assertions.mjs';

export function verifyFeatureProcedures({ read, fail, alwaysLoadedGuidance }) {
  const featureWorkflow = read('docs/workflows/feature-workflow.md');
  const packagedFeatureWorkflow = read('skills/feature/workflow.md');
  for (const [name, workflow] of [
    ['authoritative feature workflow', featureWorkflow],
    ['packaged feature workflow', packagedFeatureWorkflow],
  ]) {
    requireEvery(
      workflow,
      [
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
        'External or unresolved GitHub writes remain subject to `omp-soft-boundary-guard` advisory warnings when installed.',
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
      ],
      (requiredText) => `${name} must require ${requiredText}`,
      fail,
    );
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
    requireEvery(
      workflow,
      [
        'Run an installed verifier only when its declared contract directly covers a changed acceptance criterion',
        'a generic repository-hygiene check is not relevant merely because a source file changed',
        'Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`',
      ],
      (requiredText) => `${name} must scope verifier gates to relevant contracts`,
      fail,
    );
  }

  return { featureWorkflow, packagedFeatureWorkflow };
}
