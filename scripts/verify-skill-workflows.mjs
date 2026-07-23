import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  failures.push(message);
}

const packageJson = JSON.parse(read('package.json'));

if (existsSync(path.join(root, 'agents'))) {
  fail('top-level agents/ is reserved for plugin agents; use docs/ for shared guidance');
}
if (!existsSync(path.join(root, 'docs', 'index.md'))) {
  fail('docs/index.md must be the docs landing page');
}
if (!packageJson.files.includes('docs/')) {
  fail('package.json must include docs/');
}
if (packageJson.files.includes('agents/')) {
  fail('package.json must not package agents/');
}
if (packageJson.files.includes('claude-plugin/')) {
  fail('package.json must not package claude-plugin/');
}
if (!packageJson.files.includes('.claude-plugin/')) {
  fail('package.json must include .claude-plugin/');
}
if (!existsSync(path.join(root, '.claude-plugin', 'plugin.json'))) {
  fail('Claude plugin manifest must exist at .claude-plugin/plugin.json');
}
if (!existsSync(path.join(root, '.claude-plugin', 'marketplace.json'))) {
  fail('Claude marketplace catalog must exist at .claude-plugin/marketplace.json');
}
if (existsSync(path.join(root, '.claude-plugin', 'plugin.json'))) {
  const claudePluginJson = JSON.parse(read('.claude-plugin/plugin.json'));
  if (claudePluginJson.name !== packageJson.name) fail('Claude plugin name must match package name');
  if (claudePluginJson.version !== packageJson.version) fail('Claude plugin version must match package version');
}
if (existsSync(path.join(root, '.claude-plugin', 'marketplace.json'))) {
  const claudeMarketplaceJson = JSON.parse(read('.claude-plugin/marketplace.json'));
  if (!claudeMarketplaceJson.plugins?.some((plugin) => plugin.name === packageJson.name && plugin.source === './')) {
    fail('Claude marketplace must install this repo as the plugin root');
  }
}
function normalizedRepositoryUrl(value) {
  return value.replace(/^git\+/, '').replace(/\.git$/, '').replace(/\/$/, '');
}

if (!existsSync(path.join(root, '.omp-plugin', 'marketplace.json'))) {
  fail('OMP marketplace catalog must exist at .omp-plugin/marketplace.json');
}

if (existsSync(path.join(root, '.omp-plugin', 'marketplace.json'))) {
  const ompMarketplaceJson = JSON.parse(read('.omp-plugin/marketplace.json'));
  if (ompMarketplaceJson.name !== packageJson.name) fail('OMP marketplace name must match package name');
  if (ompMarketplaceJson.plugins?.length !== 1) fail('OMP marketplace must expose exactly one plugin entry');
  const [ompPlugin] = ompMarketplaceJson.plugins ?? [];
  if (ompPlugin) {
    if (ompPlugin.name !== packageJson.name) fail('OMP marketplace plugin name must match package name');
    if (ompPlugin.source !== './') fail('OMP marketplace plugin source must install this repo as the plugin root');
    if (normalizedRepositoryUrl(ompPlugin.repository) !== normalizedRepositoryUrl(packageJson.repository.url)) {
      fail('OMP marketplace plugin repository must match package repository');
    }
  }
}

function fallbackPath(uri) {
  return path.join(root, 'skills', ...uri.split('/'));
}

function skillContract(skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/`((?:docs|agents)\/workflows\/[^`]+)`/g)].map((match) => match[1]);
  const packaged = [...text.matchAll(/\[[^\]]+\]\(([^)]*workflow\.md)\)/g)].map((match) => {
    const relativePath = match[1];
    return { relativePath, uri: path.posix.join(skillName, relativePath) };
  });
  return { local, packaged };
}

for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const { local, packaged } = skillContract(entry.name);

  if (local.length === 0) fail(`${entry.name}: missing local workflow path`);
  if (local.length !== packaged.length * 2) fail(`${entry.name}: local and packaged workflow paths must align`);

  for (let index = 0; index < local.length; index += 2) {
    const preferred = local[index];
    const legacy = local[index + 1];
    if (!preferred?.startsWith('docs/workflows/')) fail(`${entry.name}: preferred local workflow must use docs/workflows`);
    if (!existsSync(path.join(root, preferred))) fail(`${entry.name}: missing preferred workflow ${preferred}`);
    if (legacy !== preferred.replace('docs/workflows/', 'agents/workflows/')) {
      fail(`${entry.name}: legacy local workflow must immediately follow matching docs workflow`);
    }
  }

  for (const fallback of packaged) {
    if (!existsSync(path.join(root, 'skills', entry.name, fallback.relativePath))) {
      fail(`${entry.name}: missing packaged fallback ${fallback.relativePath}`);
    }
    if (!existsSync(fallbackPath(fallback.uri))) fail(`${entry.name}: missing skill://${fallback.uri}`);
  }
}

