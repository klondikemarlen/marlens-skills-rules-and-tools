# Hands-Off Agentic Coding Workflow

Use when a user wants an agent to complete a feature or bug fix with minimal active steering.

## Intent

**WHY this workflow exists:** Hands-off coding fails when agents plan before understanding, skip proof, or stop at "looks done." This workflow makes autonomy depend on context, delegation, and runnable evidence.

**WHAT this workflow produces:** A verified outcome and scoped implementation path, with a bounded plan or context handoff only where needed, and final `PASS`/`FAIL`/`BLOCKED` evidence.

**Decision Rules:**

- Project-local issue, release, contribution, and setup docs win over this generic workflow.
- Before new implementation, apply [Checkout Selection](../worktree-creation/workflow.md#checkout-selection): default to an appropriate separate worktree, reuse a registered continuation, and honor explicit checkout/boundary instructions. This applies outside feature-labeled work too; use the existing creation/setup procedure rather than duplicating it.
- When starting or resuming actual ticket work, apply [Ticket Lifecycle](../feature/workflow.md#ticket-lifecycle) for the intended person's assignment and active-work status; reconcile the ticket again at review, merge, and delivery. Read-only triage does not claim ownership.
- Start from the success condition: name the desired behavior, invariant, or regression risk before planning or editing.
- Establish the smallest verification path before implementation continues: targeted test, build/typecheck, browser scenario, fixture diff, or a documented `BLOCKED` reason.
- Prefer an established relevant suite when one exists. For a one-off tooling change without a relevant suite, use a focused disposable smoke check rather than creating a permanent bespoke runner or assertion API solely for that change; remove temporary scripts and recording fixtures afterward, and preserve reviewer-reproducible commands and truthful evidence. Keep permanent regression coverage when it fits established conventions, and intentionally establishing test infrastructure remains valid when it is accepted scope. Do not replace runnable behavioral proof with source-text assertions or inspection alone.
- Choose focused checks or a relevant affordable full suite under [Full-Suite Cost](#full-suite-cost), without a routine approval prompt. Preserve independently documented test/release gates; an `npm test` script alone does not mandate a full-suite run. Run an installed verifier only when its declared contract directly covers a changed acceptance criterion; a generic repository-hygiene check is not relevant merely because a source file changed, especially when a required test gate already exercises it. Record unrelated or already-covered verifiers as `N/A`, not `BLOCKED`. If a required relevant verifier is unavailable, record `BLOCKED` with the missing prerequisite.
- Explore before planning when scope is unclear, multi-file, or cross-subsystem.
- For unclear or multi-file work, implement the first runnable prototype after one bounded plan and iterate from its evidence. Re-plan only when that evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path.
- For initial scope and follow-up priorities, use [Simple-First Delivery](#simple-first-delivery).
- Skip separate framing, formal planning, and handoff artifacts for one-sentence small diffs that touch one obvious area; read the local context, patch, and verify.
- Reuse outcome, constraints, and proof already recorded in the issue or plan. Create a context handoff only for actual delegation or resumption, not as a prerequisite for solo implementation.
- Delegate only when independent substantial work or a concrete coverage need justifies the coordination cost. Do not require tester, reviewer, or competing-design agents merely because they are available.
- Completion requires final evidence in `PASS`, `FAIL`, or `BLOCKED` terms. "Looks done" is not evidence.
- Keep this repo's role to workflow, rule, skill, and prompt assets. Do not build a task runner, dashboard, queue, or orchestration runtime here.

## Full-Suite Cost

Use focused checks for changed behavior; run a relevant affordable full suite when useful or independently required, without a separate approval prompt. Base restrictions on known local-development cost, not repository ownership or the command name. Reuse documented or recently observed timings; do not add recurring cost audits or run a full suite merely to benchmark it. An `npm test` script alone does not create a mandatory full-suite gate.

Do not automatically launch a full suite known to be too heavy for local development. Use focused local tests and observe existing CI instead; request explicit direction only when an expensive full run is actually needed, including a manually dispatched remote run. Routine release-workflow language does not authorize that expensive launch. WRAP is the currently identified example: the maintainer reports five roughly 15-minute CI shards or about an hour locally. This does not classify all Ice Fog Analytics or personal projects as expensive.

Preserve project wrappers, independently required release checks, and automatic CI. If an independently required expensive run lacks permission, name the unrun prerequisite and request direction rather than silently waiving it or claiming it passed. Otherwise continue with relevant verification without a repeated permission check. Do not disable CI to evade a required gate.

### Full-Suite Attempt Budget

Budget 1–5 full-suite CI attempts per applicable PR, targeting one at review readiness—not five as a quota or a minimum run for documentation-only changes with no applicable suite. Count readiness-triggered launches, manual full-suite dispatches, failed/cancelled launches, and rerun attempts across the PR. A workflow run's matrix shards are one attempt, not separate attempts. Inspect existing run history and attempt numbers before another launch; keep the count in the existing evidence location, not a new accounting runtime.

Use focused checks during development, batch fixes, and reuse applicable queued, running, or successful current-head checks. Where the repository already provisions CI on readiness, finish focused local QA and self-review before initial readiness or restoring an agent-temporary draft; let that transition provision CI once. Do not manually dispatch first and then trigger the same-head checks again through readiness. Preserve intentional draft status; neither a full-suite completion ritual nor a desire to obtain CI authorizes making an intentionally draft PR ready.

Reserve manual dispatch/rerun for an explicit maintainer request or a diagnosed CI failure needing another remote attempt. Inspect logs, address the cause, and verify it with focused checks first. Rerun only failed jobs when sufficient and still applicable; never rerun an old revision after pushing a fix. These attempts consume the same PR budget and remain subject to the expensive-run authorization above.

Before a sixth attempt, stop automatic launches and seek explicit maintainer direction. Do not waive required merge checks, disable triggers, or claim missing/failed/cancelled/stale checks passed to stay within budget. Respect project-local readiness, approval, and path-filter rules and preserve independently required release checks and automatic post-merge CI. This is agent guidance, not server-enforced accounting or a mandate to reconfigure workflow triggers.

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
   - apply [Organization Before Authoring](#organization-before-authoring) when the change introduces or materially changes module ownership or data flow;
   - keep tests focused on one observable contract, assert real returned values/persisted records directly, and split independent outcomes rather than inventing assertion bundles. HTTP status and body together form one response contract; prefer a native or meaningful matcher such as [`toHaveHttpResponse`](../../docs/references/http-response-matcher-reference.md), and use two direct assertions only as a narrow, reasoned fallback where no suitable matcher exists and local policy permits it. Keep independent persistence effects separate. Preserve framework-native matchers and use [Assertion Quality Requires Review](../../docs/references/test-alignment-verifier-reference.md#assertion-quality-requires-review) for examples and verifier limits;
   - before adding or retaining dependency-related tests, apply [Scenario-Oriented Verification](../../docs/references/code-organization-reference.md#scenario-oriented-verification) to identify the application-owned contract, uncovered compatibility risk, and existing consumer coverage;
   - delete obsolete paths instead of adding compatibility shims;
   - avoid new abstractions, options, dependencies, or runtime machinery unless the current task needs them.
6. Exercise the proof and iterate:
   - run the predeclared check;
   - use its result to make the next smallest change; when it fails, fix the root cause and rerun the smallest failing check;
   - re-plan only when evidence invalidates the requested outcome, scope boundary, chosen approach, or verification path; ordinary test failures are iteration, not a new plan;
   - run broader checks only when the changed surface warrants them; apply [Full-Suite Cost](#full-suite-cost) without adding routine permission checks for affordable suites.
7. Preserve the required completion evidence in the session or existing designated record, including changed files and links, final `PASS`/`FAIL`/`BLOCKED` results, required review/QA and current-head checks, learner or tracker outcomes, and residual risks or missing prerequisites. Do not omit or relabel a required gate.
8. Give the user the relevant outcome, proof, link, or blocker. Choose useful details for the reader and destination; do not turn internal execution bookkeeping into a mandatory public schema or repeat evidence already available in the linked record or CI. If there is no useful reader-needed information beyond the existing record, do not add a separate public report. Honor any explicitly requested report format. Apply [Workflow Outputs and Publication](../../docs/references/guidance-precedence-reference.md#workflow-outputs-and-publication): this workflow specifies evidence to retain, not permission to publish.

## Organization Before Authoring

For changes that introduce or materially change module ownership or data flow, apply [Organization Before Authoring](../../docs/workflows/hands-off-agentic-coding-workflow.md#organization-before-authoring) before implementation and again before the first push. Reuse its conditional checkpoint and the existing plan or session; do not create a new checklist artifact or require an organization report for a small local edit.

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

## Smoke and Cleanup Control Targets

Before a mutating smoke check or cleanup command, identify both its filesystem target and any controlling service or session, and confirm every resource it can mutate belongs to the QA scope. A temporary `HOME`, profile, working directory, or unset connection variable does not prove service/session isolation. Use a genuinely isolated service or session with its target observed; otherwise stay with non-mutating checks and state the unexercised boundary. Keep verification proportional: a documentation-only install check does not authorize uninstalling an existing personal installation. Ordinary file-only temporary fixtures need no extra service-isolation ceremony.

If an agent causes a live side effect, disclose it promptly, restore only the evidenced affected resource, and distinguish restored files from restored active behavior. Check supported recovery paths before declaring a disruptive logout or restart mandatory. Do not reproduce destructive behavior against a personal desktop session.

## Context Handoff Template

Use this only for an actual delegation or resumption. Include the observed context the recipient needs to act without the parent transcript; omit fields that add no actionable information. A completed solo task needs a result and proof, not a handoff packet.

When the user must open, copy, or run a delivered file outside OMP, provide an ordinary accessible filesystem path, not only an internal `local://` URI. Copy only the intended deliverable to an appropriate accessible location (a scoped `/tmp` directory suits temporary diagnostics), verify the copy's contents and required permissions, and give the user that path and exact invocation. Keep internal session artifacts internal; this does not require exporting every artifact or using one mandatory directory.

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
