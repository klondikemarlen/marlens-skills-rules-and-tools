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

function resolveFirstWorkflow(projectRoot, skillName) {
  const { local, fallback } = skillContract(skillName);
  const localPath = path.join(projectRoot, local[0]);

  if (existsSync(localPath)) return { kind: 'local', path: localPath };
  if (fallback[0] && existsSync(fallbackPath(fallback[0]))) return { kind: 'fallback', path: `skill://${fallback[0]}` };

  return { kind: 'missing', path: localPath };
}

const fixtureChecks = [];

if (process.env.WRAP_PROJECT) {
  fixtureChecks.push({
    name: 'WRAP local browser QA workflow',
    projectRoot: process.env.WRAP_PROJECT,
    skillName: 'browser-qa',
    expectedKind: 'local',
  });
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