const gitRebaseSkill = read('skills/git-rebase/SKILL.md');
if (!gitRebaseSkill.includes('read `skill://git-rebase/workflow.md`')) {
  fail('git-rebase skill must explicitly direct agents to read its packaged workflow');
}

const jiraReportingWorkflow = read('docs/workflows/jira-reporting-workflow.md');
for (const requiredText of [
  '# Context',
  '# User Report',
  '# Proposed Solution',
  'Use H2 `To Reproduce` and `Expected Behavior` under `Context` for Bugs',
  'Embed supplied screenshots when the target supports media embeds',
  'Read the project-local Jira workflow, comparable tickets',
  'Link related Jira issues with the relationship that matches the evidence',
]) {
  if (!jiraReportingWorkflow.includes(requiredText)) {
    fail(`Jira reporting workflow must include ${requiredText}`);
  }
}

const nodeExpressWorkflow = read('skills/node-express-api/workflow.md');
for (const requiredText of [
  'docs/workflows/express-light-rail-backend-workflow.md',
  'agents/workflows/express-light-rail-backend-workflow.md',
  '[Express Light Rail](../express-light-rail/workflow.md)',
]) {
  if (!nodeExpressWorkflow.includes(requiredText)) {
    fail(`node-express-api fallback must include ${requiredText}`);
  }
}
if (nodeExpressWorkflow.includes('glob(')) {
  fail('node-express-api fallback must not prescribe workflow discovery tooling');
}

const expressWorkflow = read('skills/express-light-rail/workflow.md');
if (expressWorkflow.includes('Pick only the templates needed from `docs/templates/backend/express-light-rail/`')) {
  fail('express-light-rail fallback must not require target-project docs/templates');
}

const learnWorkflow = read('docs/workflows/learn-workflow.md');
const learnFallbackWorkflow = read('skills/learn/workflow.md');
const normalizedLearnFallbackWorkflow = learnFallbackWorkflow.replace(
  '../../docs/templates/prompt-improvement-template.md',
  '../templates/prompt-improvement-template.md',
);
if (learnWorkflow !== normalizedLearnFallbackWorkflow) {
  fail('learn workflow and packaged fallback must stay synchronized except for the packaged prompt-improvement template link');
}
if (!learnWorkflow.includes('repeated code-style correction')) {
  fail('learn workflow must route repeated code-style corrections');
}
if (!learnWorkflow.includes('`klondikemarlen/marlens-skills-rules-and-tools` for shared prompt/workflow/review guidance, or `omp-verifier` for enforceable advisor/runtime/tooling')) {
  fail('learn workflow must distinguish shared guidance from verifier enforcement');
}
if (!learnWorkflow.includes('over-generalized')) {
  fail('learn workflow must route over-generalized learner proposals to OMP Learner');
}
for (const requiredText of [
  'issues not clearly learner-authored',
  'evidence-backed current-signal misses or capability gaps',
]) {
  if (!learnWorkflow.includes(requiredText)) {
    fail(`learn workflow must document ${requiredText}`);
  }
}

const selfImprovementWorkflows = [
  ['authoritative self-improvement workflow', read('docs/workflows/self-improvement-workflow.md')],
  ['packaged self-improvement workflow', read('skills/self-improvement/workflow.md')],
];
for (const [name, workflow] of selfImprovementWorkflows) {
  if (!workflow.includes('For this package\'s own checkout, use `npm test`')) {
    fail(`${name} must use package verification for a package self-improvement run`);
  }
  if (!workflow.includes('node bin/agent-guidance-audit.js --strict <downstream-root>')) {
    fail(`${name} must reserve the guidance audit for downstream repositories`);
  }
}

for (const [name, workflow] of selfImprovementWorkflows) {
  for (const requiredText of [
    'existing compiler, test-runner, bundler, and editor/language-server module-resolution configuration',
    'deep cross-module relative imports exist',
    'whether an existing local guidance or lint rule already preserves the chosen style',
    'do not bulk-rewrite imports solely for style',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must make root-import guidance configuration-aware`);
    }
  }
}

const packageCommands = read('bin/README.md');
for (const command of Object.keys(packageJson.bin)) {
  if (!packageCommands.includes(`\`${command}\``)) {
    fail(`bin/README.md must document ${command}`);
  }
}

if (existsSync(path.join(root, 'rules', 'no-issue-filing-without-confirmation.md'))) {
  fail('package must not ship the obsolete issue-filing confirmation rule');
}


const ompTargetRule = read('rules/omp-not-opencode-target-check.md');
if (!ompTargetRule.includes('omp plugin install <source>')) {
  fail('OMP target rule must use current plugin install wording');
}
if (ompTargetRule.includes('omp install <source>')) {
  fail('OMP target rule must not use stale generic install wording');
}
if (!ompTargetRule.includes('scope: "tool"')) {
  fail('OMP target rule must keep a reusable tool scope');
}

