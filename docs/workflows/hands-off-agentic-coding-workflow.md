# Hands-Off Agentic Coding Workflow

Use when a user wants an agent to complete a feature or bug fix with minimal active steering.

## Intent

**WHY this workflow exists:** Hands-off coding fails when agents plan before understanding, skip proof, or stop at "looks done." This workflow makes autonomy depend on context, delegation, and runnable evidence.

**WHAT this workflow produces:** A verified outcome and scoped implementation path, with a bounded plan or context handoff only where needed, and final `PASS`/`FAIL`/`BLOCKED` evidence.

**Decision Rules:**

- Project-local issue, release, contribution, and setup docs win over this generic workflow.
- Start from the success condition: name the desired behavior, invariant, or regression risk before planning or editing.
- Establish the smallest verification path before implementation continues: targeted test, build/typecheck, browser scenario, fixture diff, or a documented `BLOCKED` reason.
- When a target repository documents an `npm test` gate, run it for source-file changes; in this package that gate includes `node scripts/verify-oversized-source-files.mjs`. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when the required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- Explore before planning when scope is unclear, multi-file, or cross-subsystem.
- For unclear or multi-file work, implement the first runnable prototype after one bounded plan and iterate from its evidence. Re-plan only when that evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path.
- Skip separate framing, formal planning, and handoff artifacts for one-sentence small diffs that touch one obvious area; read the local context, patch, and verify.
- Reuse outcome, constraints, and proof already recorded in the issue or plan. Create a context handoff only for actual delegation or resumption, not as a prerequisite for solo implementation.
- Delegate only when independent substantial work or a concrete coverage need justifies the coordination cost. Do not require tester, reviewer, or competing-design agents merely because they are available.
- Completion requires final evidence in `PASS`, `FAIL`, or `BLOCKED` terms. "Looks done" is not evidence.
- Keep this repo's role to workflow, rule, skill, and prompt assets. Do not build a task runner, dashboard, queue, or orchestration runtime here.
- For design-heavy tasks, run `docs/workflows/outcome-first-planning-workflow.md` before implementation planning.

## Process

1. Choose the execution shape:
   - **Small diff:** one-sentence request, one obvious area, no exported API change. Read the local pattern, patch, and exercise the relevant proof; no separate framing record, plan, or handoff packet is required.
   - **Unclear or multi-file:** inspect the affected boundary, then make one bounded plan naming the outcome, first runnable prototype, and its proof. Reuse an existing issue or plan that already supplies this context.
2. Establish the outcome once for non-trivial work:
   - `Goal`: the user-visible outcome.
   - `Success condition`: the behavior, invariant, or regression risk that proves success.
   - `Evidence`: the smallest runnable check that can prove the success condition.
   - `Non-goals`: scope the user did not ask for.
   - Fill only gaps in the existing issue or plan; do not copy these fields into a second execution record.
3. Gate implementation on verification:
   - name the command or scenario before coding;
   - if no runnable evidence is reachable, record `BLOCKED` with the exact missing prerequisite before changing behavior.
4. Delegate only where it buys coverage:
   - keep work inline when a separate agent would only repeat context gathering or perform a small local edit;
   - use independent substantial slices or a specific design, test, or review risk to justify delegation; agent availability alone is not a reason;
   - before transfer or resumption, provide the recipient's scope, ownership, relevant observed context, proof, remaining work, and next action;
   - preserve required self-review and repository review gates whether or not a separate reviewer is useful.
5. Implement the first runnable prototype:
   - reuse existing project patterns;
   - delete obsolete paths instead of adding compatibility shims;
   - avoid new abstractions, options, dependencies, or runtime machinery unless the current task needs them.
6. Exercise the proof and iterate:
   - run the predeclared check;
   - use its result to make the next smallest change; when it fails, fix the root cause and rerun the smallest failing check;
   - re-plan only when evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path; ordinary test failures are iteration, not a new plan;
   - run broader checks only when the changed surface warrants them.
7. Report the result:
   - changed files and links;
   - final `PASS`, `FAIL`, or `BLOCKED` evidence;
   - residual risks or missing evidence, if any.

## Context Handoff Template

Use this only for an actual delegation or resumption. Include the observed context the recipient needs to act without the parent transcript; omit fields that add no actionable information. A completed solo task needs a result and proof, not a handoff packet.

These handoff fields adapt Tura's documented task-status and context-management practices: [task status](https://github.com/Tura-AI/tura/blob/main/docs/core/task-status.md) and [context management](https://github.com/Tura-AI/tura/blob/main/docs/core/context-management.md). They preserve actionable execution state without importing Tura's runtime architecture or claiming that any benchmark result is caused by one feature.

```text
Goal: <requested outcome>
Success condition: <behavior/invariant/regression risk that proves success>
Evidence: <smallest runnable check or BLOCKED reason>
Ownership: <recipient's slice, integration owner, and shared boundaries>
Relevant files/docs: <paths and why they matter>
Commands: <setup/test/release commands already observed>
Constraints: <non-goals, compatibility, security, release rules>
Links/artifacts: <issues, PRs, screenshots, logs>
Open questions: <only what tools cannot answer>
Completed: <finished work and deliverables>
Remaining: <unfinished work or none>
Validation: <checks run, outcomes, and affected dimensions not run>
Blockers: <user decision, credential, environment, or none>
Next action: <exact next tool call or user action>
```

## Output Contract

```text
Goal: <what was delivered>
Success condition: <behavior/invariant/regression risk that proves success>
Changes: <files and behavior>
Evidence: PASS/FAIL/BLOCKED <commands, scenarios, artifacts>
Links: <issues/PRs/releases>
Residual risk: <none or specific gap>
```
