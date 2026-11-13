# Evolve Workflow

Use when asked to run one complete project-improvement cycle. Compose the existing stage workflows; do not build a runner or duplicate their procedures.

## Scope and Shared Evidence

Read project-local guidance and the user's target, constraints, and exit intent once. Preserve that scope and authorization throughout the cycle. Reuse the existing issue, plan, or session for accepted decisions, relevant observations, verification results, delivery state, and stage outcomes; do not create another ledger.

Carry context forward rather than repeat whole-project discovery. Reuse checks only while their relevant inputs and acceptance requirements remain unchanged. Later changes that invalidate earlier proof require focused revalidation before claiming the cycle complete. No-change stages require evidence, not an assumption that earlier work covered them.

## Ticket Triage Within the Cycle

When selecting work from tickets, load [Triage](../triage/SKILL.md) and its selected project-local workflow or packaged fallback before advance chooses an outcome. Establish the authoritative tracker, bounded selection/query, retrieval limits, and capture time; assess readiness, blockers, relationships, and coherent grouping within that selection. The user does not need a separate triage invocation.

Apply the triage workflow's supported updates under the cycle's existing authority, including reconciliation of evidenced blockers with supported tracker-visible markers. Preserve explicit assessment-only, dry-run, no-write, and narrower exclusions; report missing vocabulary or authority rather than inventing markers. An assessment-only cycle evaluates and proposes stage outcomes without implementation or other writes. Triage itself does not claim tickets, authorize implementation, or expand repository scope.

Before advance selects ticket work, run triage's [Approval Decision Handoff](../triage/workflow.md#approval-decision-handoff) to check which decisions genuinely remain. Do not seek repeat acceptance of the maintainer's own requests or routine low-risk external contributions. For external contributions with concrete security implications, explain the concern and offer scoped approve/reject/defer choices. Ask unresolved product or policy questions using their actual alternatives, not a ticket-approval prompt. Reuse existing decisions and carry each response into selection. Eligibility is not automatic backlog draining; unanswered or deferred decisions do not block independently authorized work.

Carry the resulting evidence, grouping, applied/unapplied dispositions, and unresolved prerequisites into advance and later relevant stages using the existing issue, plan, or session. Reuse a current triage already supplied with the request; do not recapture the backlog or repeat related-issue discovery unless changed evidence or scope makes it necessary. Refresh only affected decisions when later information changes a blocker or acceptance requirement. This is selection within the existing pass, not another implementation stage or an automatic backlog loop.

When no tickets are available or relevant, continue advance's selection from accepted direction, plans, or evidenced blockers without manufacturing a backlog for triage. Preserve any ticket creation required by the selected outcome's actual delivery workflow.

## One Outcome, One Delivery Lifecycle

Evolve composes the skills around one accepted outcome rather than running several independent shipping campaigns. Read each applicable skill entrypoint and select its project-local workflow or packaged fallback. Keep the same scope, acceptance criteria, issue, branch/worktree, draft PR, and evidence as work moves between skills. Local project requirements remain authoritative.

Within this composition, Advance selects and progresses the outcome; Improve and Simplify are pre-delivery refinement passes on that outcome, not fresh searches for another feature. Their local findings and proof return to the active [Feature Workflow](../feature/workflow.md), which owns the required review, QA, merge, release, and install gates. Do not merge merely to finish an Advance checkbox. Standalone invocations retain their own complete-delivery contracts; a stage handoff inside evolve is not a claim that the feature has shipped.

## Working Flow

| Phase                   | Skill Contribution and Handoff                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame and design        | [Advance](../advance/SKILL.md) selects one valuable, cohesive outcome unless the user already supplied it. Use [Shape](../shape/SKILL.md) only for unresolved product behavior and [Plan](../plan/SKILL.md) for material design choices. Use [Prototype](../prototype/SKILL.md) when a UI preview will answer a concrete interaction or layout question; skip it for clear or non-UI work. Carry accepted decisions into implementation. |
| Build a working version | Implement the smallest runnable path under the feature workflow, with relevant checks as each meaningful behavior becomes available. A rough version is an intermediate review surface, not permission to ship stubs, omit accepted behavior, or defer correctness and safety. Open or continue the same draft PR according to the project workflow.                                                                                     |
| Refine and simplify     | [Improve](../improve/SKILL.md) compares observed behavior and useful knowledge with the accepted need. [Simplify](../simplify/SKILL.md) reduces evidenced maintenance burden while preserving behavior. Apply concrete feedback and ordinary tweaks within the same scope. Record already-covered or no-change results rather than inventing work.                                                                                       |
| Verify and ship         | Once the outcome is coherent and complete, finish the feature workflow's final review, focused QA, feedback resolution, and required current-head checks before merge. Complete the project's actual release, reinstall, and fresh-process verification where applicable. These are one delivery lifecycle, not a new release for each skill.                                                                                            |
| Wrap up                 | [Wrap-Up](../wrap-up/SKILL.md) reconciles acceptance and delivery evidence, handles owned-resource disposition safely, and routes warranted insights. Preserve review sources before cleanup and honor explicit exit intent. It does not start another improvement campaign.                                                                                                                                                             |