const commentResolutionWorkflow = read('docs/workflows/pull-request-comment-resolution-workflow.md');
if (!commentResolutionWorkflow.includes('temporarily draft')) {
  fail('comment resolution workflow must distinguish temporary draft state');
}
if (!commentResolutionWorkflow.includes('mark it ready for review again')) {
  fail('comment resolution workflow must restore ready-for-review status after resolved follow-up threads');
}
if (!commentResolutionWorkflow.includes('Re-check the remote PR state')) {
  fail('comment resolution workflow must verify remote PR state before reporting ready');
}

const pullRequestWorkflow = read('skills/pull-request-management/workflow.md');
if (!pullRequestWorkflow.includes('restore ready-for-review status unless the PR was intentionally left draft')) {
  fail('packaged pull request workflow must include self-contained restored ready-for-review guidance');
}

const featureWorkflow = read('docs/workflows/feature-workflow.md');
const packagedFeatureWorkflow = read('skills/feature/workflow.md');
for (const [name, workflow] of [
  ['authoritative feature workflow', featureWorkflow],
  ['packaged feature workflow', packagedFeatureWorkflow],
]) {
  for (const requiredText of [
    'Open a draft pull request',
    'Self-review the complete PR diff',
    'Run targeted QA for the user-visible changed behavior',
    'Resolve every actionable review finding or comment',
    'After a fixup, repeat the complete self-review and targeted QA',
    'Keep the PR `BLOCKED`',
    'Learner Coverage During Issue Triage',
    'Learner coverage: no action',
    'Learner coverage: propose bug/feature',
    'Learner coverage: filed',
    "Before opening a PR, verify its base is the repository's default branch or a documented release branch.",
    'After merge, check out the intended default/release branch and fast-forward it from origin.',
    'Delete the merged issue branch locally and remotely only when it is agent-owned and no longer needed.',
    'Run `git worktree prune` and inspect `git worktree list`',
    'Final branch/sync:',
    'Retained worktrees:',
    "External or unresolved GitHub writes defer to `omp-repository-boundary-guard`'s single standard Ask",
    'Routine OMP installs use the generic `omp plugin install github:OWNER/REPOSITORY` reference',
    'Use `#<full-commit-hash> --force` only for exact-artifact reproduction or stale-cache diagnosis',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must require ${requiredText}`);
    }
  }
}

const layeredPageWorkflows = [
  ['authoritative layered-page workflow', read('docs/workflows/layered-page-orchestration-workflow.md')],
  ['packaged layered-page workflow', read('skills/layered-page-orchestration/workflow.md')],
];
for (const [name, workflow] of layeredPageWorkflows) {
  for (const requiredText of [
    'initial route only decides between concrete pathways',
    'route replacement',
    'unmounted after redirect',
    'Do not add a resolver layer',
    '## Routing Example',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must include ${requiredText}`);
    }
  }
}

const testingInstructionsWorkflow = read('docs/workflows/testing-instructions-workflow.md');
const packagedTestingInstructionsWorkflow = read('skills/testing-instructions/workflow.md');
const browserQaTestingInstructionsWorkflow = read('skills/browser-qa/testing-instructions-workflow.md');
for (const [name, workflow] of [
  ['authoritative testing instructions workflow', testingInstructionsWorkflow],
  ['packaged testing instructions workflow', packagedTestingInstructionsWorkflow],
  ['browser QA testing instructions workflow', browserQaTestingInstructionsWorkflow],
]) {
  for (const requiredText of [
    'Start from Gold',
    'Use `PASS`, `FAIL`, and `BLOCKED`',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must require ${requiredText}`);
    }
  }
}

const authoritativePullRequestWorkflow = read('docs/workflows/pull-request-management-workflow.md');
for (const [name, workflow] of [
  ['authoritative pull request workflow', authoritativePullRequestWorkflow],
  ['packaged pull request workflow', pullRequestWorkflow],
]) {
  for (const requiredText of [
    'Review and QA evidence',
    'Self-review the complete PR diff',
    'Run targeted QA for the user-visible changed behavior',
    'Resolve every actionable review finding or comment',
    'Keep the PR `BLOCKED`',
    'Learner coverage: the triage outcome for each non-learner-authored issue',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must require ${requiredText}`);
    }
  }
}

if (!pullRequestWorkflow.includes('upload-pr-screenshots-workflow.md')) {
  fail('packaged pull request workflow must link the screenshot upload workflow');
}
for (const requiredText of [
  'Fix every actionable review finding or comment',
  'After a fixup, re-review the complete PR diff',
  'Keep the PR `BLOCKED`',
]) {
  if (!commentResolutionWorkflow.includes(requiredText)) {
    fail(`comment resolution workflow must require ${requiredText}`);
  }
}


const uploadScreenshotsWorkflow = read('docs/workflows/upload-pr-screenshots-workflow.md');
for (const requiredText of [
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
]) {
  if (!uploadScreenshotsWorkflow.includes(requiredText)) {
    fail(`upload screenshot workflow must document ${requiredText}`);
  }
}
if (uploadScreenshotsWorkflow.includes('prefer the GitHub REST API')) {
  fail('upload screenshot workflow must not present REST as the primary local screenshot upload path');
}

