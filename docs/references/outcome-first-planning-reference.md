# Outcome-First Planning Reference

## Model

Outcome-first planning starts with the required end state and works backward through evidence, constraints, and the smallest implementation choice that can satisfy it.

- **Success condition:** the user-visible result or invariant that makes the work successful.
- **Evidence:** an example, check, or scenario that can distinguish success from a plausible failure.
- **Constraint:** a binding boundary such as compatibility, ownership, security, repository convention, or release policy.
- **Fit check:** a comparison of a proposed choice against good examples, counter-examples, existing patterns, and the complexity ceiling.
- **Residual risk:** uncertainty that remains after the design converges and must be verified during implementation.

Outcome-first planning is not permission to plan indefinitely. It is a short alignment loop that makes the first implementation step predictable.

## Guardrails

1. State the success condition before naming files, tools, or abstractions.
2. Include non-goals so a technically successful implementation cannot silently expand scope.
3. Use examples and counter-examples to test the behavior boundary, not to decorate the plan.
4. Prefer an existing project pattern over a second convention.
5. Keep the external interface simple and bounded; add flexibility only for a current requirement.
6. Name the smallest runnable verification gate before implementation.
7. Preserve unresolved uncertainty as residual risk instead of hiding it in vague language.
8. Before inventing a requirement from a possible failure, apply [Solve Real User Needs](../../rules/solve-real-user-needs.md): judge whether prevention is necessary under realistic use, project scale, quality expectations, likely harm, and maintenance cost before choosing a mechanism. Available evidence and labeled assumptions suffice; this does not require telemetry or numerical risk thresholds. Preserve explicit requirements, supported behavior, and concrete material security/data-integrity safeguards.

## Bounded Modeling Within the Plan

For materially ambiguous diagnostic or design work, briefly explore plausible concepts, hypotheses, or alternatives—including no change or an existing sufficient solution. Organize the main ideas into coherent responsibilities and relationships, then prune against the accepted outcome and constraints. Refine only an uncertain subproblem, retaining its parent requirement and choosing the smallest evidence check or runnable experiment. If that subproblem exposes another consequential uncertainty, apply the same loop there rather than expanding every branch.

Reassemble the result and sanity-check interactions, coherence, and coverage against the whole accepted need. A collection of locally sound choices can still miss the user outcome or include useful work that does not belong in this PR. Backtrack when evidence invalidates an assumption instead of defending the initial plan.

This is a technique within plan-first and uncertain-seam execution, not a competing workflow. Keep decisions, supporting evidence or labeled assumptions, and residual risk in the existing plan or session. Do not require an exhaustive option tree, fixed depth or branch count, second ledger, hidden reasoning transcript, or brainstorming for mechanical changes. Stop at a runnable next action with named residual risk.

## Evidence-Driven Implementation Loops

A useful implementation loop connects the accepted user need, available context, a provisional explanation, a bounded change, and observed results. Feedback can revise the evidence, the problem framing, or the proposed solution—not merely trigger another code change. The recursive modeling technique above helps refine uncertain parts of this loop while retaining the whole outcome.

