<!-- Derived from agents/workflows/learn-workflow.md. Edit that file, then run npm run sync:skill-workflows. -->

# Learn Workflow

Use when the user explicitly says `learn` or asks the agent to remember a correction, convention, or reusable pattern.

## Intent

**WHY this workflow exists:** User corrections encode preferences and project conventions. Capture only durable lessons so the same correction is not repeated.

**WHAT this workflow produces:** Memory entries for personal preferences, repo documentation updates for shared project rules, and workflow updates only when the lesson is reusable.

**Decision Rules:**

- `learn` means durable persistence beyond the current conversation.
- Store durable lessons in memory and externalize them into repo docs when they affect shared rules, workflows, or project conventions.
- Keep `AGENTS.md` as a short cross-cutting index; shard detailed guidance near the code or in `agents/`.
- Update workflows only for reusable decision rules, not one-off fixes.
- When externalization changes repository guidance and commits are authorized, commit the repo update after verification.
- Ask when a correction has multiple plausible meanings.

## Process

1. Review the user correction or recent user-authored change.
2. Identify the durable lesson: formatting, naming, structure, workflow, or project convention.
3. Ask for clarification if the lesson is ambiguous.
4. Store personal or cross-project preferences in memory.
5. Externalize repo-specific guidance in the nearest appropriate repo file: `AGENTS.md`, a local `README.md`, or an `agents/` workflow/reference.
6. If the lesson changes a reusable procedure, update the relevant workflow.
7. Report what was remembered and what repo file changed.

## Output Contract

Return concise bullets with the learned pattern, where it was stored, and any repo documentation updated. Include before/after examples only when they make the rule clearer.
