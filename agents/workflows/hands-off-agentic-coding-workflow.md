# Hands-Off Agentic Coding Workflow

Use when a user wants an agent to complete a feature or bug fix with minimal active steering.

## Intent

**WHY this workflow exists:** Hands-off coding fails when agents plan before understanding, skip proof, or stop at "looks done." This workflow makes autonomy depend on context, delegation, and runnable evidence.

**WHAT this workflow produces:** A Gold statement, context handoff, verification gate, scoped implementation path, delegated checks when useful, and final `PASS`/`FAIL`/`BLOCKED` evidence.

**Decision Rules:**

- Project-local issue, release, contribution, and setup docs win over this generic workflow.
- Start from Gold: name the desired behavior, invariant, or regression risk before planning or editing.
- Establish the smallest verification path before implementation continues: targeted test, build/typecheck, browser scenario, fixture diff, or a documented `BLOCKED` reason.
- Explore before planning when scope is unclear, multi-file, or cross-subsystem.
- Skip formal planning for one-sentence small diffs that touch one obvious area; read the local context, patch, and verify.
- Use subagents or fusion when work splits across independent repo areas, multiple designs need comparison, review/refutation would catch risk, or test authoring needs focus.
- Completion requires final evidence in `PASS`, `FAIL`, or `BLOCKED` terms. "Looks done" is not evidence.
- Keep this repo's role to workflow, rule, skill, and prompt assets. Do not build a task runner, dashboard, queue, or orchestration runtime here.

## Process

1. Capture the request in four lines before editing:
   - `Goal`: the user-visible outcome.
   - `Gold`: the behavior, invariant, or regression risk that proves success.
   - `Evidence`: the smallest runnable check that can prove Gold.
   - `Non-goals`: scope the user did not ask for.
2. Build a context handoff packet:
   - relevant files, local docs, commands, constraints, issue/PR links, screenshots/logs/artifacts, and open questions;
   - include only facts observed through tools or provided by the user.
3. Choose the execution shape:
   - **Small diff:** one-sentence request, one obvious area, no exported API change. Skip a written plan; patch directly after reading the local pattern.
   - **Unclear or multi-file:** explore first, then write the shortest plan that covers the flow end to end.
4. Gate implementation on verification:
   - name the command or scenario before coding;
   - if no runnable evidence is reachable, record `BLOCKED` with the exact missing prerequisite before changing behavior.
5. Delegate only where it buys coverage:
   - independent repo areas can run in parallel;
   - competing designs get separate exploration/refutation;
   - test authoring goes to a tester agent when available;
   - review/refutation gets a reviewer after the diff exists.
6. Implement the smallest working change:
   - reuse existing project patterns;
   - delete obsolete paths instead of adding compatibility shims;
   - avoid new abstractions, options, dependencies, or runtime machinery unless the current task needs them.
7. Verify and repair:
   - run the predeclared check;
   - if it fails, fix the root cause and rerun the smallest failing check;
   - run broader checks only when the changed surface warrants them.
8. Finish with a handoff:
   - changed files and links;
   - final `PASS`, `FAIL`, or `BLOCKED` evidence;
   - residual risks or missing evidence, if any.

## Context Handoff Template

```text
Goal: <requested outcome>
Gold: <behavior/invariant/regression risk that proves success>
Evidence: <smallest runnable check or BLOCKED reason>
Relevant files/docs: <paths and why they matter>
Commands: <setup/test/release commands already observed>
Constraints: <non-goals, compatibility, security, release rules>
Links/artifacts: <issues, PRs, screenshots, logs>
Open questions: <only what tools cannot answer>
```

## Pasteable Prompt

```text
Use the hands-off agentic coding workflow for: <feature or bug fix>.
Start from Gold: state the behavior/invariant and the smallest runnable evidence before coding. Explore before planning if scope is unclear or multi-file; skip formal planning for a one-sentence small diff. Use subagents for independent areas, design refutation, review, or test authoring. Finish only with PASS/FAIL/BLOCKED evidence, changed files, and issue/PR links.
```

## Output Contract

```text
Goal: <what was delivered>
Gold: <success condition>
Plan: <skipped for small diff | concise phases>
Verification gate: <predeclared check or BLOCKED reason>
Changes: <files and behavior>
Evidence: PASS/FAIL/BLOCKED <commands, scenarios, artifacts>
Links: <issues/PRs/releases>
Residual risk: <none or specific gap>
```
