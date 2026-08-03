export function verifyDesignWorkflows(read, fail) {
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

  const handsOffWorkflows = [
    ['authoritative hands-off workflow', read('docs/workflows/hands-off-agentic-coding-workflow.md')],
    ['packaged hands-off workflow', read('skills/hands-off-agentic-coding/workflow.md')],
  ];
  for (const [name, workflow] of handsOffWorkflows) {
    for (const requiredText of ['Completed:', 'Remaining:', 'Validation:', 'Blockers:', 'Next action:', "Tura's documented task-status", 'in this package that gate includes `node scripts/verify-oversized-source-files.mjs`']) {
      if (!workflow.includes(requiredText)) {
        fail(`${name} must include ${requiredText}`);
      }
    }
  }
}
