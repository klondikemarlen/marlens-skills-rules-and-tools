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

function fallbackPath(uri) {
  return path.join(root, 'skills', ...uri.split('/'));
}

function skillContract(skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/(?:Local project|Legacy local project): `([^`]+)`/g)].map((match) => match[1]);
  const packaged = [...text.matchAll(/Packaged fallback: \[[^\]]+\]\(([^)]+)\).*`skill:\/\/([^`]+)`/g)].map((match) => ({
    relativePath: match[1],
    uri: match[2],
  }));
  return { local, packaged };
}

for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const { local, packaged } = skillContract(entry.name);

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

  for (const fallback of packaged) {
    const relativePath = path.join('skills', entry.name, fallback.relativePath);
    if (!existsSync(path.join(root, relativePath))) fail(`${entry.name}: missing Claude fallback ${fallback.relativePath}`);
    if (!existsSync(fallbackPath(fallback.uri))) fail(`${entry.name}: missing skill://${fallback.uri}`);
  }
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

const learnerWorkflow = read('docs/workflows/learner-feedback-workflow.md');
const learnerFallbackWorkflow = read('skills/learner/workflow.md');
const learnerEval = JSON.parse(read('docs/evals/learner-feedback.json'));
if (learnerWorkflow !== learnerFallbackWorkflow) {
  fail('learner workflow and packaged fallback must stay synchronized');
}
if (!learnerWorkflow.includes('before_agent_start') || !learnerWorkflow.includes('default-inactive tools') || !learnerWorkflow.includes('persisted guidance')) {
  fail('learner workflow must document the verifier-style persisted toggle and tool activation path');
}
if (!learnerWorkflow.includes('autolearn.enabled')) {
  fail('learner workflow must document the built-in autolearn boundary');
}
if (!learnerWorkflow.includes('commit_file_grouping') || !learnerWorkflow.includes('insufficient_context')) {
  fail('learner workflow must define commit grouping and insufficient context categories');
}
if (!learnerEval.cases?.some((testCase) => testCase.id === 'insufficient-context-commit-grouping-negative')) {
  fail('learner eval must include negative commit grouping provenance');
}
if (!learnerEval.cases?.some((testCase) => testCase.id === 'verifier-overlap')) {
  fail('learner eval must include verifier-overlap/no-action coverage');
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
}

const sharedCommitGuide = read('COMMITTING.md');
const commitWorkflow = read('docs/workflows/commit-workflow.md');
const commitFallbackWorkflow = read('skills/commit/workflow.md');
for (const [name, workflow] of [
  ['shared commit guide', sharedCommitGuide],
  ['authoritative commit workflow', commitWorkflow],
  ['packaged commit workflow', commitFallbackWorkflow],
]) {
  if (!workflow.includes('Keep commits cohesive and homogeneous') && !workflow.includes('Keep commits homogeneous by change type')) {
    fail(`${name} must require homogeneous commits`);
  }
  if (!workflow.includes('documentation or workflow-learning')) {
    fail(`${name} must split documentation-learning edits from code/test fixes`);
  }
  if (!workflow.includes('migrations/schema/data')) {
    fail(`${name} must split schema/data changes from other change types`);
  }
}

function resolveFirstWorkflow(projectRoot, skillName) {
  const { local, fallback } = skillContract(skillName);
  for (const localRelativePath of local) {
    const localPath = path.join(projectRoot, localRelativePath);
    if (existsSync(localPath)) return { kind: 'local', path: localPath };
  }

  if (fallback[0] && existsSync(fallbackPath(fallback[0]))) return { kind: 'fallback', path: `skill://${fallback[0]}` };

  return { kind: 'missing', path: path.join(projectRoot, local[0]) };
}

const fixtureChecks = [];

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
