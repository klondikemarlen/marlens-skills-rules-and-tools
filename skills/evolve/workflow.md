# Evolve Workflow

Use when asked to run one complete project-improvement cycle. Compose the existing stage workflows; do not build a runner or duplicate their procedures.

## Scope and Shared Evidence

Read project-local guidance and the user's target, constraints, and exit intent once. Preserve that scope and authorization throughout the cycle. Reuse the existing issue, plan, or session for accepted decisions, relevant observations, verification results, delivery state, and stage outcomes; do not create another ledger.

Carry context forward rather than repeat whole-project discovery. Reuse checks only while their relevant inputs and acceptance requirements remain unchanged. Later changes that invalidate earlier proof require focused revalidation before claiming the cycle complete. No-change stages require evidence, not an assumption that earlier work covered them.

## Ticket Triage Within the Cycle

When selecting work from tickets, load [Triage](../triage/SKILL.md) and its selected project-local workflow or packaged fallback before advance chooses an outcome. Establish the authoritative tracker, bounded selection/query, retrieval limits, and capture time; assess readiness, blockers, relationships, and coherent grouping within that selection. The user does not need a separate triage invocation.

Apply the triage workflow's supported updates under the cycle's existing authority, including reconciliation of evidenced blockers with supported tracker-visible markers. Preserve explicit assessment-only, dry-run, no-write, and narrower exclusions; report missing vocabulary or authority rather than inventing markers. An assessment-only cycle evaluates and proposes stage outcomes without implementation or other writes. Triage itself does not claim tickets, authorize implementation, or expand repository scope.

Carry the resulting evidence, grouping, applied/unapplied dispositions, and unresolved prerequisites into advance and later relevant stages using the existing issue, plan, or session. Reuse a current triage already supplied with the request; do not recapture the backlog or repeat related-issue discovery unless changed evidence or scope makes it necessary. Refresh only affected decisions when later information changes a blocker or acceptance requirement. This is selection within the existing pass, not another implementation stage or an automatic backlog loop.

When no tickets are available or relevant, continue advance's selection from accepted direction, plans, or evidenced blockers without manufacturing a backlog for triage. Preserve any ticket creation required by the selected outcome's actual delivery workflow.

## Ordered Pass

Evaluate these stages once, in order. Read each linked skill entrypoint and select its project-local workflow or packaged fallback before performing that stage; local stage procedures retain their authority.

| Stage                               | Outcome and Boundary                                                                                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. [Advance](../advance/SKILL.md)   | Select and deliver at most one valuable, cohesive outcome from accepted direction, issues, plans, or blockers. Complete its applicable delivery gates before continuing.                                                                        |
| 2. [Improve](../improve/SKILL.md)   | Reassess useful knowledge and implementation using the updated project state and carried evidence. Deliver at most one justified outcome, or establish an evidence-backed no-change/already-covered result.                                     |
| 3. [Simplify](../simplify/SKILL.md) | Inspect the strongest remaining evidenced readability burden. Deliver at most one behavior-preserving simplification, or establish that inspected candidates do not justify a change. Do not undo a sound earlier decision to manufacture work. |
| 4. [Wrap-Up](../wrap-up/SKILL.md)   | Check the whole cycle's acceptance and delivery state, safely handle owned cleanup, and deduplicate and route current-session insights within existing authority. Preserve explicit exit intent for final closeout.                             |

Each distinct implementation outcome completes its required issue, review, verification, release, and installed-artifact checks before the next implementation stage. Keep distinct outcomes in separate cohesive deliveries unless the existing [Related-Issue Triage](../feature/workflow.md#related-issue-triage) criteria genuinely permit grouping. Do not accumulate unrelated stage changes into one large PR or waive delivery gates to save repetitions.

## Transitions and Completion

- A completed or evidence-backed no-change stage advances to the next stage. Earlier work may already satisfy a later concern, but evaluate that concern and record its disposition without forcing another edit or release.
- If a stage fails or leaves required work incomplete, resolve reachable work under its existing authority first. Do not bypass its failed delivery by starting another implementation stage or substituting easier work.
- If an external prerequisite genuinely blocks completion, stop later implementation stages and use wrap-up only for safe incomplete-status closeout: preserve unreleased work and uncertain resources, report the exact missing prerequisite and attempted path, and do not claim completion or exit. Do not expand external issue-filing or implementation authority.
- Finish after one ordered pass whose applicable acceptance and delivery gates are complete. Give one concise cycle result with useful stage outcomes, evidence, and residual risks. No automatic restart, backlog draining, or mandatory change quota.
- Bare `evolve` does not authorize exit. If the user explicitly requested “evolve, then exit,” follow wrap-up's supported exit scheduling only after successful completion: schedule shutdown after the final response, calling any exit-after-response tool before sending that response. An unavailable exit mechanism is reported, not replaced with process killing.
