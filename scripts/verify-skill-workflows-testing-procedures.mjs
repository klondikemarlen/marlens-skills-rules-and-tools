import { requireEvery } from "./verify-skill-workflows-assertions.mjs"

export function verifyTestingProcedures({ read, fail }) {
  const testingInstructionsWorkflow = read("docs/workflows/testing-instructions-workflow.md")
  const packagedTestingInstructionsWorkflow = read("skills/testing-instructions/workflow.md")
  const browserQaTestingInstructionsWorkflow = read(
    "skills/browser-qa/testing-instructions-workflow.md"
  )
  for (const [name, workflow] of [
    ["authoritative testing instructions workflow", testingInstructionsWorkflow],
    ["packaged testing instructions workflow", packagedTestingInstructionsWorkflow],
    ["browser QA testing instructions workflow", browserQaTestingInstructionsWorkflow],
  ]) {
    requireEvery(
      workflow,
      ["Start from Gold", "Use `PASS`, `FAIL`, and `BLOCKED`"],
      (requiredText) => `${name} must require ${requiredText}`,
      fail
    )
  }
  for (const [name, workflow] of [
    ["authoritative testing instructions workflow", testingInstructionsWorkflow],
    ["packaged testing instructions workflow", packagedTestingInstructionsWorkflow],
  ]) {
    requireEvery(
      workflow,
      ["## Evidence Ownership", "Documentation or guidance", "Tura's [contribution guide]"],
      (requiredText) => `${name} must include ${requiredText}`,
      fail
    )
  }
}
