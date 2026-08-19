import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

export function skillContract(read, skillName) {
  const text = read(path.join('skills', skillName, 'SKILL.md'));
  const local = [...text.matchAll(/`((?:docs|agents)\/workflows\/[^`]+)`/g)].map((match) => match[1]);
  const packaged = [...text.matchAll(/\[[^\]]+\]\(([^)]*workflow\.md)\)/g)].map((match) => {
    const relativePath = match[1];
    return { relativePath, uri: path.posix.join(skillName, relativePath) };
  });
  return { local, packaged };
}

export function verifyWorkflowContracts({ root, read, fail }) {
  function fallbackPath(uri) {
    return path.join(root, 'skills', ...uri.split('/'));
  }

  for (const entry of readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const { local, packaged } = skillContract(read, entry.name);

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

  const sessionInsightWorkflows = [
    ['authoritative session insight workflow', read('docs/workflows/session-insight-mining-workflow.md')],
    ['packaged session insight workflow', read('skills/session-insight-mining/workflow.md')],
  ];
  for (const [name, workflow] of sessionInsightWorkflows) {
    for (const requiredText of [
      'Inspect the current session only',
      'Every actionable finding needs source evidence, an owner, a smallest next action, and a duplicate check',
      'resolved review threads and fixup commits',
      'concrete observable invariant',
      'affected boundary',
      'smallest regression check',
      'Invariant:',
      'Boundary:',
      'Smallest check:',
      'Preserve repository boundaries',
      'Project-local guidance',
      'Shared workflow/rule proposal',
      'Verifier/runtime proposal',
      'Already covered',
      'One-off/no action',
      'Output Contract',
      '### Code Style Insights',
      'Exact evidence:',
      'Project-local convention',
      'Cross-project agent guidance',
      'One-off preference',
      'Proposed guidance:',
      'Persistence action:',
      'When issue filing is explicitly authorized',
      'Collect user code-review corrections separately',
      'do not promote them merely because they repeated within one pull request',
      'intentionally skipped rationale',
    ]) {
      if (!workflow.includes(requiredText)) {
        fail(`${name} must include ${requiredText}`);
      }
    }

    if (workflow.indexOf('Check existing files and issue history for coverage') > workflow.indexOf('When issue filing is explicitly authorized')) {
      fail(`${name} must check duplicate coverage before filing code-style insight tickets`);
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
}
