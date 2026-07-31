# Session Insight Mining Workflow

Use after the requested work is complete when a session contains corrections, advisor findings, workflow failures, repeated friction, or other signals that may justify durable guidance or a scoped issue.

## Intent

**WHY this workflow exists:** Long sessions contain useful lessons alongside one-off friction. Mining them explicitly prevents missed reusable guidance, duplicate rules, and speculative tickets.

**WHAT this workflow produces:** Evidence-backed findings classified by owner and next action: memory, project guidance, shared guidance, verifier/runtime proposal, already covered, or no action.

## Decision Rules

- Inspect the current session only; do not infer lessons from unrelated history.
- Every actionable finding needs source evidence, an owner, a smallest next action, and a duplicate check.
- For resolved review threads and fixup commits, capture the concrete observable invariant, affected boundary, and smallest regression check; do not preserve only a process summary.
- Preserve repository boundaries. A finding owned by another repository becomes a scoped ticket or report for that repository; do not edit its checkout.
- Prefer existing guidance over new wording. A covered finding is reported with its citation, not duplicated.
- Treat repeated prompt or workflow failures as shared guidance candidates; route command, runtime, or automation gaps to the verifier/runtime owner.
- Store personal preferences and durable project facts in memory only when they are specific and likely to help future work.
- File issues only when issue filing is authorized by the current task or repository workflow.

## Process

1. Wait until the requested implementation, verification, and release work is complete.
2. Collect candidate signals from user corrections, advisor findings, resolved review threads, fixup commits, failed checks, repeated tool friction, project rules, and explicit durable preferences.
3. Record the exact source evidence and classify each candidate:
   - **Personal preference or project fact** — persist in memory or the owning project guidance.
   - **Project-local guidance** — update the owning repository, not this package.
   - **Shared workflow/rule proposal** — update this package when authorized.
   - **Verifier/runtime proposal** — propose an `omp-verifier` change when command or harness support is required.
   - **Already covered** — cite the existing guidance and take no duplicate action.
   - **One-off/no action** — record only when the skipped decision matters.
4. Check existing files and issue history for coverage before proposing a change or filing a ticket.
5. Choose the smallest safe action and its owner. For external owners, create only a scoped report or issue; never mutate the external repository.
6. Apply authorized local changes through the normal repository release workflow. Keep the mining record in the owning issue, PR, or final report rather than creating a second ledger.
7. Report every candidate with its classification, evidence, owner, action, filed link when applicable, and intentionally skipped rationale.

## Output Contract

```text
Finding: <short name>
Classification: <personal/project/shared/verifier/already covered/no action>
Evidence: <user correction, advisor finding, resolved review thread, fixup commit, command, file, or issue>
Invariant: <observable behavior or domain fact that must remain true, or N/A>
Boundary: <affected module, API, serializer, UI route, workflow, or N/A>
Smallest check: <focused regression check or N/A>
Owner: <memory, current repository, owning repository, or omp-verifier>
Action: <smallest action taken or proposed>
Link: <issue/PR/memory link, or N/A>
```

Include all actionable findings and any no-action decisions needed to explain the scope. Do not report speculative improvements as completed work.
