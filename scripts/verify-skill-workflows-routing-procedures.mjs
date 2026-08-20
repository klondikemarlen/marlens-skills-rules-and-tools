import { requireEvery } from "./verify-skill-workflows-assertions.mjs"

export function verifyRoutingProcedures({ read, fail }) {
  const layeredPageWorkflows = [
    [
      "authoritative layered-page workflow",
      read("docs/workflows/layered-page-orchestration-workflow.md"),
    ],
    ["packaged layered-page workflow", read("skills/layered-page-orchestration/workflow.md")],
  ]
  for (const [name, workflow] of layeredPageWorkflows) {
    requireEvery(
      workflow,
      [
        "initial route only decides between concrete pathways",
        "route replacement",
        "unmounted after redirect",
        "Do not add a resolver layer",
        "## Routing Example",
      ],
      (requiredText) => `${name} must include ${requiredText}`,
      fail
    )
  }
}