const githubToolingReference = read('docs/references/github-tooling-reference.md');
if (!githubToolingReference.includes('does not provide a public upload endpoint that hosts a local screenshot')) {
  fail('github tooling reference must document that gh api cannot host local screenshots as user attachments');
}

const administrationTabTemplate = read('docs/templates/frontend/administration-tab-page-template.md');
const frontendTemplatesIndex = read('docs/templates/frontend/README.md');
for (const requiredText of [
  'Vue 3 with `<script setup lang="ts">`',
  'route-query-suffix="{RouteQuerySuffix}"',
  'Hide the parent column',
  'After successful delete/mutation, refresh',
  'Verification Checklist',
]) {
  if (!administrationTabTemplate.includes(requiredText)) {
    fail(`administration tab template must document ${requiredText}`);
  }
}
if (!frontendTemplatesIndex.includes('administration-tab-page-template.md')) {
  fail('frontend template index must list administration-tab-page-template.md');
}

const notificationEventTemplate = read('docs/templates/backend/notification-event-service-template.md');
const backendTemplatesIndex = read('docs/templates/backend/README.md');
for (const requiredText of [
  'Do not add this layer for a simple in-app-only row',
  '{NotificationPreferenceService}',
  'Single Recipient Event Service',
  'Multiple Recipient Event Service With Attributes',
  'Outbox Architecture Note',
  'delivery status or retry tracking',
  'observable delivery contracts',
]) {
  if (!notificationEventTemplate.includes(requiredText)) {
    fail(`notification event template must document ${requiredText}`);
  }
}
if (!backendTemplatesIndex.includes('notification-event-service-template.md')) {
  fail('backend template index must list notification-event-service-template.md');
}

const guidancePrecedenceReference = read('docs/references/guidance-precedence-reference.md');
const docsIndex = read('docs/index.md');
const readme = read('README.md');
const agentRules = read('AGENT_RULES.md');
const globalAgents = read('AGENTS.md');
for (const [name, text] of [
  ['docs index', docsIndex],
  ['README', readme],
  ['agent rules', agentRules],
  ['global agent rules', globalAgents],
]) {
  if (!text.includes('guidance-precedence-reference.md')) {
    fail(`${name} must link to the canonical guidance precedence reference`);
  }
}

for (const requiredText of [
  '### End-User Preferences',
  'boolean, number, or string',
  'JSON objects or arrays',
]) {
  if (!agentRules.includes(requiredText)) {
    fail(`AGENT_RULES.md must require scalar end-user preferences: ${requiredText}`);
  }
}
for (const requiredText of [
  '## Worktree Environment Setup',
  'After creating or switching to a worktree',
  'separate checkout: prepare it independently',
  'copy each root `*.code-workspace` file from the source',
  'do not overwrite destination workspace configuration',
  "setup docs and documented development/test wrapper",
  'Dockerized projects or a documented wrapper such as `bin/dev`',
  "lockfile's native package-manager command",
  'Skip setup for read-only work',
]) {
  if (!globalAgents.includes(requiredText)) {
    fail(`AGENTS.md must document worktree setup: ${requiredText}`);
  }
}
for (const requiredText of [
  '## Same-Origin GitHub Delivery',
  "current checkout's GitHub issue or feature workflow",
  'linked draft pull request',
  'one exact retry',
  'omp-repository-boundary-guard',
  'repository-boundary guarding for local writes and moves',
  'supported `gh issue`/`gh pr`/`gh api` mutations',
  'supported `xd://github` writes',
  'canonical checkout identity',
  'requested current-checkout issue or feature workflow',
  'genuinely destructive or ambiguous Git operations',
  'merge reviewed same-origin pull requests',
  'push any necessary branch refs directly with `git push`',
  'documented direct `git push` tag command and release-publication command',
  'Do not call `ask` solely to authorize same-origin branch delivery, tag publication, or documented release publication',
  'one standard OMP Ask before a mutation crosses the active repository boundary',
  'Host-level authorization is limited to external, unresolved, destructive, or genuinely ambiguous targets.',
  'MUST NOT require a duplicate manual `ask`',
]) {
  if (!globalAgents.includes(requiredText)) {
    fail(`AGENTS.md must preserve same-origin delivery authorization: ${requiredText}`);
  }
}

for (const requiredText of [
  'A later, explicit user instruction narrows or supersedes an earlier broad workflow directive',
  'do not recommend or perform implementation, release, installation, pull-request, or other writes in that repository',
]) {
  if (!globalAgents.includes(requiredText)) {
    fail(`AGENTS.md must honor later explicit user scope: ${requiredText}`);
  }
}

