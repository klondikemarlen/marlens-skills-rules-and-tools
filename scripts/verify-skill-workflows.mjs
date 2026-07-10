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

function fallbackPath(uri) {
  return path.join(root, 'skills', ...uri.split('/'));
}

function skillContract(skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/Local project: `([^`]+)`/g)].map((match) => match[1]);
  const fallback = [...text.matchAll(/Packaged fallback: `skill:\/\/([^`]+)`/g)].map((match) => match[1]);
  return { local, fallback };
}

for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const { local, fallback } = skillContract(entry.name);

  if (local.length === 0) fail(`${entry.name}: missing local workflow path`);
  if (fallback.length === 0) fail(`${entry.name}: missing packaged fallback path`);

  for (const uri of fallback) {
    if (!existsSync(fallbackPath(uri))) fail(`${entry.name}: missing skill://${uri}`);
  }
}

const nodeExpressWorkflow = read('skills/node-express-api/workflow.md');
if (!nodeExpressWorkflow.includes('skill://express-light-rail/workflow.md')) {
  fail('node-express-api fallback must delegate to skill://express-light-rail/workflow.md');
}
if (nodeExpressWorkflow.includes('Read `agents/workflows/express-light-rail-backend-workflow.md`')) {
  fail('node-express-api fallback must not require target-project agents/workflows');
}

const expressWorkflow = read('skills/express-light-rail/workflow.md');
if (expressWorkflow.includes('Pick only the templates needed from `agents/templates/backend/express-light-rail/`')) {
  fail('express-light-rail fallback must not require target-project agents/templates');
}

const learnWorkflow = read('agents/workflows/learn-workflow.md');
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

const commentResolutionWorkflow = read('agents/workflows/pull-request-comment-resolution-workflow.md');
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

const codeReviewWorkflow = read('agents/workflows/code-review-workflow.md');
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
const commitWorkflow = read('agents/workflows/commit-workflow.md');
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
  const localPath = path.join(projectRoot, local[0]);

  if (existsSync(localPath)) return { kind: 'local', path: localPath };
  if (fallback[0] && existsSync(fallbackPath(fallback[0]))) return { kind: 'fallback', path: `skill://${fallback[0]}` };

  return { kind: 'missing', path: localPath };
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
