import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const reference = read('../docs/references/code-organization-reference.md');
const authoritativeReview = read('../docs/workflows/code-review-workflow.md');
const packagedReview = read('../skills/code-review/workflow.md');
const authoritativeSelfImprovement = read('../docs/workflows/self-improvement-workflow.md');
const packagedSelfImprovement = read('../skills/self-improvement/workflow.md');

function domainGuidance(workflow) {
  return workflow
    .split('\n')
    .filter(
      (line) =>
        line.includes('Before proposing a reorganization') ||
        line.includes('Treat domain discovery as a recurring phase') ||
        line.includes('Revisit domain hypotheses before proposing refactoring'),
    )
    .join('\n')
    .replaceAll('../../docs/references/code-organization-reference.md', 'REFERENCE')
    .replaceAll('../references/code-organization-reference.md', 'REFERENCE')
    .replaceAll('docs/references/code-organization-reference.md', 'REFERENCE');
}

assert.equal(domainGuidance(authoritativeReview), domainGuidance(packagedReview));
assert.equal(domainGuidance(authoritativeSelfImprovement), domainGuidance(packagedSelfImprovement));

assert.match(reference, /## Domain Discovery Checkpoint/);
assert.match(reference, /repeated change clusters and code churn/);
assert.match(reference, /Do not reorganize based on folder names or churn counts alone/);
for (const workflow of [authoritativeReview, packagedReview]) {
  assert.match(workflow, /Before proposing a reorganization, run the domain-discovery checkpoint/);
  assert.match(workflow, /record each candidate's evidence, responsibilities, boundary, and smallest safe next action/);
}
for (const workflow of [authoritativeSelfImprovement, packagedSelfImprovement]) {
  assert.match(workflow, /domain discovery as a recurring phase/);
  assert.match(workflow, /Revisit domain hypotheses before proposing refactoring or organization changes/);
}
const scenario = {
  folders: [
    'release/paths/github_to_gitlab/validate.ts',
    'release/paths/github_to_gitlab/translate.ts',
    'release/paths/gitlab_to_github/validate.ts',
    'release/paths/shared/manifest.ts',
  ],
  changeHistory: [
    ['release/paths/github_to_gitlab/validate.ts', 'release/paths/github_to_gitlab/translate.ts'],
    ['release/paths/github_to_gitlab/validate.ts', 'release/paths/github_to_gitlab/translate.ts'],
    ['release/paths/github_to_gitlab/validate.ts', 'release/paths/github_to_gitlab/translate.ts'],
    ['release/paths/shared/manifest.ts'],
  ],
};

function directoryOf(file) {
  return file.slice(0, file.lastIndexOf('/'));
}

function discoverCandidateDomains({ folders, changeHistory }) {
  const topology = new Set(folders.map(directoryOf));
  const changesByDirectory = new Map();

  for (const changedFiles of changeHistory) {
    for (const file of changedFiles) {
      const directory = directoryOf(file);
      changesByDirectory.set(directory, (changesByDirectory.get(directory) ?? 0) + 1);
    }
  }

  return [...changesByDirectory.entries()]
    .filter(([directory, changeCount]) => topology.has(directory) && changeCount > 1)
    .map(([boundary, changeCount]) => ({
      name: boundary.split('/').at(-1),
      evidence: [`folder topology: ${boundary}`, `repeated changes: ${changeCount}`],
      ownedResponsibilities: ['path-specific validation and translation'],
      boundary,
      smallestSafeNextAction: `inspect ${boundary} as one change boundary before moving files`,
    }));
}

const candidates = discoverCandidateDomains(scenario);
const candidate = candidates.find(({ boundary }) => boundary === 'release/paths/github_to_gitlab');

assert.ok(candidate, 'repeated changes should reveal a latent path domain');
assert.equal(candidate.name, 'github_to_gitlab');
assert.deepEqual(candidate.evidence, ['folder topology: release/paths/github_to_gitlab', 'repeated changes: 6']);
assert.deepEqual(candidate.ownedResponsibilities, ['path-specific validation and translation']);
assert.equal(
  candidate.smallestSafeNextAction,
  'inspect release/paths/github_to_gitlab as one change boundary before moving files',
);
assert.equal(
  Object.prototype.hasOwnProperty.call(scenario, 'domainName'),
  false,
  'the scenario must not supply a domain name',
);

console.log('Domain discovery scenario passed');