- **Ground the problem:** use relevant code, user feedback, session observations, or existing measurements. Keep raw evidence distinct from an assumed diagnosis; treat generated insights as leads to verify, not automatic requirements.
- **Model and test an explanation:** compare plausible causes and connect findings that may share a root cause. Use a focused experiment or prototype when it resolves consequential uncertainty; neither is mandatory for an already-understood change.
- **Deliver the justified change:** apply the existing [requirements-alignment checkpoint](../workflows/hands-off-agentic-coding-workflow.md#requirements-alignment-checkpoint) and [feature delivery gates](../workflows/feature-workflow.md). A promising prototype or useful adjacent finding does not expand authorization or replace complete implementation.
- **Evaluate the outcome:** distinguish proof that the change works and is available from evidence that it helped users. Where improvement requires observations over time, use an appropriate existing measure or qualitative feedback and a meaningful comparison; report insufficient or conflicting evidence as inconclusive, not success.
- **Refine or stop:** revise only the assumption or part contradicted by evidence. Retain an adequate solution, omit unjustified work, or stop with named uncertainty. If later outcome review is needed, retain its question and agreed review trigger in the existing issue or plan rather than keeping implementation running indefinitely.

These are conceptual connections, not another workflow or an instruction to install analytics, upload private context, create a metrics service, or automate repeated PRs. [Evolve](../workflows/evolve-workflow.md) still completes one bounded pass; later observations inform separately authorized work.

### Research Basis and Limits

The versioned external workflow and refinement sources below describe connected context, focused investigation, synthesis across findings, action, and returning to earlier framing when evidence changes. Their finding-verification guide explicitly treats generated findings as potentially stale leads requiring evidence. Those are the transferable observations—not the product's commands, integrations, autonomy levels, or numerical audit quotas.

The recursive explore–organize–refine–reassemble technique is the maintainer's proposal, developed during that investigation; it is not a verified description of the external product's internal implementation. The distinction between delivery and user improvement is this project's synthesis. The inspected sources do not establish causal metric attribution or a fully autonomous product-improvement loop, and no such capability is claimed here.

## Stop Conditions

Stop planning and implement when:

- the success condition is observable;
- representative good, bad, and ambiguous examples have expected outcomes;
- the relevant project patterns and constraints are recorded;
- the chosen approach is sufficient and bounded, including retaining existing behavior when no change is needed;
- the reassembled responsibilities and interactions coherently cover the whole accepted need without adding imagined requirements; and
- a runnable verification gate exists with named residual risk.

Stop planning and ask a focused question when a missing decision changes ownership, security, compatibility, or the public interface materially. Do not ask for information that repository files, issue history, or existing conventions can establish.

Stop planning and run an experiment when the remaining uncertainty is empirical, such as runtime behavior, API semantics, or a real fixture shape.

## Anti-Patterns

- **Implementation-first planning:** choosing a library, file, or abstraction before stating the success condition.
- **Example theater:** collecting examples without expected outcomes or counter-examples.
- **Pattern bypass:** adding a new workflow or skill beside an existing one without explaining the gap.
- **Complexity creep:** turning a bounded guidance request into a planner, task runner, or orchestration runtime.
- **Interface hedging:** adding speculative options, aliases, or compatibility shims instead of choosing one clear contract.
- **False convergence:** declaring a plan complete while residual risk or the verification gate is unnamed.
- **Infinite alignment:** continuing to compare alternatives after one option satisfies the success condition and the remaining question belongs to implementation.
- **Local-fit tunnel vision:** refining individual pieces without checking that their interactions still satisfy the whole accepted need.

## Planning Strategy Is Not Token Generation

The bounded modeling technique above is workflow advice, not a claim about model internals or provider quality. In the original [GLM paper (Du et al., 2022)](https://aclanthology.org/2022.acl-long.26/), §2.1.1 randomly orders missing spans but always generates tokens within each span left-to-right autoregressively; §2.3 also describes autoregressive text generation. Access to visible surrounding context is not bidirectional sentence construction. These claims concern that paper, not every modern model named GLM.

Sequential GPT token generation does not imply an inability to plan: [OpenAI's reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) explicitly describes internal reasoning before output, including considering alternatives. Neither source establishes that these workflow prompts reproduce a model's internal process.

## Sources

- [Tura documentation](https://turaai.net/docs) and [Tura llms.txt](https://turaai.net/llms.txt) — outcome-first constraint analysis.
- [Understanding by Design white paper](https://files.ascd.org/staticfiles/ascd/pdf/siteASCD/publications/UbD_WhitePaper0312.pdf) — desired results, evidence, and aligned activities.
- [UIC backward design guide](https://teaching.uic.edu/cate-teaching-guides/syllabus-course-design/backward-design/) — backward design as an evidence-led planning sequence.
- [Cucumber Example Mapping](https://cucumber.io/docs/bdd/example-mapping/) — stories, rules, examples, and questions for fit checks.
- [Versioned product-loop workflow](https://unpkg.com/@google/stitch@0.12.1/skills/loop/stitch/references/workflow.md), [finding verification](https://unpkg.com/@google/stitch@0.12.1/skills/loop/stitch/references/prove-finding.md), and [refinement strategy](https://unpkg.com/@google/stitch@0.12.1/skills/loop/stitch/references/workflow/refine.md) from Google's published `@google/stitch` 0.12.1 package — research inputs for the general implementation-loop concepts above, not a dependency or an endorsement of its automation.
