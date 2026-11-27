# Evolve Workflow

Evolve runs one complete project-improvement cycle by default. A request to continue through a bounded ticket selection can compose several cycles. Use the existing stage workflows; do not build a runner or duplicate their procedures.

## Scope and Shared Evidence

Read project-local guidance and the user's target, constraints, and exit intent once. Preserve that scope and authorization throughout the cycle. Reuse the existing issue, plan, or session for accepted decisions, relevant observations, verification results, delivery state, and stage outcomes; do not create another ledger.

**MSSRT checkout default.** When the target repository is `klondikemarlen/marlens-skills-rules-and-tools` and the maintainer gives no narrower scope, select all issues open when the pass starts and use [the backlog procedure](#continue-through-a-selected-backlog). Report a disposition for every selected ticket, including deferred and keep-open reviews. An explicit request for one issue or assessment only still wins. This exception does not apply to consuming repositories.

Carry context forward rather than repeat whole-project discovery. Reuse checks only while their relevant inputs and acceptance requirements remain unchanged. Later changes that invalidate earlier proof require focused revalidation before claiming the cycle complete. No-change stages require evidence, not an assumption that earlier work covered them.

## Ticket Triage Within the Cycle

When selecting work from tickets, load [Triage](../../skills/triage/SKILL.md) and its selected project-local workflow or packaged fallback before advance chooses an outcome. Establish the authoritative tracker, bounded selection/query, retrieval limits, and capture time; assess readiness, blockers, relationships, and coherent grouping within that selection. The user does not need a separate triage invocation.

Apply the triage workflow's supported updates under the cycle's existing authority, including reconciliation of evidenced blockers with supported tracker-visible markers. Preserve explicit assessment-only, dry-run, no-write, and narrower exclusions; report missing vocabulary or authority rather than inventing markers. An assessment-only cycle evaluates and proposes stage outcomes without implementation or other writes. Triage itself does not claim tickets, authorize implementation, or expand repository scope.

Before advance selects ticket work, run triage's [Approval Decision Handoff](ticket-triage-workflow.md#approval-decision-handoff) to check which decisions genuinely remain. Do not seek repeat acceptance of the maintainer's own requests or routine low-risk external contributions. For external contributions with concrete security implications, explain the concern and offer scoped approve/reject/defer choices. Ask unresolved product or policy questions using their actual alternatives, not a ticket-approval prompt. Reuse existing decisions and carry each response into selection. Eligibility is not automatic backlog draining; unanswered or deferred decisions do not block independently authorized work.

Carry the resulting evidence, grouping, applied/unapplied dispositions, and unresolved prerequisites into Advance and later relevant stages using the existing issue, plan, or session. Reuse current triage supplied with the request. Refresh only the affected ticket states, prerequisites, or acceptance decisions when evidence changes.

When no tickets are available or relevant for ordinary single-outcome selection, continue Advance's selection from accepted direction, plans, or evidenced blockers without manufacturing a backlog for triage. Preserve any ticket creation required by the selected outcome's actual delivery workflow.

## Continue Through a Selected Backlog

1. **Fix the selection.** For an explicit backlog pass, record the authorized tracker and repository or project, the selected ticket identities (or the result of the bounded query at the start), and any supplied order. Keep that set fixed; related tickets and new arrivals do not join it. Preserve the requested mode and limits. A priority order or triage result alone does not authorize implementation or delivery.
2. **Choose the next eligible outcome.** Use [Triage](ticket-triage-workflow.md#process) to distinguish priority from readiness. Take the first independently actionable, authorized outcome in the supplied order; when none is supplied, use Triage's ranking guidance. Group tickets only when they share an outcome and proof. Preserve the priority and exact missing prerequisite or decision for skipped higher-priority work rather than treating it as resolved or lowering its rank.
3. **Finish or record what blocks the current cycle before selecting again.** Keep each outcome in [its own Feature delivery lifecycle](#one-outcome-one-delivery-lifecycle) with all applicable gates. Use its observed disposition to refresh only affected states and prerequisites, then select again from the same set without a new prompt. A gate still blocks that outcome and any dependent work; it does not block authorized independent work.
4. **Stop at the selection boundary.** When no selected authorized outcome remains independently actionable, including when every remaining path needs an approval or prerequisite, report which outcomes shipped and the disposition and next action for each remaining ticket. Do not substitute other work or claim delivery for a blocked or deferred outcome.

See the [worked backlog example](../../examples/outcome-skills.md#explicit-evolve-backlog).

## One Outcome, One Delivery Lifecycle

Each cycle composes the skills around one accepted outcome rather than running several independent shipping campaigns. Read each applicable skill entrypoint and select its project-local workflow or packaged fallback. Keep the same scope, acceptance criteria, issue, branch/worktree, draft PR, and evidence as work moves between skills. Local project requirements remain authoritative.

Within this composition, Advance selects and progresses the outcome; Improve and Simplify are pre-delivery refinement passes on that outcome, not fresh searches for another feature. Their local findings and proof return to the active [Feature Workflow](feature-workflow.md), which owns the required review, QA, merge, release, and install gates. Do not merge merely to finish an Advance checkbox. Standalone invocations retain their own complete-delivery contracts; a stage handoff inside evolve is not a claim that the feature has shipped.

When the active delivery authorizes merge, Feature selects [Autonomous Merge](../../skills/autonomous-merge/SKILL.md); Evolve does not invoke the operator `review-and-merge` command or add its post-fix hold.

## Working Flow

| Phase                   | Skill Contribution and Handoff                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame and design        | [Advance](../../skills/advance/SKILL.md) selects one valuable, cohesive outcome unless the user already supplied it. Use [Shape](../../skills/shape/SKILL.md) only for unresolved product behavior and [Plan](../../skills/plan/SKILL.md) for material design choices. Use [Prototype](../../skills/prototype/SKILL.md) when a UI preview will answer a concrete interaction or layout question; skip it for clear or non-UI work. Carry accepted decisions into implementation. |
| Build a working version | Implement the smallest runnable path under the feature workflow, with relevant checks as each meaningful behavior becomes available. A rough version is an intermediate review surface, not permission to ship stubs, omit accepted behavior, or defer correctness and safety. Open or continue the same draft PR according to the project workflow.                                                                                                                             |
| Refine and simplify     | [Improve](../../skills/improve/SKILL.md) compares observed behavior and useful knowledge with the accepted need. [Simplify](../../skills/simplify/SKILL.md) reduces evidenced maintenance burden while preserving behavior. Apply concrete feedback and ordinary tweaks within the same scope. Record already-covered or no-change results rather than inventing work.                                                                                                           |
| Verify and ship         | Once the outcome is coherent and complete, finish the feature workflow's final review, focused QA, feedback resolution, and required current-head checks before merge. Complete the project's actual release, reinstall, and fresh-process verification where applicable. These are one delivery lifecycle, not a new release for each skill.                                                                                                                                    |
| Wrap up                 | [Wrap-Up](../../skills/wrap-up/SKILL.md) reconciles acceptance and delivery evidence, handles owned-resource disposition safely, and routes warranted insights. Preserve review sources before cleanup and honor explicit exit intent. It does not start another improvement campaign.                                                                                                                                                                                           |

Prototype acceptance does not authorize implementation, and a design-only or assessment-only request stops at its authorized handoff. Do not add an interview, prototype, or approval ceremony when requirements are already clear. A required project-local gate or separately authorized action cannot be deferred merely to fit this flow.

### UI Design Review and Implementation

When an interaction or layout choice materially affects the outcome, recommend a design grounded in the current app's relevant screen, controls, and states. Explain why it fits the user task and which tradeoff or question needs review. When a preview helps answer that question, use [Prototype's reviewer handoff](ui-prototyping-workflow.md#completion-and-handoff): share the verified artifact through an entrypoint the intended reviewer can actually open, preferably without starting a server. A prose recommendation or a screenshot alone does not let someone exercise an interaction.

Record the chosen behavior, relevant states, and any remaining limits in the existing issue or plan. In authorized implementation, use that decision as the acceptance target, not the prototype's visual resemblance alone. Exercise the relevant user actions and states in the running application using [Browser QA](browser-qa-workflow.md) and record observed outcomes against that decision. Keep preview evidence separate from in-app evidence; if the app path cannot be exercised, report the blocked prerequisite and unverified behavior rather than substituting the preview. A clear UI change can go straight to implementation and applicable QA.

### Feedback and Respecification

The working flow allows bounded iteration, not a rigid one-pass staircase. When a runnable result, user feedback, review, or QA contradicts the current approach, return to the smallest affected step: tweak the implementation for a local defect, simplify a confusing responsibility, or revisit the relevant specification/design when the behavior or model is wrong. Ask only for consequential unresolved product decisions; use existing evidence for ordinary implementation choices. Do not wait until after merge to reconcile a known design problem.

For a changed requirement, update the acceptance criteria and design decision in the existing issue or plan, identify affected callers and proof, then implement and revalidate those affected contracts. Preserve unrelated accepted decisions and still-valid evidence. A broader behavior change is not a simplification, and optional polish is not a new acceptance requirement. Pause for the required scope decision when a proposed change exceeds authorization.

Apply the [Requirements Alignment Checkpoint](hands-off-agentic-coding-workflow.md#requirements-alignment-checkpoint) after the first runnable slice, on material scope expansion or reviewer-requested optional defenses, and before PR readiness and delivery gates. Compare the accumulated diff and observed behavior with the latest accepted need and non-goals. Review and checks may happen throughout; final QA establishes readiness of the completed outcome, not the first opportunity to find defects.

Stop iterating when the accepted behavior is complete, relevant review findings are resolved, and required proof supports delivery. Do not cycle through every skill after each tweak, restart discovery, polish indefinitely, or look for more tickets to fill a phase. A failed check sends work back to its affected owner; it does not authorize weakening the contract or substituting easier work.

### Scope and Task Planning

Use outcome-oriented task phases: design where needed; working implementation; refinement; final verification and delivery; wrap-up. Put pending shipping work after refinement rather than under Advance ahead of Improve and Simplify. Keep the existing plan and mark a refinement phase no-change when supported; do not create a second ledger or a task for every skill invocation.

Unrelated opportunities remain outside the selected delivery. Record their disposition without implementing or filing elsewhere unless authorized. If the accepted scope genuinely needs independently useful PR slices, follow the feature workflow's slice and dependency rules; each slice completes its own applicable gates. Do not combine unrelated outcomes to save releases, or require one giant unreleased branch for an explicitly phased rollout.

## Transitions and Completion

- Continue reachable authorized work when implementation, review, QA, or installation fails; a merge alone does not finish delivery. Do not start a new improvement campaign to bypass a failed gate.
- If selection establishes no authorized actionable outcome, report that evidence-backed result and wrap up without manufacturing design, implementation, or refinement work.
- If an external prerequisite genuinely blocks completion, preserve unreleased work and uncertain resources. Complete independently reachable required work, then use wrap-up for truthful incomplete-status closeout with the exact prerequisite and attempted path. Do not claim success, expand external authority, or exit.
- Finish an ordinary invocation after the selected outcome's iteration and applicable delivery gates. For a bounded backlog pass, use the selection and stopping rules above. Give one concise result with relevant decisions, evidence, and residual risks; retain the disposition and next action for approved-but-unselected, rejected, deferred, and unanswered decisions. No automatic backlog draining or mandatory change quota.
- Bare `evolve` does not authorize exit. If the user explicitly requested “evolve, then exit,” follow wrap-up's supported exit scheduling only after successful completion. An unavailable exit mechanism is reported, not replaced with process killing. Authorized installed-plugin restarts follow the feature and wrap-up handoff; they do not begin another evolution cycle.
