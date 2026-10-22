# Advance Workflow

Use when asked to move a project forward but not given a specific implementation. A clear user scope takes precedence: carry it through the applicable workflow rather than substituting this selection process.

## Intent

**WHY this workflow exists:** Progress is more than closing the next issue. Choosing from accepted direction and current constraints helps deliver useful outcomes without inventing demand or draining a backlog.

**WHAT this workflow produces:** One completed, bounded project outcome, or an evidence-backed no-action/blocker finding, with the applicable verification and release evidence.

## Process

1. Read project-local instructions, README and contribution/release guidance first. Identify the project's purpose, accepted direction, relevant plans, active issues, and known blockers; distinguish accepted work from speculation. Reuse existing outcome and acceptance evidence rather than making another status or planning record.
2. Revalidate relevant issue state and inspect nearby issues before starting a branch or worktree. Use [Related-Issue Triage](feature-workflow.md#related-issue-triage) to determine whether closely related work belongs in one small delivery. Record learner coverage where required by the feature workflow; do not create duplicate tickets or claim ticket ownership during read-only triage.
3. Select one valuable, bounded, cohesive outcome by expected user or maintainer impact, unblocking value, and maintenance cost—not by which issue is easiest to close. Respect dependencies, project constraints, and explicit priority. Do not drain the backlog, expand into adjacent work, or invent a need. Stop selection when no current, accepted, actionable outcome has sufficient evidence; report why without manufacturing a task.
4. State the outcome, observable success condition, smallest relevant proof, and non-goals using the existing issue or plan where possible. If work is broad, plan reviewable, independently useful slices with boundaries, proof, and dependencies; do not partition by file count or start implementation before the slice order is clear. A clear user-defined outcome does not need to be reselected.
5. Before changing anything, establish the exact prerequisites for the selected work and applicable verification. Use the repository's documented setup and test wrappers. Treat already-covered or no-action work as complete only with evidence; do not reimplement it. If a necessary prerequisite is missing, identify it precisely and stop that path as BLOCKED rather than simulating progress or silently substituting a different outcome.
6. Complete the selected outcome under the project-local ticket, branch/worktree, contribution, and release process. For feature or bug-fix delivery, follow the [Feature Workflow](feature-workflow.md); preserve authorization boundaries, review, focused QA, and required release/install checks. Use other existing workflows only when their scope applies; do not duplicate their procedures here.
7. Verify the success condition with the smallest relevant runnable checks and applicable project/release gates. For published artifacts, follow the project's install/released-artifact proof. Record only useful evidence in the existing permitted location; do not append recurring status boilerplate or claim unobserved success.

## Completion

Finish when the chosen outcome meets its acceptance criteria and required verification/release steps are complete, or when evidence establishes no suitable action or an exact blocking prerequisite. State the delivered outcome and meaningful evidence, or the no-action/blocker reason. Do not imply that one bounded outcome emptied or resolved the broader backlog.
