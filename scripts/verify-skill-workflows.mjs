import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyDesignWorkflows } from './verify-skill-workflows-design.mjs';
import { skillContract, verifyWorkflowContracts } from './verify-skill-workflows-contracts.mjs';
import { verifyFeatureProcedures } from './verify-skill-workflows-feature-procedures.mjs';
import { verifyReviewProcedures } from './verify-skill-workflows-review-procedures.mjs';
import { verifyRoutingProcedures } from './verify-skill-workflows-routing-procedures.mjs';
import { verifyTestingProcedures } from './verify-skill-workflows-testing-procedures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  failures.push(message);
}

const packageJson = JSON.parse(read('package.json'));
if (!packageJson.scripts?.test?.includes('node scripts/verify-oversized-source-files.mjs')) {
  fail('package test gate must run the oversized-source-file fixture checks');
}
if (!packageJson.scripts?.test?.includes('node verifications/no-oversized-source-files.mjs')) {
  fail('package test gate must run the full-repository source-size verification');
}

const rootReadme = read('README.md');
const rulesReadme = read('rules/README.md');
const ruleVerificationReference = read('docs/references/rules-and-verifications-reference.md');
const currentPackageClassification = ruleVerificationReference.slice(
  ruleVerificationReference.indexOf('## Current Package Classification'),
  ruleVerificationReference.indexOf('## Code-Style Advice'),
);
for (const requiredText of [
  'Rules and verifications are complementary',
  'Both are true',
  'Advisor or review guidance',
]) {
  if (!ruleVerificationReference.includes(requiredText)) {
    fail(`rules and verifications reference must explain ${requiredText}`);
  }
}

for (const verification of packageJson.omp.verifications) {
  const verificationName = path.basename(verification.entry, '.mjs');
  if (!currentPackageClassification.includes(`\`${verificationName}\``)) {
    fail(`rules and verifications reference must classify ${verificationName}`);
  }
}
const packagedRules = readdirSync(path.join(root, 'rules'), {
  withFileTypes: true,
}).filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md');
for (const rule of packagedRules) {
  const ruleName = path.basename(rule.name, '.md');
  if (!currentPackageClassification.includes(`\`${ruleName}\``)) {
    fail(`rules and verifications reference must classify ${ruleName}`);
  }
}

if (!packageJson.files.includes('rules/')) {
  fail('package.json must package reusable OMP rules');
}
if (packagedRules.length === 0) {
  fail('rules/ must contain at least one packaged OMP rule');
}
for (const [name, text] of [
  ['README.md', rootReadme],
  ['rules/README.md', rulesReadme],
]) {
  for (const requiredText of ['active by default', 'same name', 'ttsr.disabledRules']) {
    if (!text.includes(requiredText)) {
      fail(`${name} must document default rules, same-name overrides, and deliberate disablement`);
    }
  }
}
if (rootReadme.includes('copy or link selected generic rules')) {
  fail('README.md must not describe normal plugin rules as selected opt-ins');
}

for (const requiredText of ['`verifier [no model]`', 'A UI notification alone is not correction evidence.']) {
  if (!rootReadme.includes(requiredText)) {
    fail(`README.md must document advisor correction prerequisites with ${requiredText}`);
  }
}

const alwaysLoadedGuidance = read('AGENTS.md');
for (const requiredText of [
  'independent responsibility clusters',
  'smallest cohesive seam',
  'do not split mechanically by line count',
  'option that lowers net owned complexity',
  'in this package that gate includes `node scripts/verify-oversized-source-files.mjs`',
]) {
  if (!alwaysLoadedGuidance.includes(requiredText)) {
    fail(`AGENTS.md must prevent mixed-responsibility source growth with ${requiredText}`);
  }
}

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
  return value
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
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

