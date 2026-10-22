# Simplify Workflow

Use when asked to make a codebase easier to understand. This targets evidenced code-maintenance burden, not formatting, metrics, or speculative future flexibility.

## Intent

**WHY this workflow exists:** Small, behavior-preserving simplifications can reduce the effort and risk of future changes; mechanical fragmentation can make both worse.

**WHAT this workflow produces:** One justified hotspot improved and verified, or a concise evidence-backed no-change conclusion that the inspected candidates do not merit modification.

## Process

1. Read project-local instructions, source-adjacent guidance, and the relevant code and tests. Follow local style and verification rules. For potential organization or boundary changes, use the [Domain Discovery Checkpoint](../references/code-organization-reference.md#domain-discovery-checkpoint); revisit topology, cohesive concepts, change clusters, varying dispatch dimensions, owned invariants, dependency direction, and sibling conventions. Treat signals as hypotheses, not proof of a new boundary.
2. Form a small shortlist of actual code hotspots from observed nesting, density, mixed responsibilities, or recurring change clusters. Name the concrete comprehension or maintenance burden for each candidate and inspect the surrounding callers, errors, side effects, and tests. Apply the [Self-Improvement Workflow](self-improvement-workflow.md)'s evidence standard: a simplification is actionable only when current evidence shows a maintainability, correctness, safety, or verification risk. These signals are not complexity-score targets. Do not create a repository-wide audit, sweep formatting, or include unrelated cleanup.
3. Choose one hotspot where a bounded change can reduce ownership or comprehension burden. If none has sufficient evidence or a safe improvement, make no change and explain the inspected candidates and why the current design is better or not demonstrably worse. Do not force a refactor to satisfy the request.
4. Identify the behavior contract and smallest meaningful verification before editing. Preserve behavior, callers, API shape, error handling, ordering, and side effects. Prefer deletion or a clearer existing pattern over new abstraction. Use code-organization guidance to discover real responsibility boundaries; do not split files, extract helpers, or lower nesting/count metrics unless the result makes ownership and reasoning genuinely clearer. Never hide behavior changes in a simplification.
5. Implement only the selected change. If evidence reveals that the safe fix is a broader behavior change, new feature, or multiple coupled boundaries, stop and route that work through its appropriate outcome/feature process instead of silently expanding scope. Actual code changes must follow the project's applicable ticket, branch/worktree, review, and release workflow; use the [Feature Workflow](feature-workflow.md) for feature delivery. Do not make commits or publish without the project's authorization and process.
6. Verify preserved behavior with focused existing tests or the smallest relevant project check; respect project-specific required gates and documented wrappers. Inspect the final diff for unnecessary fragmentation and confirm the changed code, callers, and tests still tell a coherent story. Report exact proof and blockers; never claim unrun checks.
7. Explain what became easier to understand: name the responsibility, control flow, or invariant now clearer, and the evidence that behavior remained intact. If unchanged, explain why no candidate justified the risk or cost. Keep the report concise; no recurring status template.

## Completion

Stop after one selected improvement is behaviorally verified and its required delivery/release/install gates are complete, or after evidence establishes a no-change decision or a precise blocker. A lower metric or smaller file is not success by itself.
