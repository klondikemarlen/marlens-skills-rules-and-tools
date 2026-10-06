# Hands-Off Agentic Coding Workflow

Use when a user wants an agent to complete a feature or bug fix with minimal active steering.

## Intent

**WHY this workflow exists:** Hands-off coding fails when agents plan before understanding, skip proof, or stop at "looks done." This workflow makes autonomy depend on context, delegation, and runnable evidence.

**WHAT this workflow produces:** A success condition, context handoff, verification gate, scoped implementation path, delegated checks when useful, and final `PASS`/`FAIL`/`BLOCKED` evidence.

**Decision Rules:**

- Project-local issue, release, contribution, and setup docs win over this generic workflow.
- Start from the success condition: name the desired behavior, invariant, or regression risk before planning or editing.
- Establish the smallest verification path before implementation continues: targeted test, build/typecheck, browser scenario, fixture diff, or a documented `BLOCKED` reason.
- When a target repository documents an `npm test` gate, run it for source-file changes; in this package that gate includes `node scripts/verify-oversized-source-files.mjs`. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when the required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- Explore before planning when scope is unclear, multi-file, or cross-subsystem.
- For unclear or multi-file work, implement the first runnable prototype after one bounded plan and iterate from its evidence. Re-plan only when that evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path.
- Skip formal planning for one-sentence small diffs that touch one obvious area; read the local context, patch, and verify.
- Use subagents or fusion when work splits across independent repo areas, multiple designs need comparison, review/refutation would catch risk, or test authoring needs focus.
- Completion requires final evidence in `PASS`, `FAIL`, or `BLOCKED` terms. "Looks done" is not evidence.
- Keep this repo's role to workflow, rule, skill, and prompt assets. Do not build a task runner, dashboard, queue, or orchestration runtime here.

The handoff fields below adapt Tura's documented task-status and context-management practices: [task status](https://github.com/Tura-AI/tura/blob/main/docs/core/task-status.md) and [context management](https://github.com/Tura-AI/tura/blob/main/docs/core/context-management.md). They preserve actionable execution state without importing Tura's runtime architecture or claiming that any benchmark result is caused by one feature.

## Process

1. Capture the request in four lines before editing:
   - `Goal`: the user-visible outcome.
   - `Success condition`: the behavior, invariant, or regression risk that proves success.
   - `Evidence`: the smallest runnable check that can prove the success condition.
   - `Non-goals`: scope the user did not ask for.
2. Build a context handoff packet:
   - relevant files, local docs, commands, constraints, issue/PR links, screenshots/logs/artifacts, and open questions;
   - include only facts observed through tools or provided by the user.
3. Choose the execution shape:
   - **Small diff:** one-sentence request, one obvious area, no exported API change. Skip a written plan; patch directly after reading the local pattern.
   - **Unclear or multi-file:** explore once, then write the shortest bounded plan that names the goal, success condition, first runnable prototype, and its proof.
4. Gate implementation on verification:
   - name the command or scenario before coding;
   - if no runnable evidence is reachable, record `BLOCKED` with the exact missing prerequisite before changing behavior.
5. Delegate only where it buys coverage:
   - independent repo areas can run in parallel;
   - competing designs get separate exploration/refutation;
   - test authoring goes to a tester agent when available;
   - review/refutation gets a reviewer after the diff exists.
6. Implement the first runnable prototype:
   - reuse existing project patterns;
   - delete obsolete paths instead of adding compatibility shims;
   - avoid new abstractions, options, dependencies, or runtime machinery unless the current task needs them.
7. Exercise the proof and iterate:
   - run the predeclared check;
   - use its result to make the next smallest change; when it fails, fix the root cause and rerun the smallest failing check;
   - re-plan only when evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path; ordinary test failures are iteration, not a new plan;
   - run broader checks only when the changed surface warrants them.
8. Finish with a handoff:
   - changed files and links;
   - final `PASS`, `FAIL`, or `BLOCKED` evidence;
   - residual risks or missing evidence, if any.

## Context Handoff Template

```text
Goal: <requested outcome>
Success condition: <behavior/invariant/regression risk that proves success>
Evidence: <smallest runnable check or BLOCKED reason>
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
Plan: <skipped for small diff | concise phases>
Verification gate: <predeclared check or BLOCKED reason>
Changes: <files and behavior>
Evidence: PASS/FAIL/BLOCKED <commands, scenarios, artifacts>
Links: <issues/PRs/releases>
Residual risk: <none or specific gap>
```