verifyWorkflowContracts({ root, read, fail });

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
if (!/scope:\s*['"]tool['"]/u.test(ompTargetRule)) {
  fail('OMP target rule must keep a reusable tool scope');
}

const whitespaceRule = read('rules/whitespace-matters.md');
for (const requiredText of [
  'project formatter/checker when one exists',
  'git diff --check',
  'import groups contiguous',
  'exactly one blank line',
  'Do not use consecutive blank lines',
  'default cross-project rules',
  'Project-local guidance overrides this default',
  'user explicitly directs it',
]) {
  if (!whitespaceRule.includes(requiredText)) {
    fail(`whitespace review rule must require ${requiredText}`);
  }
}

const { featureWorkflow, packagedFeatureWorkflow } = verifyFeatureProcedures({
  read,
  fail,
  alwaysLoadedGuidance,
});
verifyReviewProcedures({ read, fail });
verifyRoutingProcedures({ read, fail });
verifyTestingProcedures({ read, fail });

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

for (const requiredText of ['### End-User Preferences', 'boolean, number, or string', 'JSON objects or arrays']) {
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
  'setup docs and documented development/test wrapper',
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
  'omp-soft-boundary-guard',
  'advisory warnings for recognized local writes and moves',
  'supported `gh issue`/`gh pr`/`gh api` mutations',
  'supported `xd://github` writes',
  'canonical checkout identity',
  'requested current-checkout issue or feature workflow',
  'genuinely destructive or ambiguous Git operations',
  'merge reviewed same-origin pull requests',
  'push any necessary branch refs directly with `git push`',
  'documented direct `git push` tag command and release-publication command',
  'Do not call `ask` solely to authorize same-origin branch delivery, tag publication, or documented release publication',
  'programmatic callers that opt into `createRepositoryBoundaryGuard({ enforce: true })`',
  'Host-level authorization is limited to external, unresolved, destructive, or genuinely ambiguous targets.',
  'MUST NOT require a duplicate manual `ask`',
  'Do not switch to, create branches in, or mutate a different local checkout without explicit user confirmation.',
  'Remote issue authorization does not authorize local work in that checkout.',
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

const manualAskBeforeSameOriginDelivery =
  /\b(?:call|invoke|render|show|use)\s+`?ask`?[^.\n]{0,160}\b(?:before|prior to)[^.\n]{0,160}(?:same-origin|resolved(?: same-origin)? origin|documented (?:same-origin )?(?:tag|release)(?: publication)?)|(?:same-origin|resolved(?: same-origin)? origin|documented (?:same-origin )?(?:tag|release)(?: publication)?)[^.\n]{0,160}\b(?:before|prior to)[^.\n]{0,160}\b(?:call|invoke|render|show|use)\s+`?ask`?/iu;
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
    'check-title-case --title "<final title>"',
    're-read the title through GitHub',
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

for (const requiredText of ['layered page orchestration', 'layered-page-orchestration-workflow.md']) {
  if (!readme.includes(requiredText)) {
    fail(`README must document layered page orchestration: ${requiredText}`);
  }
}

for (const requiredText of [
  'omp-soft-boundary-guard',
  'omp plugin install github:klondikemarlen/omp-soft-boundary-guard',
  'Advisory repository-boundary warnings for local writes and moves',
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
  'Oversized Responsibility Clusters',
  'Do not split mechanically by line count',
  'marlens-rules:no-oversized-source-files',
  'Service Orchestration Readability',
  'Libraries for Generic Mechanism',
  'net owned complexity',
  'product-specific policies and behavior',
  'Review Structure, Not Metrics',
  'Readability is a delivery condition',
  'numeric proxy',
  'Scenario-Oriented Verification',
  'must not be mutated into a clean scenario',
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
  'intentional duplication is clearer than a helper that hides those facts',
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
  if (
    !workflow.includes('Default to one `expect` per test when it proves one focused observable contract') ||
    !workflow.includes('do not combine unrelated values merely to satisfy the heuristic')
  ) {
    fail(`${name} must scope one-expect guidance to one observable contract`);
  }
  if (
    !workflow.includes('Repository-native assertion patterns override generic guidance') ||
    !workflow.includes('await expect(promise).rejects.toThrow(...)') ||
    !workflow.includes('do not manually catch its rejection or aggregate it with mock-call arrays')
  ) {
    fail(`${name} must prefer native promise-error assertions over caught-error aggregates`);
  }
  if (
    !workflow.includes('Assert mock calls separately only when they are independently observable and important') ||
    !workflow.includes('response.status` and `response.body')
  ) {
    fail(`${name} must allow independently observable assertions`);
  }
  if (
    !workflow.includes('For changed test files, inspect the nearest test-directory README') ||
    !workflow.includes('report its assertion conventions and flag violations before reporting `PASS`')
  ) {
    fail(`${name} must discover and report local test assertion conventions before PASS`);
  }
  if (!workflow.includes('Treat test setup as self-contained') || !workflow.includes('stable environment setup')) {
    fail(`${name} must require self-contained test setup while allowing invariant fixtures`);
  }
  if (
    !workflow.includes(
      'shared setup or teardown hook that awaits an external, asynchronous, or potentially slow subsystem',
    ) ||
    !workflow.includes('multiplies waits, retries, polling, or cleanup by every test and worker')
  ) {
    fail(`${name} must require asynchronous test-hook fan-out assessment`);
  }
  if (
    !workflow.includes('narrowest suite or describe block') ||
    !workflow.includes('unless every test needs it') ||
    !workflow.includes('focused regression for the race or lifecycle hazard')
  ) {
    fail(`${name} must scope asynchronous invariants and retain a regression check`);
  }
  if (
    !workflow.includes('all-suite correctness reason or measured fan-out rationale') ||
    !workflow.includes('normal in-memory setup') ||
    !workflow.includes('impose timing budgets')
  ) {
    fail(`${name} must bound asynchronous hook review without constraining ordinary setup`);
  }
  if (
    !workflow.includes('For generic parsing, traversal, tokenization, serialization, or equivalent plumbing') ||
    !workflow.includes('well-maintained libraries before approving bespoke code')
  ) {
    fail(`${name} must compare generic implementation code with maintained libraries`);
  }
  if (
    !workflow.includes('lower net owned complexity') ||
    !workflow.includes('compatibility, maintenance, security') ||
    !workflow.includes('product-specific policy explicit at the library boundary')
  ) {
    fail(`${name} must select libraries by net owned complexity while preserving product policy`);
  }
  if (
    !workflow.includes('For queued or deferred work') ||
    !workflow.includes('Pass immutable delivery fields as a snapshot') ||
    !workflow.includes('focused delayed-execution or deletion-path check')
  ) {
    fail(`${name} must review deferred jobs for deleted-record dependencies`);
  }
  if (
    !workflow.includes('For migrations that split or rename persisted settings') ||
    !workflow.includes('Preserve existing explicit choices, including opt-outs') ||
    !workflow.includes('existing opt-out and a missing legacy preference')
  ) {
    fail(`${name} must review preference-splitting migrations for preserved choices`);
  }
  if (
    !workflow.includes('Before the first push or review request') ||
    !workflow.includes('closest local style and test guidance plus nearby sibling precedent') ||
    !workflow.includes('import grouping, blank-line separation, test hierarchy, naming, and focused assertions') ||
    !workflow.includes('Formatter output is not proof of local structural compliance')
  ) {
    fail(`${name} must preflight touched files against local structural style before review`);
  }
  if (
    !workflow.includes('Make readability an explicit delivery gate') ||
    !workflow.includes('before reporting `PASS`, name each independent responsibility and its side effects')
  ) {
    fail(`${name} must make structural readability a PASS condition`);
  }
  if (
    !workflow.includes('unstructured accumulation of independent scenarios') ||
    !workflow.includes('repeated mechanics') ||
    !workflow.includes('structure rather than numeric readability proxies')
  ) {
    fail(`${name} must review structural readability instead of numeric proxies`);
  }
  if (
    !workflow.includes('preserve literal scenario data locally') ||
    !workflow.includes('do not require mechanical splits or generic fixture builders')
  ) {
    fail(`${name} must preserve readable scenario fixtures without requiring generic abstractions`);
  }
  if (
    !workflow.includes('alphabetized by exported symbol') ||
    !workflow.includes('do not require unrelated barrel-file rewrites')
  ) {
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
  if (
    !workflow.includes('oversized file as a signal') ||
    !workflow.includes('mechanical split that preserves the same tangles')
  ) {
    fail(`${name} must review oversized mixed-responsibility files without requiring mechanical splits`);
  }
  if (
    !workflow.includes('State names should describe represented domain facts') ||
    !workflow.includes('direct derived state')
  ) {
    fail(`${name} must review state names and dependency-local ordering`);
  }
  if (!workflow.includes('Check simplicity')) {
    fail(`${name} must keep the Ponytail/YAGNI simplicity review step`);
  }
  if (
    !workflow.includes('Flag private helpers that read instance fields') ||
    !workflow.includes('inherently bound to object state')
  ) {
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

const commitSkill = read('skills/commit/SKILL.md');
const orderedCommitFallbackChecks = [
  'Check whether `docs/workflows/commit-workflow.md` exists. If it does, read it.',
  'Otherwise, check whether `agents/workflows/commit-workflow.md` exists. If it does, read it.',
  'If neither local workflow exists, read `skill://commit/workflow.md`',
];
let previousCommitFallbackCheck = -1;
for (const check of orderedCommitFallbackChecks) {
  const index = commitSkill.indexOf(check);
  if (index === -1) {
    fail(`commit skill must include ${check}`);
  } else if (index <= previousCommitFallbackCheck) {
    fail('commit skill must check local workflow paths in order before the packaged fallback');
  } else {
    previousCommitFallbackCheck = index;
  }
}
if (!commitSkill.includes('Treat missing local workflow files as an expected fallback branch')) {
  fail('commit skill must treat missing local workflow files as an expected fallback branch');
}
if (!commitSkill.includes('Read repository-local `COMMITTING.md` first when it exists')) {
  fail('commit skill must preserve repository-local COMMITTING.md guidance');
}
const normalizeCommitGuide = (guide) => guide.replaceAll('](../../docs/', '](docs/');
if (normalizeCommitGuide(packagedCommitGuide) !== sharedCommitGuide) {
  fail('packaged commit guide must stay synchronized with the shared commit guide');
}
if (commitFallbackWorkflow !== commitWorkflow) {
  fail('packaged commit workflow must stay synchronized with the authoritative workflow');
}
for (const [name, guide] of [
  ['shared commit guide', sharedCommitGuide],
  ['packaged commit guide', packagedCommitGuide],
]) {
  if (
    !guide.includes(
      '`:art:` — completed quality improvements, cleanups, and refinements that do not fit a narrower semantic category',
    )
  ) {
    fail(`${name} must reserve :art: for completed quality improvements without a narrower category`);
  }
  if (
    !guide.includes(
      '`:construction:` — exclusively an explicitly incomplete, application-breaking intermediate migration slice',
    )
  ) {
    fail(`${name} must reserve :construction: for incomplete application-breaking migration slices`);
  }
  if (
    !guide.includes(
      'A completed extraction or refinement with no narrower semantic category uses `:art:`, never `:construction:`.',
    )
  ) {
    fail(`${name} must select :art: for a completed extraction or refinement`);
  }
  if (guide.includes(':construction: Nest document routes') || !guide.includes(':recycle: Nest document routes')) {
    fail(`${name} must not use :construction: for completed route refactors`);
  }
  if (
    !guide.includes('Run `check-commit-scope` after staging and before committing') ||
    !guide.includes('Application code may share a commit with its directly corresponding tests')
  ) {
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
  if (
    !workflow.includes('Run `check-commit-scope` after staging') ||
    !workflow.includes('user confirms that the group is genuinely inseparable')
  ) {
    fail(`${name} must check and stop on mixed staged file categories`);
  }
  if (
    !workflow.includes('A standard source-plus-focused-test commit does not use `.commit-scope.json`') ||
    !workflow.includes(
      'Only after the checker reports a mixed file-type boundary and the user confirms that the group is genuinely inseparable',
    )
  ) {
    fail(`${name} must treat .commit-scope.json as optional exception configuration`);
  }
  if (
    !workflow.includes('inspect the complete PR diff for the same underlying issue') ||
    !workflow.includes('dedicated `:ok_hand:` commit') ||
    !workflow.includes('PR scope checked')
  ) {
    fail(`${name} must require a scoped :ok_hand: review correction commit`);
  }
}
for (const [name, workflow] of [
  ['shared commit guide', sharedCommitGuide],
  ['packaged commit guide', packagedCommitGuide],
  ['authoritative commit workflow', commitWorkflow],
  ['packaged commit workflow', commitFallbackWorkflow],
]) {
  if (
    !workflow.includes('Keep commits cohesive and homogeneous') &&
    !workflow.includes('Keep commits homogeneous by change type')
  ) {
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

function fallbackPath(uri) {
  return path.join(root, 'skills', ...uri.split('/'));
}

function resolveFirstWorkflow(projectRoot, skillName) {
  const { local, packaged } = skillContract(read, skillName);
  for (const localRelativePath of local) {
    const localPath = path.join(projectRoot, localRelativePath);
    if (existsSync(localPath)) return { kind: 'local', path: localPath };
  }

  const packagedWorkflow = packaged[0]?.uri;
  if (packagedWorkflow && existsSync(fallbackPath(packagedWorkflow)))
    return { kind: 'fallback', path: `skill://${packagedWorkflow}` };

  return { kind: 'missing', path: path.join(projectRoot, local[0]) };
}

const fixtureChecks = [];
const packagedFixture = resolveFirstWorkflow(path.join(root, '.missing-local-workflows-fixture'), 'learn');
if (packagedFixture.kind !== 'fallback') {
  fail(`Packaged fallback fixture: expected fallback, got ${packagedFixture.kind} (${packagedFixture.path})`);
}
const commitPackagedFixture = resolveFirstWorkflow(path.join(root, '.missing-local-workflows-fixture'), 'commit');
if (commitPackagedFixture.kind !== 'fallback' || commitPackagedFixture.path !== 'skill://commit/workflow.md') {
  fail(
    `Commit packaged fallback fixture: expected skill://commit/workflow.md, got ${commitPackagedFixture.kind} (${commitPackagedFixture.path})`,
  );
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

verifyDesignWorkflows(read, fail);
if (failures.length > 0) {
  console.error(failures.map((message) => `FAIL ${message}`).join('\n'));
  process.exit(1);
}

console.log('skill workflow lookup checks passed');
