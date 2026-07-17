# Self-Improvement Workflow

Use when asked to improve an agent's reusable guidance, prompt flow, or evidence-backed technical debt. Do not use it for vague self-reflection, a one-off project defect, or an unverified preference.

## Intent

**WHY this workflow exists:** Reusable agent guidance improves only when a concrete signal is traced to its owner and verified. Reflection without evidence creates duplicate rules, speculative abstractions, and prompt bloat.

**WHAT this workflow produces:** An evidence-backed finding, one owner and outcome per finding, and the smallest verified change or scoped proposal.

**Decision Rules:**

- Start with the target's declared purpose, public surface, and local guidance. This package supplies reusable rules, workflows, templates, and thin adapters; it is not an orchestration runtime.
- Project-local guidance wins. Keep project-specific practices in the target project; change shared guidance only for a cross-project, repeatable need.
- Technical debt is actionable only when observed evidence shows a current correctness, maintainability, safety, discoverability, or verification risk. Do not refactor for style, imagined future flexibility, or generic cleanup.
- Run the smallest existing read-only audit and behavior check relevant to the finding before proposing a change. For this package's own checkout, use `npm test`; it verifies package-owned workflow, audit, and adapter behavior. Use `node bin/agent-guidance-audit.js --strict <downstream-root>` only for the downstream repositories that tool audits.
- Classify every finding once: **fix now**, **scoped feature or bug**, **verifier/runtime proposal**, **already covered**, or **no action**. Route runtime enforcement needs to `omp-verifier`; do not create runtime machinery here.
- For prompt, command-injection, or agent-identity findings, use [`docs/templates/prompt-improvement-template.md`](../templates/prompt-improvement-template.md). A prompt change needs an observed trigger and an owner, not just a better-sounding instruction.
- Follow existing issue-filing authorization rules. Do not file an external issue without authorization for that target.

## Process

1. State the target purpose, the user-visible or maintainer-visible risk, the smallest proof, and explicit non-goals.
2. Read the target's local guidance, workflow/skill architecture, and the affected public surface. Reuse existing audit, review, and learning paths before adding guidance.
3. Run the narrowest relevant read-only audit or verification command. Record exact findings, including absent findings.
4. For each finding, record evidence, durable impact, classification, owner, and next action. Use the prompt-improvement template when it concerns a prompt or adapter.
5. Implement only **fix now** findings already authorized by the request. Keep changes in the existing placement: workflow for procedure, template for repeatable shape, reference for durable background, skill for a thin entrypoint.
6. For a **scoped feature or bug**, draft or file an issue only when authorized. For a **verifier/runtime proposal**, name the specific missing enforcement rather than adding a local workaround.
7. Verify the changed behavior with the predeclared narrow check. For package changes, update release metadata and follow the feature workflow.

## Output Contract

```text
Purpose: <target role and public boundary>
Gold: <observable invariant or risk removed>
Evidence: <audit/check and exact result>
Findings:
- <evidence> -> <classification> -> <owner/action>
Changes: <files changed, or none>
Verification: PASS | FAIL | BLOCKED <command/scenario>
Residual risk: <none or specific gap>
```
