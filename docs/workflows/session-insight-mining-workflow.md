# Session Insight Mining Workflow

Use after the requested work is complete when a session contains corrections, advisor findings, workflow failures, repeated friction, or other signals that may justify durable guidance or a scoped issue.

## Intent

**WHY this workflow exists:** Long sessions contain useful lessons alongside one-off friction. Mining them explicitly prevents missed reusable guidance, duplicate rules, and speculative tickets.

**WHAT this workflow produces:** Evidence-backed findings classified by owner and next action: memory, project guidance, shared guidance, verifier/runtime proposal, already covered, or no action; plus a distinct Code Style Insights section for repeated user code-review corrections.

## Decision Rules

- Inspect the current session only; do not infer lessons from unrelated history.
- Every actionable finding needs source evidence, an owner, a smallest next action, and a duplicate check.
- For resolved review threads and fixup commits, capture the concrete observable invariant, affected boundary, and smallest regression check; do not preserve only a process summary.
- Preserve repository boundaries. A finding owned by another repository becomes a scoped ticket or report for that repository; do not edit its checkout.
- Prefer existing guidance over new wording. A covered finding is reported with its citation, not duplicated.
- Keep user code-review corrections separate from product behavior findings so each has an explicit owner and persistence path.
- Classify code-style clusters as a Project-local convention, Cross-project agent guidance, or One-off preference before proposing any guidance.
- Repeated feedback in one pull request is evidence to inspect, not enough to promote a project convention into shared guidance.
- Treat repeated prompt or workflow failures as shared guidance candidates; route command, runtime, or automation gaps to the verifier/runtime owner.
- Store personal preferences and durable project facts in memory only when they are specific and likely to help future work.
- File issues only when issue filing is authorized by the current task or repository workflow.

## Process

1. Wait until the requested implementation, verification, and release work is complete.
2. Collect product behavior and delivery signals from advisor findings, resolved review threads, fixup commits, failed checks, repeated tool friction, project rules, and explicit durable preferences.
3. Collect user code-review corrections separately, preserving each correction's exact review, session, commit, or pull-request evidence.
4. Record the exact source evidence and classify each product behavior candidate:
   - **Personal preference or project fact** — persist in memory or the owning project guidance.
   - **Project-local guidance** — update the owning repository, not this package.
   - **Shared workflow/rule proposal** — update this package when authorized.
   - **Verifier/runtime proposal** — propose an `omp-verifier` change when command or harness support is required.
   - **Already covered** — cite the existing guidance and take no duplicate action.
   - **One-off/no action** — record only when the skipped decision matters.
5. Check existing files and issue history for coverage before proposing a change or filing a ticket.
6. Build the distinct **Code Style Insights** section:
   - Cluster repeated corrections by abstraction level: Project-local convention, Cross-project agent guidance, or One-off preference.
   - For each cluster, record exact evidence, classification, owner, proposed guidance text, and the smallest safe persistence action.
   - Persist project-local conventions in the owning project’s memory or documentation; do not promote them merely because they repeated within one pull request.
   - Route reusable workflow, rule, or review guidance to this package and enforcement requiring command, runtime, or automation support to `omp-verifier`.
   - When issue filing is explicitly authorized, create the scoped shared feature request or project-local ticket for the chosen owner instead of requiring another clarification. Do not file isolated, speculative, or already-covered feedback.
7. Choose the smallest safe action and its owner. For external owners, create only a scoped report or issue; never mutate the external repository.
8. Apply authorized local changes through the normal repository release workflow. Keep the mining record in the owning issue, PR, or final report rather than creating a second ledger.
9. Report every candidate with its classification, evidence, owner, action, filed link when applicable, and intentionally skipped rationale.

## Output Contract

### Code Style Insights

```text
Finding: <repeated code-style correction cluster>
Exact evidence: <review, session, commit, or pull-request citations>
Classification: <Project-local convention | Cross-project agent guidance | One-off preference>
Owner: <owning project | current repository | omp-verifier>
Proposed guidance: <candidate text, or N/A>
Persistence action: <memory/docs update, scoped issue, or no action>
```

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
