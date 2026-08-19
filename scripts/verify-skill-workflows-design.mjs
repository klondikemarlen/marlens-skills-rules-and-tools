export function verifyDesignWorkflows(read, fail) {
  const outcomeFirstPlanningWorkflow = read('docs/workflows/outcome-first-planning-workflow.md');
  const outcomeFirstPlanningFallback = read('skills/outcome-first-planning/workflow.md');
  const outcomeFirstPlanningSkill = read('skills/outcome-first-planning/SKILL.md');
  const outcomeFirstPlanningReference = read('docs/references/outcome-first-planning-reference.md');
  const outcomeFirstPlanningTemplate = read('docs/templates/outcome-first-plan-template.md');
  for (const [name, content] of [
    ['authoritative outcome-first-planning workflow', outcomeFirstPlanningWorkflow],
    ['packaged outcome-first-planning workflow', outcomeFirstPlanningFallback],
    ['outcome-first-planning reference', outcomeFirstPlanningReference],
    ['outcome-first plan template', outcomeFirstPlanningTemplate],
  ]) {
    for (const requiredText of ['Gold', 'counter-example', 'complexity', 'residual risk']) {
      if (!content.toLowerCase().includes(requiredText.toLowerCase())) {
        fail(`${name} must include ${requiredText}`);
      }
    }
  }
  for (const requiredText of [
    'docs/workflows/outcome-first-planning-workflow.md',
    'agents/workflows/outcome-first-planning-workflow.md',
    'workflow.md',
  ]) {
    if (!outcomeFirstPlanningSkill.includes(requiredText)) {
      fail(`outcome-first-planning skill must include ${requiredText}`);
    }
  }
  if (!read('skills/self-improvement/SKILL.md').includes('outcome-first-planning')) {
    fail('self-improvement skill must route design planning through outcome-first planning');
  }
  if (!read('skills/self-improvement/workflow.md').includes('outcome-first-planning workflow first')) {
    fail('packaged self-improvement workflow must route design planning through outcome-first planning');
  }
  if (!read('docs/workflows/hands-off-agentic-coding-workflow.md').includes('outcome-first-planning-workflow.md')) {
    fail('hands-off workflow must point design-heavy tasks to outcome-first planning');
  }
  if (!read('docs/workflows/README.md').includes('outcome-first-planning-workflow.md')) {
    fail('workflow README must list outcome-first planning');
  }
  if (!read('docs/templates/README.md').includes('outcome-first-plan-template.md')) {
    fail('template README must list outcome-first planning');
  }

  const handsOffWorkflows = [
    ['authoritative hands-off workflow', read('docs/workflows/hands-off-agentic-coding-workflow.md')],
    ['packaged hands-off workflow', read('skills/hands-off-agentic-coding/workflow.md')],
  ];
  for (const [name, workflow] of handsOffWorkflows) {
    for (const requiredText of [
      'Completed:',
      'Remaining:',
      'Validation:',
      'Blockers:',
      'Next action:',
      "Tura's documented task-status",
      'in this package that gate includes `node scripts/verify-oversized-source-files.mjs`',
    ]) {
      if (!workflow.includes(requiredText)) {
        fail(`${name} must include ${requiredText}`);
      }
    }
  }
}
