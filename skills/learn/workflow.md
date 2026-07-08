# Learn Workflow

Use when the user explicitly says `learn` or asks the agent to remember a correction, convention, finding, or reusable pattern from the current session.

## Intent

**WHY this workflow exists:** User corrections and advisor findings encode preferences, project conventions, and reusable workflow gaps. Capture only durable lessons so the same correction is not repeated.

**WHAT this workflow produces:** Memory entries for personal preferences, repo documentation updates for project rules, shared workflow/rule proposals for cross-project behavior, verifier guidance updates for evidence discipline, verifier feature requests for runtime capability gaps, or no action for one-off friction.

**Decision Rules:**

- `learn` means durable persistence beyond the current conversation.
- Extract only durable, reusable lessons from the current session; ignore one-off friction, transient tool failures, and speculative ideas that have not repeated.
- Store personal preferences or recurring agent behavior corrections in memory.
- Externalize project-specific lessons in the nearest appropriate repo file: `AGENTS.md`, a local `README.md`, or an `agents/` workflow/reference.
- Propose shared workflow or rule updates only when the lesson is reusable across projects.
- Route evidence, verification discipline, advisor behavior, and verifier setup lessons toward `omp-verifier` guidance/rules when prompt-level behavior is enough.
- Propose an upstream `omp-verifier` feature request title/body when the lesson needs command, runtime, harness, or automation support; file it only when issue filing is explicitly authorized.
- If the lesson suggests more automatic knowledge accumulation, prefer natural-language correction/fix flows first; treat compaction-time or harness automation as a separate product question only after repeated evidence.
- Before editing shared guidance, output the proposed changes first unless the user explicitly asked to apply them.
- Keep `AGENTS.md` as a short cross-cutting index; shard detailed guidance near the code or in `agents/`.
- When externalization changes repository guidance and commits are authorized, commit the repo update after verification.
- Ask when a correction has multiple plausible meanings.

## Process

1. Review the current session's user corrections, advisor findings, and user-authored changes.
2. Identify the durable lesson: preference, project convention, reusable workflow/rule, verifier guidance, verifier feature request, or no action.
3. Ask for clarification if the lesson is ambiguous.
4. Store personal or recurring behavior corrections in memory.
5. Externalize repo-specific guidance in the nearest appropriate repo file.
6. Propose shared workflow/rule updates for cross-project lessons; apply them only when already authorized.
7. Route verifier-related lessons to guidance/rules for prompt behavior or to a proposed upstream feature request for command/runtime support.
8. Report what was remembered, changed, proposed, or intentionally skipped.

## Examples

- Release/install claims require shipped-artifact evidence: update shared verification guidance or verifier rules; do not claim success from local checks alone.
- Product-scope rules belong in the product repo; internal agent workflow rules belong in shared workflows or rules.
- A correction such as "this is wrong, read project standards, fix and learn" should produce a terse durable lesson, placement decision, and smallest safe persistence action from the current session.

## Output Contract

Return concise bullets with each durable lesson, its placement, and any repo documentation updated or proposed. Include skipped one-offs as `No action` only when that decision matters.
