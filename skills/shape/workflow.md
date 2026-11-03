# Shape an Idea

Use when someone wants help turning a rough idea, frustration, or proposed solution into a clear feature spec before implementation planning. No prepared user story or technical vocabulary is required.

## Intent

**WHY this workflow exists:** People can recognize a need without knowing how to specify a feature. Asking them to fill out a planning form moves the hardest work back onto them.

**WHAT this workflow produces:** A concise, collaboratively shaped feature spec with concrete behavior, acceptance scenarios, boundaries, and the smallest useful complete increment.

**Decision Rules:**

- Help the person think; do not interview them through a fixed questionnaire or demand every section upfront. Accept fragments, examples, and corrections.
- Separate the underlying need from the proposed solution without discarding an explicit product choice. Offer a simpler alternative when useful; do not quietly substitute it.
- Distinguish confirmed requirements, evidence, proposed defaults, assumptions, and unanswered questions. A recommendation is not user agreement. Never invent users, permissions, measurements, or business rules.
- Use existing conversation and project evidence before asking. Inspect only relevant source or product documentation read-only when it can answer a factual question; do not begin broad repository discovery for an early idea. State when a repository fact has not been verified.
- Shaping is not implementation planning or authorization. Do not edit application code, create branches, file tickets, publish the spec, or launch experiments merely because a spec is ready. Keep the draft in the conversation unless saving or publication is requested; use the authorized existing product-documentation or issue owner rather than a second ledger.
- Preserve explicit limits, accepted requirements, safety, and repository boundaries. Do not call a reduced scope complete without agreement.

## Guided Conversation

1. **Find a concrete starting point.** If no idea was supplied, ask for one recent frustration or something the person wishes they could do. Otherwise reflect the supplied idea in plain language: who appears to need what, why it matters, and what remains uncertain. Do not ask them to repeat known context.
2. **Show a small working draft.** Capture what is already known, not a mostly empty template. Label tentative interpretations and offer a concrete example for correction. Keep the draft short enough to read and revise during the conversation.
3. **Ask the next consequential question.** Prefer one question at a time; batch at most three closely related questions when their answers do not depend on each other. Ask about outcomes, decisions, or tradeoffs the person owns, not facts available in tools. Explain why a choice matters. When helpful, offer two or three concrete alternatives and recommend a default with its tradeoff; allow a different answer and uncertainty. Do not make them choose technical architecture to describe product behavior.
4. **Walk through a real use.** Establish the starting situation, action, observable result, and what must remain unchanged. Ask only applicable questions about actors and permissions, missing data, failure, cancellation, or other consequential boundaries. Use a counter-example to distinguish ambiguous rules rather than enumerate speculative edge cases.
5. **Revise visibly.** Incorporate each answer or correction into the working spec and briefly identify any affected behavior, acceptance scenario, or scope decision. Preserve unaffected decisions. If an answer contradicts an earlier requirement, surface the conflict and resolve it rather than silently picking one. Avoid reprinting the whole spec after every small answer; show the changed portion until a coherent full draft is useful.
6. **Bound the first useful increment.** Propose the smallest complete outcome that provides the stated value, with explicit non-goals and a way to verify it. Distinguish later optional ideas from required behavior. If a product decision remains open, keep it visible; if feasibility needs investigation, describe the smallest question or experiment for a separately authorized planning step, not an invented answer.
7. **Offer the consolidated spec for confirmation.** Stop adding questions when the behavior, scope, acceptance examples, and material constraints are clear enough to review. Do not continue polishing to fill every possible field. A request for an immediate draft gets a draft with explicit assumptions and open decisions, not a forced interview or a claim of agreement.

## Feature Spec

Use the project's existing spec format when present. Otherwise include these topics in a compact draft, omitting irrelevant detail rather than requiring a long form:

- **Problem and Users:** the need, affected people, and current evidence.
- **Desired Outcome:** what becomes possible and how success is observed; numerical targets only when supplied or agreed.
- **Usage Example:** a concrete starting state, user action, result, and preserved behavior.
- **Behavior and Acceptance Scenarios:** observable normal behavior and the material boundary or failure cases established in the conversation. Make each check specific enough to distinguish success from a plausible wrong implementation.
- **Scope and Non-Goals:** included behavior, excluded work, and the smallest complete increment.
- **Constraints and Open Decisions:** confirmed limits, labeled assumptions/proposals, unanswered questions, and who can resolve them when known.
- **Verification:** the smallest observable demonstration of the increment; distinguish proposed checks from checks actually performed.

Keep architecture, file inventories, estimates, and implementation task breakdowns out unless explicitly requested. The spec describes the feature contract, not an imagined implementation.

## Completion and Handoff

A reviewable draft is not a confirmed specification. Invite correction or confirmation of the consolidated draft; retain unresolved decisions and do not imply approval from silence. If a material decision is unanswered, describe the draft as provisional and name that decision rather than claiming implementation readiness. Do not block useful drafting on minor unknowns.

After confirmation, finish with the spec and remaining uncertainty. Do not automatically continue into implementation. When the person explicitly asks to plan implementation, carry the confirmed spec into [Outcome-First Planning](../outcome-first-planning/workflow.md), reusing its requirements rather than interviewing them again. Follow the existing [Feature Workflow](../feature/workflow.md) only when ticket or implementation delivery is authorized. Shaping itself grants neither authorization.
