# Improve Workflow

Use when asked to reassess a project's purpose, durable knowledge, or implementation opportunities. Produce one justified improvement or an evidence-backed no-change result—not a speculative rewrite campaign.

## Intent

**WHY this workflow exists:** Projects accumulate gaps between their purpose, durable knowledge, and current implementation. Reassessment is useful only when evidence identifies a consequential mismatch or confirms that current owners already meet the need.

**WHAT this workflow produces:** A bounded, evidence-grounded improvement with a verifiable outcome, or a clear no-change decision with the evidence and scope examined.

## Decision Rules

- Start with the project's stated purpose, user needs, local guidance, and current implementation. Treat local instructions as authoritative for scope, review, verification, release, and publication.
- Reuse the existing owners: [Project Knowledge Base](../../docs/workflows/project-knowledge-base-workflow.md) for durable project facts and docs; [Self-Improvement](../../docs/workflows/self-improvement-workflow.md) for shared agent guidance or evidence-backed technical debt; [Domain Modeling](../../docs/workflows/domain-modeling-workflow.md) and the [Domain Discovery Checkpoint](../../docs/references/code-organization-reference.md#domain-discovery-checkpoint) for domain boundaries and organization; [Feature](../../docs/workflows/feature-workflow.md) for issue-to-release delivery.
- Better models, newer tools, theoretical elegance, or the possibility of a language rewrite are not evidence of a problem or improvement. Require an observed user or maintainer need, correctness or safety risk, measurable maintainability/discoverability/verification gap, or concrete opportunity tied to purpose.
- Keep project-specific knowledge in its owning project; do not turn downstream inspection into permission to edit or publish there. File external issues only when authorized for that exact target.
- Prefer the smallest complete improvement. Do not dump unrelated docs, add duplicate workflow bodies, create runtime orchestration, or begin an unrequested implementation campaign.
- For a drastic alternative such as replacing the language or architecture, establish the concrete problem, compare realistic alternatives against the outcome, identify migration/interoperability/maintenance costs and risks, and produce a bounded outcome-first plan with reviewable slices before any implementation. Do not autonomously begin the rewrite.
- A no-change result must name the evidence and relevant owners checked, explain why they already meet the stated purpose or why no actionable gap was established, and identify meaningful residual uncertainty. It is not a substitute for reachable authorized work.

## Process

1. **Bound the reassessment.** Identify project, intended purpose/users, authorized target, success condition, non-goals, and relevant local release/review constraints. Reuse an issue or plan rather than creating a parallel record.
2. **Inspect the current sources of truth.** Read local guidance and project/contribution/release docs; review the current product/domain knowledge, architecture map, relevant implementation, and tests or QA evidence. Separate intended behavior, implementation behavior, and observed outcomes; record conflicts instead of guessing.
3. **Map opportunities to owners.** Check whether existing project-knowledge-base, self-improvement, domain-modeling/code-organization, feature, or QA paths already address the finding. Revisit domain topology, cohesive concepts/lifecycles, change clusters, varying dispatch, invariants, dependency direction, and sibling conventions before suggesting organization or refactoring. Distinguish evidence from hypotheses.
4. **Select one outcome.** Classify the strongest actionable finding as a small authorized improvement, a scoped feature/bug needing the feature workflow, an authorized proposal to its actual owner, already covered, or no action. State the observable success condition and smallest relevant proof. For significant choices, use the [Outcome-First Planning](../../docs/workflows/outcome-first-planning-workflow.md) workflow. Do not let model/tool comparisons substitute for user outcome evidence.
5. **Deliver within authority.** Make only the authorized bounded change, at its existing durable owner; otherwise prepare the scoped plan or proposal only where authorized. Reconcile material knowledge gaps needed to understand that outcome at their existing documentation owners; leave already-correct knowledge unchanged rather than adding a session diary. Apply the project's required issue, branch, review, verification, release, and install process through the feature workflow. Do not claim a delivery or publish without observed evidence.
6. **Close the reassessment.** Verify against the stated outcome using relevant evidence. Report the improvement or evidence-backed no-change, sources examined, verification and residual risk. If work remains incomplete, continue reachable authorized work or state the exact blocker; never describe an incomplete result as done.

Stop when the selected outcome and its relevant proof are complete, or a specific external prerequisite blocks further authorized work. Do not broaden into unrelated cleanup.

## Related Workflows

- [Project Knowledge Base](../../docs/workflows/project-knowledge-base-workflow.md)
- [Self-Improvement](../../docs/workflows/self-improvement-workflow.md)
- [Domain Modeling](../../docs/workflows/domain-modeling-workflow.md)
- [Feature Delivery](../../docs/workflows/feature-workflow.md)
- [Outcome-First Planning](../../docs/workflows/outcome-first-planning-workflow.md)

## Reporting

Give the user the relevant outcome, evidence, changed owner or link, and residual risk/blocker. A concise no-change report is valid when evidence supports it; do not create a separate public report that duplicates an existing record.
