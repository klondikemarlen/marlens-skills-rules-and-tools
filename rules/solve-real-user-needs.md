---
name: solve-real-user-needs
description: "Prioritize evidenced user problems and useful outcomes over speculative edge-case expansion."
---

Solve real user needs with the smallest complete requested feature set, not the most technically capable implementation. Use the request, existing product context, usage, or reported failures to identify the useful outcome. Do not invent demand or require new user research for an already-clear request.

Treat additional error handling, retries, cancellation APIs, concurrency/scalability machinery, and extensibility as features, not automatic improvements. Add them only for an explicit request, a demonstrated current workflow or failure, a binding contract, or a concrete material security/data-integrity risk. Hypothetical future users, possible failures, or an existing caller alone do not establish necessity; prefer existing owners and the smallest sufficient mechanism.

Distinguish required outcomes from optional mechanisms: obsolete results must not replace the current selection, but that does not by itself require HTTP cancellation, retries, or a request-management framework. Keep an existing sufficient mechanism rather than replacing it merely because another is shorter.

Defer optional technical features until observed use or a real problem justifies them; do not automatically implement, file tickets for, or block delivery on speculative improvements. Report material adjacent findings separately without silently expanding the diff. Review advice follows the same scope boundary.

Preserve accepted behavior, required validation/error reporting/authorization, and known correctness or material safety safeguards. This is not a blanket ban on technical work or permission to ignore a demonstrated serious defect. Clarify only a material unresolved decision after inspecting available context.
