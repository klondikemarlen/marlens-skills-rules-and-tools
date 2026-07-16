import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
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

function resolveWorkflowPath(projectRoot, localPaths, fallbackUri) {
  for (const localPath of localPaths) {
    const candidate = path.join(projectRoot, localPath);
    if (existsSync(candidate)) return { kind: 'local', path: candidate };
  }

  const fallback = fallbackPath(fallbackUri);
  if (existsSync(fallback)) return { kind: 'packaged', path: fallback };

  return { kind: 'missing', path: fallback };
}

function skillContract(skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/(?:Local project|Legacy local project): `([^`]+)`/g)].map((match) => match[1]);
  const packaged = [...text.matchAll(/Packaged fallback: \[[^\]]+\]\(([^)]+)\).*`skill:\/\/([^`]+)`/g)].map((match) => ({
    relativePath: match[1],
    uri: match[2],
  }));
  return { text, local, packaged };
}

for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const { text, local, packaged } = skillContract(entry.name);

  if (local.length === 0) fail(`${entry.name}: missing local workflow path`);
  if (local.length % 2 !== 0) fail(`${entry.name}: local workflow order must be docs/legacy pairs`);
  for (let index = 0; index < local.length; index += 2) {
    const preferred = local[index];
    const legacy = local[index + 1];
    if (!preferred?.startsWith('docs/workflows/')) fail(`${entry.name}: preferred local workflow must use docs/workflows`);
    if (legacy !== preferred.replace('docs/workflows/', 'agents/workflows/')) {
      fail(`${entry.name}: legacy local workflow must immediately follow matching docs workflow`);
    }
  }
  if (packaged.length === 0) fail(`${entry.name}: missing packaged fallback path`);

  const absentLocalProject = mkdtempSync(path.join(os.tmpdir(), `${entry.name}-absent-local-`));

  for (const [fallbackIndex, fallback] of packaged.entries()) {
    const relativePath = path.join('skills', entry.name, fallback.relativePath);
    if (!existsSync(path.join(root, relativePath))) fail(`${entry.name}: missing Claude fallback ${fallback.relativePath}`);
    if (!existsSync(fallbackPath(fallback.uri))) fail(`${entry.name}: missing skill://${fallback.uri}`);

    const localPair = local.slice(fallbackIndex * 2, fallbackIndex * 2 + 2);
    const resolved = resolveWorkflowPath(absentLocalProject, localPair, fallback.uri);
    if (resolved.kind !== 'packaged') {
      fail(`${entry.name}: absent local workflow paths did not resolve to skill://${fallback.uri}`);
    }

    const existenceFirstFallback = 'Check candidate existence first (for example with glob). Read only the first existing local workflow file;';
    if (!text.includes(existenceFirstFallback)) fail(`${entry.name}: missing existence-first local workflow instruction`);

    const explicitFallback = `if neither local workflow exists, read \`skill://${fallback.uri}\` directly.`;
    if (!text.includes(explicitFallback)) fail(`${entry.name}: missing explicit absent-local fallback instruction for skill://${fallback.uri}`);
  }
  rmSync(absentLocalProject, { recursive: true, force: true });
}

const nodeExpressWorkflow = read('skills/node-express-api/workflow.md');
if (!nodeExpressWorkflow.includes('skill://express-light-rail/workflow.md')) {
  fail('node-express-api fallback must delegate to skill://express-light-rail/workflow.md');
}
if (!nodeExpressWorkflow.includes('[../express-light-rail/workflow.md](../express-light-rail/workflow.md)')) {
  fail('node-express-api fallback must include a Claude-readable relative workflow link');
}
if (nodeExpressWorkflow.includes('Read `docs/workflows/express-light-rail-backend-workflow.md`')) {
  fail('node-express-api fallback must not require target-project docs/workflows');
}

const expressWorkflow = read('skills/express-light-rail/workflow.md');
if (expressWorkflow.includes('Pick only the templates needed from `docs/templates/backend/express-light-rail/`')) {
  fail('express-light-rail fallback must not require target-project docs/templates');
}

const learnWorkflow = read('docs/workflows/learn-workflow.md');
const learnFallbackWorkflow = read('skills/learn/workflow.md');
if (learnWorkflow !== learnFallbackWorkflow) {
  fail('learn workflow and packaged fallback must stay synchronized');
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


const issueFilingRule = read('rules/no-issue-filing-without-confirmation.md');
if (!issueFilingRule.includes('sufficient authorization for the current repo')) {
  fail('issue filing rule must allow explicitly requested current-repo issues');
}
if (!issueFilingRule.includes('authorization for that specific target')) {
  fail('issue filing rule must keep external-project issue filing target-specific');
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
    'Self-review the complete PR diff',
    'Run targeted QA for the user-visible changed behavior',
    'Resolve every actionable review finding or comment',
    'After a fixup, repeat the complete self-review and targeted QA',
    'Keep the PR `BLOCKED`',
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
  ]) {
    if (!workflow.includes(requiredText)) {
      fail(`${name} must require ${requiredText}`);
    }
  }
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
  'Snap Chromium reports `/tmp/...png` as `This file is empty.`',
  'REST/`gh api` can edit Markdown text but cannot create the required `user-attachments/assets/...` URL',
  'After the web upload has produced a URL, API text edits may update PR/comment Markdown',
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
  'Global rules',
  'Workflows',
  'Templates',
  'References',
  'Plans',
  'Skills',
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

const ledgerTemplate = read('docs/templates/agent-guidance-ledger-template.md');
for (const requiredText of [
  'informational and audit-only',
  'must not become an allowlist',
  'agents/guidance-ledger.yml',
  'project-specific Docker/dev commands',
]) {
  if (!ledgerTemplate.includes(requiredText)) {
    fail(`agent guidance ledger template must document ${requiredText}`);
  }
}

const downstreamAuditReference = read('docs/references/downstream-agent-guidance-audit-reference.md');
for (const requiredText of [
  'read-only maintainer tooling',
  'agent-guidance-audit',
  'Markdown links to missing local files',
  'Migration ledgers are informational/audit-only',
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
  'informational/audit-only note',
]) {
  if (!fullStackCrudWorkflow.includes(requiredText)) {
    fail(`full-stack admin CRUD workflow must document ${requiredText}`);
  }
}

const backendCrudTemplate = read('docs/templates/backend/express-sequelize-crud/resource-rail-template.md');
const frontendCrudTemplate = read('docs/templates/frontend/vue-vuetify-crud/admin-resource-pages-template.md');
const searchableAutocompleteTemplate = read('docs/templates/frontend/searchable-autocomplete-template.md');
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
const codeOrganizationReference = read('docs/references/code-organization-reference.md');
const referencesIndex = read('docs/references/README.md');
for (const requiredText of [
  'Code organization is not more folders',
  'Module Decomposition',
  'Service Orchestration Readability',
  'Context/request object passed everywhere',
  'circular imports',
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
  if (!workflow.includes('Check simplicity')) {
    fail(`${name} must keep the Ponytail/YAGNI simplicity review step`);
  }
  if (!workflow.includes('Flag private helpers that read instance fields') || !workflow.includes('inherently bound to object state')) {
    fail(`${name} must flag hidden instance dependencies in private helpers without forcing artificial parameters`);
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

if (failures.length > 0) {
  console.error(failures.map((message) => `FAIL ${message}`).join('\n'));
  process.exit(1);
}

console.log('skill workflow lookup checks passed');