const manualAskBeforeSameOriginDelivery = /\b(?:call|invoke|render|show|use)\s+`?ask`?[^.\n]{0,160}\b(?:before|prior to)[^.\n]{0,160}(?:same-origin|resolved(?: same-origin)? origin|documented (?:same-origin )?(?:tag|release)(?: publication)?)|(?:same-origin|resolved(?: same-origin)? origin|documented (?:same-origin )?(?:tag|release)(?: publication)?)[^.\n]{0,160}\b(?:before|prior to)[^.\n]{0,160}\b(?:call|invoke|render|show|use)\s+`?ask`?/iu;
for (const manualAskExample of [
  'Call `ask` before a resolved same-origin branch push.',
  'Call `ask` before documented same-origin tag publication.',
  'Call `ask` before documented same-origin release publication.',
]) {
  if (!manualAskBeforeSameOriginDelivery.test(manualAskExample)) {
    fail(`manual Ask guard must detect: ${manualAskExample}`);
  }
}
for (const [name, workflow] of [
  ['authoritative feature workflow', featureWorkflow],
  ['packaged feature workflow', packagedFeatureWorkflow],
]) {
  if (manualAskBeforeSameOriginDelivery.test(workflow)) {
    fail(`${name} must not ask before same-origin delivery or release publication`);
  }
}

for (const forbiddenText of [
  'Repo-specific exception:',
  'If uncertain, ask before any git operation.',
  'sole confirmation boundary for GitHub writes',
  'Do not render a manual Ask prompt for that boundary.',
]) {
  if (globalAgents.includes(forbiddenText)) {
    fail(`AGENTS.md must not retain conflicting Git Ask guidance: ${forbiddenText}`);
  }
}

for (const requiredText of [
  'Markdown draft or email edit complete',
  'exact code identifiers, resource names, commands, and acronyms',
]) {
  if (!globalAgents.includes(requiredText)) {
    fail(`AGENTS.md must require display title review: ${requiredText}`);
  }
}

const titleCasingGuidance = [
  ['title casing reference', read('docs/references/title-casing-reference.md')],
  ['packaged title casing fallback', read('skills/pull-request-management/title-casing.md')],
];
for (const [name, guidance] of titleCasingGuidance) {
  for (const requiredText of [
    'Markdown headings',
    'email subjects',
    'explicit local style guide says otherwise',
  ]) {
    if (!guidance.includes(requiredText)) {
      fail(`${name} must cover display titles: ${requiredText}`);
    }
  }
}

for (const requiredText of [
  'Global rules',
  'Workflows',
  'Templates',
  'References',
  'Plans',
  'Skills',
  'Keep rationale for a local override next to the affected local guidance',
  'later explicit instruction narrows or supersedes an earlier broad workflow directive',
  'it does not override a higher-precedence source',
]) {
  if (!guidancePrecedenceReference.includes(requiredText)) {
    fail(`guidance precedence reference must distinguish ${requiredText}`);
  }
}
for (const requiredText of [
  'Task-Oriented Documentation Map',
  'docs/index.md',
  'pull-request-management-workflow.md',
  'git-rebase-workflow.md',
]) {
  if (!readme.includes(requiredText)) {
    fail(`README task map must include ${requiredText}`);
  }
}

for (const requiredText of [
  'layered page orchestration',
  'layered-page-orchestration-workflow.md',
]) {
  if (!readme.includes(requiredText)) {
    fail(`README must document layered page orchestration: ${requiredText}`);
  }
}

for (const requiredText of [
  'omp-repository-boundary-guard',
  'omp plugin install github:klondikemarlen/omp-repository-boundary-guard',
  'Repository-boundary guard for local writes and moves',
  'supported `gh issue`/`gh pr`/`gh api` mutations',
  'supported `xd://github` writes',
  'Routine OMP installs use the generic GitHub reference',
  'exact full-commit reference with `--force` is exceptional',
]) {
  if (!readme.includes(requiredText)) {
    fail(`README must document boundary and install guidance: ${requiredText}`);
  }
}

const ompInstallReference = read('docs/references/omp-plugin-install-reference.md');
for (const requiredText of [
  'omp plugin install github:OWNER/REPOSITORY',
  'full commit hash',
  'exact artifact',
  'stale plugin-cache state',
  'Do not describe an unpinned GitHub reference as a versioned release',
]) {
  if (!ompInstallReference.includes(requiredText)) {
    fail(`OMP install reference must document ${requiredText}`);
  }
}

for (const requiredText of [
  'semantic versioning with cumulative release judgment',
  'There is no numeric patch threshold',
  'size and public significance of the accumulated work',
]) {
  if (!readme.includes(requiredText)) {
    fail(`README must document cumulative release versioning: ${requiredText}`);
  }
}

const downstreamAuditReference = read('docs/references/downstream-agent-guidance-audit-reference.md');
for (const requiredText of [
  'read-only maintainer tooling',
  'agent-guidance-audit',
  'Markdown links to missing local files',
]) {
  if (!downstreamAuditReference.includes(requiredText)) {
    fail(`downstream audit reference must document ${requiredText}`);
  }
}

