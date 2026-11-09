---
name: solve-real-user-needs
description: "Prioritize evidenced user problems and useful outcomes over speculative edge-case expansion."
---

Solve real user needs with the smallest complete requested feature set, not the most technically capable implementation. Use the request, existing product context, usage, or reported failures to identify the useful outcome. Do not invent demand or require new user research for an already-clear request.

Developers and package consumers are end users too. Identify the actual human consumer, discoverable native entrypoint, and normal journey through first successful use, routine reuse/update, status, and recovery. Reuse already-clear requirements rather than making the person repeat them. Backend/API success alone does not prove consumer activation or maintenance; missing routine controls are a product gap, not something solved by a longer runbook.

Where safe, the product should derive and manage its own paths, prerequisites, state, and refresh lifecycle instead of asking people to remember implementation details or orchestrate routine steps. Prefer coherent native controls, sensible defaults, clear status/errors, and optional help for advanced details. An already-simple CLI may be the right interface; do not require a GUI, slash command, or arbitrary click/command-count quota. Keep lower-level procedures available for advanced use and diagnostics.

Consequential choices, explicit consent, authorization, data ownership, and unavailable information remain human responsibilities. Do not bypass authentication or privilege boundaries, hide destructive effects, suppress failures, or enable unrelated automation for simplicity. Validate the accepted consumer journey on the installed/released surface where applicable, including ongoing maintenance and meaningful recovery, not just the underlying mechanism.

Treat additional error handling, retries, cancellation APIs, concurrency/scalability machinery, and extensibility as features, not automatic improvements. Distinguish an accepted requirement from an agent-invented defense: an explicit request, supported behavior, binding contract, demonstrated workflow/failure, or concrete material security/data-integrity risk can establish a need; a merely possible failure, hypothetical future user, or existing caller alone does not.

Before choosing a mechanism, decide in order:

1. **Is the problem worth solving now?** Assess likelihood under realistic normal use, consequence and recoverability, actual project scale, and quality expectations against implementation, test, and ongoing maintenance cost. Available evidence and labeled assumptions suffice; do not require telemetry or quantitative thresholds. Accept unlikely, low-impact imperfections when the contract allows, but protect against credible serious harm even at low frequency.
2. **Does it belong in this change?** Useful work can still be unrelated to the accepted outcome or owned elsewhere. Keep required and justified in-scope work; defer worthwhile out-of-scope work and omit unjustified additions. Report material adjacent findings separately without silently expanding the diff, automatically filing tickets, or blocking delivery on optional work. Review advice follows the same boundary.
3. **What is the smallest sufficient mechanism?** Prefer existing owners and keep an existing sufficient mechanism rather than replacing it merely because another is shorter.

For example, a speculative, briefly stale display may deliberately remain unhandled when normal use, impact, recovery, and the accepted contract do not justify prevention. If the accepted correctness contract requires obsolete results never to replace the current selection, that outcome remains binding; it does not by itself require HTTP cancellation, retries, or a request-management framework. Cancellation can be useful and justified; assess its need rather than banning it.

Preserve accepted behavior, required validation/error reporting/authorization, and known correctness or material safety safeguards. This is not a blanket ban on technical work or permission to ignore a demonstrated serious defect. Clarify only a material unresolved decision after inspecting available context.
