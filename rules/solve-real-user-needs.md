---
name: solve-real-user-needs
description: "Prioritize evidenced user problems and useful outcomes over speculative edge-case expansion."
---

Solve real user needs, not endless hypothetical edge cases. Identify the user problem and useful observable outcome from the request, existing product context, usage, or reported failures. Do not invent demand or require new user research for an already-clear request.

Before adding edge-case handling, identify the concrete user impact, known failure, material security/data-integrity risk, or explicit contract it protects. Useful technical and infrastructure work counts when that connection is evidenced. Otherwise defer speculative expansion and follow [Simple-First Delivery](../docs/workflows/hands-off-agentic-coding-workflow.md#simple-first-delivery).

Stay inside the requested task scope. When implementation or review reveals an adjacent problem the user did not ask about, report it as a separate outcome or issue rather than silently expanding the diff; unrequested changes to code the user has not reviewed erode trust and reviewability.

If the need is unclear, inspect available context before expanding scope; clarify only a material unresolved decision. Preserve agreed requirements and known material risks rather than using simplicity as a reason to ignore them.
