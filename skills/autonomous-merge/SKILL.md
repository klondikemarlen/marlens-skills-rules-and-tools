---
name: autonomous-merge
description: Merge an already-authorized feature or evolve delivery, including a corrected PR after fresh verification. Does not grant merge permission or bypass required human approval, CI, or host protection.
---

# Autonomous Merge

Use the local `docs/workflows/autonomous-merge-workflow.md`, then `agents/workflows/autonomous-merge-workflow.md`; otherwise use the [packaged workflow](workflow.md).

Invoke `/skill:autonomous-merge <PR URL>` for the PR in an already-authorized delivery. As an agent, select this skill at Feature's final merge step, including delivery composed through Evolve. Do not import the operator [Review and Merge](../review-and-merge/SKILL.md) post-fix hold into an autonomous delivery or use this skill to clear an existing operator hold.

See the [decision examples](../../examples/outcome-skills.md#autonomous-merge).