const fullStackCrudWorkflow = read('docs/workflows/full-stack-admin-crud-workflow.md');
for (const requiredText of [
  'Node.js + Express + Sequelize',
  'Vue 3 + Vuetify',
  'Backend Express/Sequelize rail',
  'Search/filter/autocomplete inputs reset pagination',
]) {
  if (!fullStackCrudWorkflow.includes(requiredText)) {
    fail(`full-stack admin CRUD workflow must document ${requiredText}`);
  }
}
for (const [name, text] of [
  ['README', readme],
  ['docs index', docsIndex],
  ['templates README', read('docs/templates/README.md')],
  ['downstream audit reference', downstreamAuditReference],
  ['full-stack CRUD workflow', fullStackCrudWorkflow],
]) {
  if (text.toLowerCase().includes('ledger')) {
    fail(`${name} must not reintroduce the removed guidance ledger concept`);
  }
}

const backendCrudTemplate = read('docs/templates/backend/express-sequelize-crud/resource-rail-template.md');
const frontendCrudTemplate = read('docs/templates/frontend/vue-vuetify-crud/admin-resource-pages-template.md');
const searchableAutocompleteTemplate = read('docs/templates/frontend/searchable-autocomplete-template.md');
const apiTypescriptTemplate = read('docs/templates/frontend/api-typescript-template.md');
for (const [name, text, requiredText] of [
  ['backend CRUD template', backendCrudTemplate, 'applyScope'],
  ['backend CRUD template', backendCrudTemplate, 'totalCount'],
  ['frontend CRUD template', frontendCrudTemplate, 'Vue 3 + Vuetify'],
  ['frontend CRUD template', frontendCrudTemplate, 'validation errors'],
  ['searchable autocomplete template', searchableAutocompleteTemplate, 'debounced'],
  ['searchable autocomplete template', searchableAutocompleteTemplate, '{ResourceNameAsReference}'],
]) {
  if (!text.includes(requiredText)) {
    fail(`${name} must document ${requiredText}`);
  }
}
if (apiTypescriptTemplate.includes('export const STATUSES') || apiTypescriptTemplate.includes('  STATUSES,')) {
  fail('API TypeScript template must not export a default legacy constant');
}
if (!apiTypescriptTemplate.includes('Add legacy constants only for existing callers.')) {
  fail('API TypeScript template must make legacy constants conditional');
}
const codeOrganizationReference = read('docs/references/code-organization-reference.md');
const referencesIndex = read('docs/references/README.md');
for (const requiredText of [
  'Code organization is not more folders',
  'Module Decomposition',
  'Service Orchestration Readability',
  'Context/request object passed everywhere',
  'circular imports',
  'State Names and Dependency-Local Ordering',
  'domain fact or lifecycle it represents',
  'direct derived state',
  'broader coordination state and action handlers',
]) {
  if (!codeOrganizationReference.includes(requiredText)) {
    fail(`code organization reference must document ${requiredText}`);
  }
}
if (!referencesIndex.includes('Code organization, module boundaries, and pattern-selection criteria')) {
  fail('references index must list the code organization reference');
}
for (const requiredText of [
  'Private Helper Inputs',
  'accepts every value it uses as an explicit parameter',
  'inherently bound to object state',
]) {
  if (!codeOrganizationReference.includes(requiredText)) {
    fail(`code organization reference must document ${requiredText}`);
  }
}
for (const requiredText of [
  'Project-Root Imports and Paths',
  'configured project-root import',
  'consider adding it when recurring cross-module traversal warrants the setup',
  'every supported compiler, test runner, bundler, and editor/language server resolves identically',
  'short relative import for an immediately co-located sibling',
  'Do not bulk-rewrite imports solely for style',
  'record it in project-local guidance',
  'do not add a dependency merely to police import spelling',
  'define one application/source root and derive paths from it',
  'framework-managed autoloaded constants instead of relative `require` traversal',
  '`Rails.root.join` for application-root file paths',
  'Do not treat a runtime path constant as module-resolution configuration',
]) {
  if (!codeOrganizationReference.includes(requiredText)) {
    fail(`code organization reference must document ${requiredText}`);
  }
}

for (const requiredText of [
  'Domain-Oriented Modules and Tests',
  'domain action or external integration it owns',
  'Keep parsers and policies pure',
  'Classes earn their cost only when they own meaningful state or a lifecycle',
  'Co-locate focused unit tests',
  'boundary integration test',
  'share a fixture only when it represents stable domain data',
  'Before a structural move, run the existing behavior check',
]) {
  if (!codeOrganizationReference.includes(requiredText)) {
    fail(`code organization reference must document ${requiredText}`);
  }
}

