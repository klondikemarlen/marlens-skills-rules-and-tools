# Hands-Off Agentic Coding Workflow

Use when a user wants an agent to complete a feature or bug fix with minimal active steering.

## Intent

**WHY this workflow exists:** Hands-off coding fails when agents plan before understanding, skip proof, or stop at "looks done." This workflow makes autonomy depend on context, delegation, and runnable evidence.

**WHAT this workflow produces:** A verified outcome and scoped implementation path, with a bounded plan or context handoff only where needed, and final `PASS`/`FAIL`/`BLOCKED` evidence.

**Decision Rules:**

- Project-local issue, release, contribution, and setup docs win over this generic workflow.
- Start from the success condition: name the desired behavior, invariant, or regression risk before planning or editing.
- Establish the smallest verification path before implementation continues: targeted test, build/typecheck, browser scenario, fixture diff, or a documented `BLOCKED` reason.
- Prefer an established relevant suite when one exists. For a one-off tooling change without a relevant suite, use a focused disposable smoke check rather than creating a permanent bespoke runner or assertion API solely for that change; remove temporary scripts and recording fixtures afterward, and preserve reviewer-reproducible commands and truthful evidence. Keep permanent regression coverage when it fits established conventions, and intentionally establishing test infrastructure remains valid when it is accepted scope. Do not replace runnable behavioral proof with source-text assertions or inspection alone.
- When a target repository documents an `npm test` gate, run it for source-file changes; in this package that gate includes `node scripts/verify-oversized-source-files.mjs`. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when the required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- Explore before planning when scope is unclear, multi-file, or cross-subsystem.
- For unclear or multi-file work, implement the first runnable prototype after one bounded plan and iterate from its evidence. Re-plan only when that evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path.
- For initial scope and follow-up priorities, use [Simple-First Delivery](#simple-first-delivery).
- Skip separate framing, formal planning, and handoff artifacts for one-sentence small diffs that touch one obvious area; read the local context, patch, and verify.
- Reuse outcome, constraints, and proof already recorded in the issue or plan. Create a context handoff only for actual delegation or resumption, not as a prerequisite for solo implementation.
- Delegate only when independent substantial work or a concrete coverage need justifies the coordination cost. Do not require tester, reviewer, or competing-design agents merely because they are available.
- Completion requires final evidence in `PASS`, `FAIL`, or `BLOCKED` terms. "Looks done" is not evidence.
- Keep this repo's role to workflow, rule, skill, and prompt assets. Do not build a task runner, dashboard, queue, or orchestration runtime here.

## Simple-First Delivery

Deliver the smallest complete change that provides the requested user value. Prove the core path, agreed requirements, and known material security or data-integrity risks. Do not delay useful work for speculative edge cases, exhaustive permutations, optional extensibility, or polish.

Ship small, coherent increments once their acceptance criteria and required checks pass. Prioritize follow-up from observed use, reported failures, and concrete risk instead of expanding scope before release. If an agreed requirement needs deferring, obtain explicit agreement rather than declaring unfinished work complete.

### Plan Reviewable PR Slices

Before implementing broad work, consider several focused PRs rather than one large patch. In the existing bounded plan, name each useful slice's outcome, implementation boundary, verification, and dependencies. Prefer coherent, safely mergeable increments with their required callers and tests; make dependent slices' merge order explicit.

Use the first consequential slice's review and QA feedback before extending its design across the remaining work. Merely partitioning an already-written patch does not provide that early feedback or establish reduced churn.

Treat file count as a signal to consider decomposition, not a quota. A uniform mechanical change may remain together. Keep coupled contract cutovers atomic when splitting would break intermediate states, introduce unused abstractions or temporary adapters, or repeatedly rewrite the same contract. Keep isolated fixes ceremony-free and all agreed requirements in scope; one finished slice does not complete the overall request.

Focused diffs can make change amplification and recurring change clusters easier to see. During slice review, inspect disproportionate fan-out, repeated coordinated edits, and duplicated policy; distinguish necessary cross-cutting changes from avoidable coupling. Use the existing [Domain Discovery Checkpoint](../../docs/references/code-organization-reference.md#domain-discovery-checkpoint) to investigate ownership and the smallest useful organization or abstraction change before extending that pattern. Churn alone does not justify an extraction or new folder, and smaller PRs are not evidence of a measured reduction in total churn.

## Process

1. Choose the execution shape:
   - **Small diff:** one-sentence request, one obvious area, no exported API change. Read the local pattern, patch, and exercise the relevant proof; no separate framing record, plan, or handoff packet is required.
   - **Unclear or multi-file:** inspect the affected boundary, then make one bounded plan naming the outcome, first runnable prototype, and its proof. Reuse an existing issue or plan that already supplies this context. For broad work, apply [Plan Reviewable PR Slices](#plan-reviewable-pr-slices) before implementation.
2. Establish the outcome once for non-trivial work:
   - `Goal`: the user-visible outcome.
   - `Success condition`: the behavior, invariant, or regression risk that proves success.
   - `Evidence`: the smallest runnable check that can prove the success condition.
   - `Non-goals`: scope the user did not ask for.
   - Fill only gaps in the existing issue or plan; do not copy these fields into a second execution record.
3. Gate implementation on verification:
   - name the command or scenario before coding;
   - if no runnable evidence is reachable, record `BLOCKED` with the exact missing prerequisite before changing behavior.
   - when checking configuration prerequisites, use [Safe Configuration Diagnostics](#safe-configuration-diagnostics) rather than broad value dumps.
4. Delegate only where it buys coverage:
   - keep work inline when a separate agent would only repeat context gathering or perform a small local edit;
   - use independent substantial slices or a specific design, test, or review risk to justify delegation; agent availability alone is not a reason;
   - before transfer or resumption, provide the recipient's scope, ownership, relevant observed context, proof, remaining work, and next action;
   - preserve required self-review and repository review gates whether or not a separate reviewer is useful.
5. Implement the first runnable prototype:
   - before changing policy, use [Verify Existing Behavior Before Policy Changes](#verify-existing-behavior-before-policy-changes) to establish the actual gap; an already-satisfied request may need no production-policy diff.
   - reuse existing project patterns;
   - keep tests focused on one observable contract, assert real returned values/persisted records directly, and split independent outcomes rather than inventing assertion bundles. HTTP status and body together form one response contract; prefer a native or meaningful matcher such as [`toHaveHttpResponse`](../../docs/references/http-response-matcher-reference.md), and use two direct assertions only as a narrow, reasoned fallback where no suitable matcher exists and local policy permits it. Keep independent persistence effects separate. Preserve framework-native matchers and use [Assertion Quality Requires Review](../../docs/references/test-alignment-verifier-reference.md#assertion-quality-requires-review) for examples and verifier limits;
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

## Verify Existing Behavior Before Policy Changes

For a review request that could change defaults, fallback behavior, precedence, or opt-outs:

1. Trace the accepted outcome through the existing branch, relevant callers, and selecting configuration. Distinguish a selection/catalog change from a missing policy implementation.
2. Name the actual behavioral gap. If the distinction is uncertain, run the smallest existing or throwaway scenario that separates the relevant paths; do not require a truth table or broad rerun for a mechanical edit.
3. If the current path already satisfies the request, preserve it and explain the source and observed result. Do not add stricter-looking gates, renamed helpers, or tests merely to bless an unrequested semantic change.
4. If the maintainer intends a genuine policy change, state the changed default, precedence, or opt-out contract and verify it explicitly. Resolve ambiguous intent from source, the issue, and maintainer review instead of inferring a stricter default.

For example, removing an event from a configuration catalog may select an existing unconditional default branch. A small scenario with disabled global settings and empty channel selection can show that the original path already delivers. Retire the catalog entry without adding channel/global guards unless that policy change was accepted. Add a permanent regression only for a real consumer-visible gap; an unchanged accepted contract keeps its original expectations.

## Safe Configuration Diagnostics

Use when diagnosing local configuration or environment prerequisites:

1. Prefer the project's documented wrapper and selective runtime queries. Inspect structure/key names without values by default; do not read an arbitrary env-file range, run unrestricted `printenv`, or dump complete Compose configuration into tool output.
2. Retrieve only the settings explicitly needed and confirmed safe to disclose in this context. Hosts, usernames, URLs, and database names are not inherently public. If a needed value is sensitive, return an appropriate comparison/status without echoing it.
3. For credential availability or validity, emit presence or verified status only—not values, fragments, hashes, or connection strings. Presence is not proof of validity; preserve the actual probe outcome.
4. Keep sensitive output out of the initial tool result and subsequent transcripts, memories, issue/PR reports, and screenshots. Necessary local access is not permission to echo credentials. This is selective inspection, not a blanket ban on env files or a new redaction runtime.

For example, a synthetic fixture containing mode/port settings and a token can emit only the context-approved mode and port plus `tokenPresent: true`. Do not include the token or assume that those key names are always safe in a real project. Existing public-report privacy and environment-example rules retain their separate boundaries.

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
