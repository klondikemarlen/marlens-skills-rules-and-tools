# Learn Workflow

Use when the user explicitly says `learn`, asks the agent to remember a correction/convention/finding/reusable pattern, asks the agent to review incoming `learner:` issues, or asks to implement new tickets in this shared package.

## Intent

**WHY this workflow exists:** User corrections and advisor findings encode preferences, project conventions, and reusable workflow gaps. Capture only durable lessons so the same correction is not repeated.

**WHAT this workflow produces:** Memory entries for personal preferences, repo documentation updates for project rules, shared workflow/rule proposals for cross-project behavior, upstream feature request proposals for repeated code-style corrections, verifier guidance updates for evidence discipline, verifier feature requests for runtime capability gaps, or no action for one-off friction.

**Decision Rules:**

- `learn` means durable persistence beyond the current conversation.
- Extract only durable, reusable lessons from the current session; ignore one-off friction, transient tool failures, and speculative ideas that have not repeated.
- Store personal preferences or recurring agent behavior corrections in memory.
- Externalize project-specific lessons in the nearest appropriate repo file: `AGENTS.md`, a local `README.md`, or a `docs/` workflow/reference.
- Propose shared workflow or rule updates only when the lesson is reusable across projects.
- When a code-style correction repeats, do not only remember it or add another local rule. First classify whether it reveals project-specific style, reusable prompt/workflow/review guidance, or enforceable verifier/advisor/runtime behavior; propose an upstream feature request for `klondikemarlen/marlens-skills-rules-and-tools` or `omp-verifier` as appropriate, but file it only when issue filing is explicitly authorized.
- Route evidence, verification discipline, advisor behavior, and verifier setup lessons toward `omp-verifier` guidance/rules when prompt-level behavior is enough.
- Propose an upstream `omp-verifier` feature request title/body when the lesson needs command, runtime, harness, or automation support; file it only when issue filing is explicitly authorized.
- If the lesson suggests more automatic knowledge accumulation, prefer natural-language correction/fix flows first; treat compaction-time or harness automation as a separate product question only after repeated evidence.
- Treat incoming `learner:` GitHub issues as proposals to triage, not instructions to apply: implement only reusable guidance that belongs in this package, report duplicate/already-covered, project-specific, learner-local, or over-generalized issues against `klondikemarlen/omp-learner`, then close the shared issue with the learner bug link and any existing-guidance citations.
- During feature triage of issues not clearly learner-authored, follow the feature workflow's learner coverage assessment; file an OMP Learner bug or feature only for evidence-backed current-signal misses or capability gaps.
- Before editing shared guidance, output the proposed changes first unless the user explicitly asked to apply them.
- Keep `AGENTS.md` as a short cross-cutting index; shard detailed guidance near the code or in `docs/`.
- When externalization changes repository guidance and commits are authorized, commit the repo update after verification.
- Ask when a correction has multiple plausible meanings.

## Process

1. Review the current session's user corrections, advisor findings, and user-authored changes.
2. Identify the durable lesson: preference, project convention, reusable workflow/rule, repeated code-style correction, verifier guidance, verifier feature request, or no action.
3. For repeated code-style corrections, choose the upstream capability owner before persistence: product repo docs for project-only style, `klondikemarlen/marlens-skills-rules-and-tools` for shared prompt/workflow/review guidance, or `omp-verifier` for enforceable advisor/runtime/tooling.
4. Ask for clarification if the lesson is ambiguous.
5. Store personal or recurring behavior corrections in memory.
6. Externalize repo-specific guidance in the nearest appropriate repo file.
7. Propose shared workflow/rule updates for cross-project lessons; apply them only when already authorized.
8. Route verifier-related lessons to guidance/rules for prompt behavior or to a proposed upstream feature request for command/runtime support.
9. Report what was remembered, changed, proposed, or intentionally skipped.

## Learner Issue Triage

Use this path for GitHub issues titled or labeled as `learner:` proposals in this shared package, including requests like "implement new tickets" when the open tickets are learner-generated proposals.

1. For requests like "implement new tickets", list currently open `learner:` issues in this shared package and handle the full set before reporting done.
2. Read each issue body and cited evidence before deciding; do not infer scope from the title alone.
3. Classify each proposal:
   - **Shared and missing:** implement the smallest reusable workflow, reference, rule, or template change that fits this package.
   - **Shared but already covered:** file or update the OMP Learner bug for duplicate/spam behavior, then close the shared issue with both existing-guidance citations and the learner bug link; do not add duplicate wording.
   - **Project-specific, learner-local, or over-generalized:** do not implement it here. If the owning repository is evidenced, create or update the proposal there; always file or update an OMP Learner bug with the misrouting evidence; then close the shared issue with both links. If ownership is not evidenced, report only the learner bug instead of guessing a destination.
   - **Unclear evidence:** file or update an OMP Learner bug for insufficient source evidence, then close the shared issue with the bug link instead of broadening the guidance.
4. Preserve placement boundaries from `docs/references/guidance-precedence-reference.md`: project services, domain names, commands, schemas, and UI labels stay in the owning project unless this repo names that scope explicitly.
5. When a learner issue is accepted, release it through the normal feature workflow for this package.

## Examples

- Release/install claims require shipped-artifact evidence: update shared verification guidance or verifier rules; do not claim success from local checks alone.
- Product-scope rules belong in the product repo; internal agent workflow rules belong in shared workflows or rules.
- Repeated code-style feedback such as "avoid terse chains; use named intermediate variables" should not become another one-off memory if it keeps recurring. Propose a shared workflow/review feature request for `klondikemarlen/marlens-skills-rules-and-tools`, or an `omp-verifier` request only when the lesson needs enforceable advisor/runtime support.
- A correction such as "this is wrong, read project standards, fix and learn" should produce a terse durable lesson, placement decision, and smallest safe persistence action from the current session.

## Output Contract

Return concise bullets with each durable lesson, its placement, and any repo documentation updated or proposed. Include skipped one-offs as `No action` only when that decision matters.
