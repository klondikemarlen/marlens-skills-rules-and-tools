---
name: reviewable-pull-requests
description: "Recommend pull requests of at most 30 changed files and reassess growing work for cohesive GitHub stacks."
condition: "\\bgit\\s+push\\b|\\bgh\\s+pr\\s+(create|ready|merge)\\b|\\bready for review\\b"
scope: "tool:bash"
---

Recommend at most 30 changed files per pull request. During ticket planning, as a PR approaches or grows beyond that size, and before readiness, apply [Plan Reviewable PR Slices](../docs/workflows/hands-off-agentic-coding-workflow.md#plan-reviewable-pr-slices) and [PR Size and Stack Planning](../docs/workflows/pull-request-management-workflow.md#pr-size-and-stack-planning).

Prefer cohesive GitHub stacked PRs for dependent slices and separate independent PRs for unrelated work; a stack keeps the overall task visible while each PR stays small and targeted. Measure each review unit against its actual base, keep required callers/tests and verification with its behavior, and do not report the overall ticket complete after only one slice.

When a contract change would force a large atomic cutover, prefer gradual deprecation: add a small wrapper or adapter that defers to the old or new implementation, mark the old path deprecated with its removal step named in the plan, and remove it in a later targeted PR. Extra transitional code is acceptable when it keeps each PR reviewable; it is not an excuse for permanent shims.

This is a global recommendation, not a hard file-count gate. Preserve justified atomic contract cutovers and uniform mechanical changes rather than manufacturing fragmentation. State a useful exception rationale in the existing plan or review discussion. When native GitHub stacking is requested, chained bases and descriptive links alone are not proof of registration; follow the existing stack procedure and verify remote membership/order without changing heads, draft states, or repository authorization implicitly.
