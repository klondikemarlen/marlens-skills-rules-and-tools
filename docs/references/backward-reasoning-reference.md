# Backward Reasoning Reference

## Model

Backward reasoning starts with the required end state and works backward through evidence, constraints, and the smallest implementation choice that can satisfy it.

- **Gold:** the user-visible result or invariant that makes the work successful.
- **Evidence:** an example, check, or scenario that can distinguish success from a plausible failure.
- **Constraint:** a binding boundary such as compatibility, ownership, security, repository convention, or release policy.
- **Fit check:** a comparison of a proposed choice against good examples, counter-examples, existing patterns, and the complexity ceiling.
- **Residual risk:** uncertainty that remains after the design converges and must be verified during implementation.

Backward reasoning is not permission to plan indefinitely. It is a short alignment loop that makes the first implementation step predictable.

## Guardrails

1. State the Gold before naming files, tools, or abstractions.
2. Include non-goals so a technically successful implementation cannot silently expand scope.
3. Use examples and counter-examples to test the behavior boundary, not to decorate the plan.
4. Prefer an existing project pattern over a second convention.
5. Keep the external interface simple and bounded; add flexibility only for a current requirement.
6. Name the smallest runnable verification gate before implementation.
7. Preserve unresolved uncertainty as residual risk instead of hiding it in vague language.

## Stop Conditions

Stop planning and implement when:

- the Gold is observable;
- representative good, bad, and ambiguous examples have expected outcomes;
- the relevant project patterns and constraints are recorded;
- the chosen interface is smaller or clearer than the alternatives; and
- a runnable verification gate exists with named residual risk.

Stop planning and ask a focused question when a missing decision changes ownership, security, compatibility, or the public interface materially. Do not ask for information that repository files, issue history, or existing conventions can establish.

Stop planning and run an experiment when the remaining uncertainty is empirical, such as runtime behavior, API semantics, or a real fixture shape.

## Anti-Patterns

- **Implementation-first planning:** choosing a library, file, or abstraction before stating the Gold.
- **Example theater:** collecting examples without expected outcomes or counter-examples.
- **Pattern bypass:** adding a new workflow or skill beside an existing one without explaining the gap.
- **Complexity creep:** turning a bounded guidance request into a planner, task runner, or orchestration runtime.
- **Interface hedging:** adding speculative options, aliases, or compatibility shims instead of choosing one clear contract.
- **False convergence:** declaring a plan complete while residual risk or the verification gate is unnamed.
- **Infinite alignment:** continuing to compare alternatives after one option satisfies the Gold and the remaining question belongs to implementation.

## Sources

- [Tura documentation](https://turaai.net/docs) and [Tura llms.txt](https://turaai.net/llms.txt) — backward reasoning as outcome-first constraint analysis.
- [Understanding by Design white paper](https://files.ascd.org/staticfiles/ascd/pdf/siteASCD/publications/UbD_WhitePaper0312.pdf) — desired results, evidence, and aligned activities.
- [UIC backward design guide](https://teaching.uic.edu/cate-teaching-guides/syllabus-course-design/backward-design/) — backward design as an evidence-led planning sequence.
- [Cucumber Example Mapping](https://cucumber.io/docs/bdd/example-mapping/) — stories, rules, examples, and questions for fit checks.