Prototype acceptance does not authorize implementation, and a design-only or assessment-only request stops at its authorized handoff. Do not add an interview, prototype, or approval ceremony when requirements are already clear. A required project-local gate or separately authorized action cannot be deferred merely to fit this flow.

### Feedback and Respecification

The working flow allows bounded iteration, not a rigid one-pass staircase. When a runnable result, user feedback, review, or QA contradicts the current approach, return to the smallest affected step: tweak the implementation for a local defect, simplify a confusing responsibility, or revisit the relevant specification/design when the behavior or model is wrong. Ask only for consequential unresolved product decisions; use existing evidence for ordinary implementation choices. Do not wait until after merge to reconcile a known design problem.

For a changed requirement, update the acceptance criteria and design decision in the existing issue or plan, identify affected callers and proof, then implement and revalidate those affected contracts. Preserve unrelated accepted decisions and still-valid evidence. A broader behavior change is not a simplification, and optional polish is not a new acceptance requirement. Pause for the required scope decision when a proposed change exceeds authorization.

Apply the [Requirements Alignment Checkpoint](../autopilot/workflow.md#requirements-alignment-checkpoint) after the first runnable slice, on material scope expansion or reviewer-requested optional defenses, and before PR readiness and delivery gates. Compare the accumulated diff and observed behavior with the latest accepted need and non-goals. Review and checks may happen throughout; final QA establishes readiness of the completed outcome, not the first opportunity to find defects.

Stop iterating when the accepted behavior is complete, relevant review findings are resolved, and required proof supports delivery. Do not cycle through every skill after each tweak, restart discovery, polish indefinitely, or look for more tickets to fill a phase. A failed check sends work back to its affected owner; it does not authorize weakening the contract or substituting easier work.

### Scope and Task Planning

Use outcome-oriented task phases: design where needed; working implementation; refinement; final verification and delivery; wrap-up. Put pending shipping work after refinement rather than under Advance ahead of Improve and Simplify. Keep the existing plan and mark a refinement phase no-change when supported; do not create a second ledger or a task for every skill invocation.

Unrelated opportunities remain outside the selected delivery. Record their disposition without implementing or filing elsewhere unless authorized. If the accepted scope genuinely needs independently useful PR slices, follow the feature workflow's slice and dependency rules; each slice completes its own applicable gates. Do not combine unrelated outcomes to save releases, or require one giant unreleased branch for an explicitly phased rollout.

## Transitions and Completion

- Continue reachable authorized work when implementation, review, QA, or installation fails; a merge alone does not finish delivery. Do not start a new improvement campaign to bypass a failed gate.
- If selection establishes no authorized actionable outcome, report that evidence-backed result and wrap up without manufacturing design, implementation, or refinement work.
- If an external prerequisite genuinely blocks completion, preserve unreleased work and uncertain resources. Complete independently reachable required work, then use wrap-up for truthful incomplete-status closeout with the exact prerequisite and attempted path. Do not claim success, expand external authority, or exit.
- Finish after the selected outcome's iteration and applicable delivery gates are complete. Give one concise result with relevant design/refinement decisions, evidence, and residual risks. Preserve the disposition and next action for approved-but-unselected, rejected, deferred, and unanswered decisions from the selected backlog. No automatic backlog draining or mandatory change quota.
- Bare `evolve` does not authorize exit. If the user explicitly requested “evolve, then exit,” follow wrap-up's supported exit scheduling only after successful completion. An unavailable exit mechanism is reported, not replaced with process killing. Authorized installed-plugin restarts follow the feature and wrap-up handoff; they do not begin another evolution cycle.
