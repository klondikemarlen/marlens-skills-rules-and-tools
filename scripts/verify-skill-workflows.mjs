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

function claudeFallbackPath(skillName, relativePath) {
  return path.normalize(path.join(root, 'skills', skillName, relativePath));
}

function skillContract(skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/Local project: `([^`]+)`/g)].map((match) => match[1]);
  const fallback = [...text.matchAll(/OMP: `skill:\/\/([^`]+)`/g)].map((match) => match[1]);
  const claudeFallback = [...text.matchAll(/Claude Code: `\$\{CLAUDE_SKILL_DIR\}\/([^`]+)`/g)].map((match) => match[1]);
  return { local, fallback, claudeFallback };
}

for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const { local, fallback, claudeFallback } = skillContract(entry.name);

  if (local.length === 0) fail(`${entry.name}: missing local workflow path`);
  if (fallback.length === 0) fail(`${entry.name}: missing OMP packaged fallback path`);
  if (claudeFallback.length === 0) fail(`${entry.name}: missing Claude packaged fallback path`);
  if (fallback.length !== claudeFallback.length) fail(`${entry.name}: OMP and Claude fallback counts differ`);

  for (const uri of fallback) {
    if (!existsSync(fallbackPath(uri))) fail(`${entry.name}: missing skill://${uri}`);
  }

  for (const relativePath of claudeFallback) {
    if (!existsSync(claudeFallbackPath(entry.name, relativePath))) {
      fail(`${entry.name}: missing Claude fallback ${relativePath}`);
    }
  }
}

const packageJson = JSON.parse(read('package.json'));

const pluginManifest = JSON.parse(read('claude-plugin/.claude-plugin/plugin.json'));
if (pluginManifest.name !== 'marlens-skills-rules-and-tools') {
  fail('Claude plugin manifest must use the package plugin name');
}
if (!pluginManifest.skills?.includes('./skills') || !existsSync(path.join(root, 'claude-plugin', 'skills'))) {
  fail('Claude plugin manifest must expose in-root ./skills');
}

const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
const marketplacePlugin = marketplace.plugins?.find((plugin) => plugin.name === 'marlens-skills-rules-and-tools');
if (!marketplacePlugin) {
  fail('Claude marketplace must list marlens-skills-rules-and-tools');
} else if (marketplacePlugin.source !== './claude-plugin') {
  fail('Claude marketplace must install the dedicated Claude plugin root');
}
if (pluginManifest.version !== packageJson.version) {
  fail('Claude plugin manifest version must match package.json');
}
if (marketplacePlugin?.version !== packageJson.version) {
  fail('Claude marketplace plugin version must match package.json');
}

const nodeExpressWorkflow = read('skills/node-express-api/workflow.md');
if (!nodeExpressWorkflow.includes('skill://express-light-rail/workflow.md')) {
  fail('node-express-api fallback must delegate to skill://express-light-rail/workflow.md');
}
if (!nodeExpressWorkflow.includes('${CLAUDE_SKILL_DIR}/../express-light-rail/workflow.md')) {
  fail('node-express-api fallback must delegate to adjacent Claude express workflow');
}
if (nodeExpressWorkflow.includes('Read `agents/workflows/express-light-rail-backend-workflow.md`')) {
  fail('node-express-api fallback must not require target-project agents/workflows');
}

const expressWorkflow = read('skills/express-light-rail/workflow.md');
if (expressWorkflow.includes('Pick only the templates needed from `agents/templates/backend/express-light-rail/`')) {
  fail('express-light-rail fallback must not require target-project agents/templates');
}

const pullRequestWorkflow = read('skills/pull-request-management/workflow.md');
if (!pullRequestWorkflow.includes('${CLAUDE_SKILL_DIR}/title-casing.md')) {
  fail('pull-request-management workflow must expose Claude title-casing fallback');
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