const codeReviewWorkflow = read('docs/workflows/code-review-workflow.md');
const codeReviewFallbackWorkflow = read('skills/code-review/workflow.md');
for (const [name, workflow] of [
  ['authoritative code review workflow', codeReviewWorkflow],
  ['packaged code review workflow', codeReviewFallbackWorkflow],
]) {
  if (!workflow.includes('Test expectations should be declarative expected data')) {
    fail(`${name} must require declarative test expectations`);
  }
  if (!workflow.includes('mapping, sorting, branching')) {
    fail(`${name} must reject expectation-building logic`);
  }
  if (!workflow.includes('same production constant/helper under test')) {
    fail(`${name} must reject production-derived expected values`);
  }
  if (!workflow.includes('Default to one `expect` per test') || !workflow.includes('response.status` and `response.body')) {
    fail(`${name} must allow separate controller status and body assertions`);
  }
  if (!workflow.includes('alphabetized by exported symbol') || !workflow.includes('do not require unrelated barrel-file rewrites')) {
    fail(`${name} must review changed index re-export ordering`);
  }
  if (!workflow.includes('Review commit scope when relevant')) {
    fail(`${name} must check commit scope by change type`);
  }
  if (!workflow.includes('documentation or workflow-learning')) {
    fail(`${name} must flag mixed documentation-learning changes during review`);
  }
  if (!workflow.includes('code-organization-reference.md')) {
    fail(`${name} must link to the code organization reference`);
  }
  if (!workflow.includes('Check code organization')) {
    fail(`${name} must include an explicit code organization review step`);
  }
  if (!workflow.includes('State names should describe represented domain facts') || !workflow.includes('direct derived state')) {
    fail(`${name} must review state names and dependency-local ordering`);
  }
  if (!workflow.includes('Check simplicity')) {
    fail(`${name} must keep the Ponytail/YAGNI simplicity review step`);
  }
  if (!workflow.includes('Flag private helpers that read instance fields') || !workflow.includes('inherently bound to object state')) {
    fail(`${name} must flag hidden instance dependencies in private helpers without forcing artificial parameters`);
  }
  for (const requiredText of [
    'Start from Gold',
    'Flag cramped adjacent sibling logical blocks',
    'Report evidence-sensitive checks as `PASS`, `FAIL`, or `BLOCKED`',
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must require ${requiredText}`);
    }
  }
}

const sharedCommitGuide = read('COMMITTING.md');
const packagedCommitGuide = read('skills/commit/COMMITTING.md');
const commitWorkflow = read('docs/workflows/commit-workflow.md');
const commitFallbackWorkflow = read('skills/commit/workflow.md');
if (packagedCommitGuide !== sharedCommitGuide) {
  fail('packaged commit guide must stay synchronized with the shared commit guide');
}
if (commitFallbackWorkflow !== commitWorkflow) {
  fail('packaged commit workflow must stay synchronized with the authoritative workflow');
}
for (const [name, guide] of [
  ['shared commit guide', sharedCommitGuide],
  ['packaged commit guide', packagedCommitGuide],
]) {
  if (!guide.includes('`:art:` — completed quality improvements, cleanups, and refinements that do not fit a narrower semantic category')) {
    fail(`${name} must reserve :art: for completed quality improvements without a narrower category`);
  }
  if (!guide.includes('`:construction:` — exclusively an explicitly incomplete, application-breaking intermediate migration slice')) {
    fail(`${name} must reserve :construction: for incomplete application-breaking migration slices`);
  }
  if (!guide.includes('A completed extraction or refinement with no narrower semantic category uses `:art:`, never `:construction:`.')) {
    fail(`${name} must select :art: for a completed extraction or refinement`);
  }
  if (guide.includes(':construction: Nest document routes') || !guide.includes(':recycle: Nest document routes')) {
    fail(`${name} must not use :construction: for completed route refactors`);
  }
  if (!guide.includes('Run `check-commit-scope` after staging and before committing') || !guide.includes('Application code may share a commit with its directly corresponding tests')) {
    fail(`${name} must document the staged file-type boundary check and code-plus-test exception`);
  }
}
for (const [name, workflow] of [
  ['authoritative commit workflow', commitWorkflow],
  ['packaged commit workflow', commitFallbackWorkflow],
]) {
  if (!workflow.includes('skill://commit/COMMITTING.md')) {
    fail(`${name} must link to the packaged shared commit guide`);
  }
  if (!workflow.includes('Derive the likely emoji from the staged diff')) {
    fail(`${name} must derive the commit emoji from the staged diff`);
  }
  if (!workflow.includes('Warn and stop before creating a `:construction:` commit')) {
    fail(`${name} must warn before an unsupported :construction: commit`);
  }
  if (!workflow.includes('Run `check-commit-scope` after staging') || !workflow.includes('explicitly confirms that the categories are genuinely inseparable')) {
    fail(`${name} must check and stop on mixed staged file categories`);
  }
}
for (const [name, workflow] of [
  ['shared commit guide', sharedCommitGuide],
  ['packaged commit guide', packagedCommitGuide],
  ['authoritative commit workflow', commitWorkflow],
  ['packaged commit workflow', commitFallbackWorkflow],
]) {
  if (!workflow.includes('Keep commits cohesive and homogeneous') && !workflow.includes('Keep commits homogeneous by change type')) {
    fail(`${name} must require homogeneous commits`);
  }
  if (!workflow.includes('documentation or workflow-learning')) {
    fail(`${name} must split documentation-learning edits from code/test fixes`);
  }
  if (!workflow.includes('directly corresponding focused test')) {
    fail(`${name} must keep directly corresponding focused tests with their implementation`);
  }
  if (!workflow.includes('migrations/schema/data')) {
    fail(`${name} must split schema/data changes from other change types`);
  }
}

function resolveFirstWorkflow(projectRoot, skillName) {
  const { local, packaged } = skillContract(skillName);
  for (const localRelativePath of local) {
    const localPath = path.join(projectRoot, localRelativePath);
    if (existsSync(localPath)) return { kind: 'local', path: localPath };
  }

  const packagedWorkflow = packaged[0]?.uri;
  if (packagedWorkflow && existsSync(fallbackPath(packagedWorkflow))) return { kind: 'fallback', path: `skill://${packagedWorkflow}` };

  return { kind: 'missing', path: path.join(projectRoot, local[0]) };
}

const fixtureChecks = [];
const packagedFixture = resolveFirstWorkflow(path.join(root, '.missing-local-workflows-fixture'), 'learn');
if (packagedFixture.kind !== 'fallback') {
  fail(`Packaged fallback fixture: expected fallback, got ${packagedFixture.kind} (${packagedFixture.path})`);
}


if (process.env.WRAP_PROJECT) {
  fixtureChecks.push(
    {
      name: 'WRAP local browser QA workflow',
      projectRoot: process.env.WRAP_PROJECT,
      skillName: 'browser-qa',
      expectedKind: 'local',
    },
    {
      name: 'WRAP packaged learn workflow',
      projectRoot: process.env.WRAP_PROJECT,
      skillName: 'learn',
      expectedKind: 'fallback',
    },
  );
}

if (process.env.EXPRESS_LIGHT_RAIL_PROJECT) {
  fixtureChecks.push(
    {
      name: 'Express Light Rail packaged backend workflow',
      projectRoot: process.env.EXPRESS_LIGHT_RAIL_PROJECT,
      skillName: 'express-light-rail',
      expectedKind: 'fallback',
    },
    {
      name: 'Express Light Rail packaged Node compatibility workflow',
      projectRoot: process.env.EXPRESS_LIGHT_RAIL_PROJECT,
      skillName: 'node-express-api',
      expectedKind: 'fallback',
    },
  );
}

for (const fixture of fixtureChecks) {
  if (!existsSync(fixture.projectRoot)) {
    fail(`${fixture.name}: fixture missing at ${fixture.projectRoot}`);
    continue;
  }

  const resolved = resolveFirstWorkflow(fixture.projectRoot, fixture.skillName);
  if (resolved.kind !== fixture.expectedKind) {
    fail(`${fixture.name}: expected ${fixture.expectedKind}, got ${resolved.kind} (${resolved.path})`);
  }
}

const backwardReasoningWorkflow = read('docs/workflows/backward-reasoning-workflow.md');
const backwardReasoningFallback = read('skills/backward-reasoning/workflow.md');
const backwardReasoningSkill = read('skills/backward-reasoning/SKILL.md');
const backwardReasoningReference = read('docs/references/backward-reasoning-reference.md');
const backwardReasoningTemplate = read('docs/templates/backward-reasoning-plan-template.md');
for (const [name, content] of [
  ['authoritative backward-reasoning workflow', backwardReasoningWorkflow],
  ['packaged backward-reasoning workflow', backwardReasoningFallback],
  ['backward-reasoning reference', backwardReasoningReference],
  ['backward-reasoning template', backwardReasoningTemplate],
]) {
  for (const requiredText of ['Gold', 'counter-example', 'complexity', 'residual risk']) {
    if (!content.toLowerCase().includes(requiredText.toLowerCase())) {
      fail(`${name} must include ${requiredText}`);
    }
  }
}
for (const requiredText of [
  'docs/workflows/backward-reasoning-workflow.md',
  'agents/workflows/backward-reasoning-workflow.md',
  'workflow.md',
]) {
  if (!backwardReasoningSkill.includes(requiredText)) {
    fail(`backward-reasoning skill must include ${requiredText}`);
  }
}
if (!read('skills/self-improvement/SKILL.md').includes('backward-reasoning')) {
  fail('self-improvement skill must route design planning through backward reasoning');
}
if (!read('skills/self-improvement/workflow.md').includes('backward-reasoning workflow first')) {
  fail('packaged self-improvement workflow must route design planning through backward reasoning');
}
if (!read('docs/workflows/hands-off-agentic-coding-workflow.md').includes('backward-reasoning-workflow.md')) {
  fail('hands-off workflow must point design-heavy tasks to backward reasoning');
}
if (!read('docs/workflows/README.md').includes('backward-reasoning-workflow.md')) {
  fail('workflow README must list backward reasoning');
}
if (!read('docs/templates/README.md').includes('backward-reasoning-plan-template.md')) {
  fail('template README must list backward reasoning');
}
if (failures.length > 0) {
  console.error(failures.map((message) => `FAIL ${message}`).join('\n'));
  process.exit(1);
}

console.log('skill workflow lookup checks passed');
