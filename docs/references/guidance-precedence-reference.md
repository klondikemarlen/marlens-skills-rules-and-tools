# Agent Guidance Precedence Reference

Use this as the canonical placement and precedence rule for this package.

## Precedence

1. System/developer instructions in the active agent session win over repository files.
2. The target project’s local instructions win over this shared package.
3. This package is the fallback base layer for reusable guidance.
4. Thin skill entrypoints point to authoritative workflow files; they do not replace them.
   Within the user-authored task scope, a later explicit instruction narrows or supersedes an earlier broad workflow directive; it does not override a higher-precedence source.

For OMP rules, an installed package's `rules/` files are default guidance. A user or project rule with the same `name` overrides the package rule; differently named local rules extend the active set. Use OMP's `ttsr.disabledRules` setting only for deliberate disablement.

Before applying a workflow from this package, read the target project’s local guidance when it exists:

- `AGENTS.md` or equivalent project agent rules
- `README.md`
- `COMMITTING.md`
- `bin/README.md` or dev-wrapper docs
- project-local `docs/` workflows, templates, references, or plans
- project-local skill files or agent shortcuts

## Placement

| Guidance type               | Canonical home     | Use for                                                                  |
| --------------------------- | ------------------ | ------------------------------------------------------------------------ |
| Global rules                | `AGENTS.md`        | Cross-project safety, release, and operating rules loaded by agents.     |
| Shared agent-agnostic rules | `AGENT_RULES.md`   | Repo-wide decision rules that are not tied to one agent runtime.         |
| Commit guidance             | `COMMITTING.md`    | Commit-message and commit-scope conventions.                             |
| Workflows                   | `docs/workflows/`  | Reusable task procedures with inputs, steps, and output contracts.       |
| Templates                   | `docs/templates/`  | Copyable end-state shapes for code, docs, or generated artifacts.        |
| References                  | `docs/references/` | Durable background guidance, policies, concepts, and technique notes.    |
| Plans                       | `docs/plans/`      | Exploratory or multi-phase implementation plans.                         |
| Skills                      | `skills/`          | Compatibility entrypoints that route agents to authoritative workflows.  |
| OMP rules                   | `rules/`           | Reusable OMP rule snippets that may be copied or linked into user rules. |

For a single public skill or command whose purpose remains clear, prefer the shorter name, such as `triage` rather than `ticket-triage` or `triage-tickets`. Add qualifiers only to distinguish actual alternatives. Keep internal filenames descriptive; this preference does not mandate abbreviations, aliases, or unrelated renames.

## Workflow Outputs and Publication

A workflow's output contract describes the knowledge, decisions, and evidence needed to complete the work. It is not a mandatory public document shape or permission to post. Keep execution records in the session or the existing designated check, artifact, or work record unless the user or project explicitly selects another destination. Required verification, review, ownership, and honest limitations still apply.

Choose public communication by the reader's need, not by the amount of work performed. Publish only information that answers a real question, changes a decision, exposes a material risk or prerequisite, or supplies necessary new evidence. If the existing record already communicates it and no response is needed, make no new write. Routine success, CI echoes, rebase/cleanup diaries, and learner-no-action bookkeeping do not become discussion merely because a workflow requires recording them.

| Destination                            | Reader-Facing Purpose                                                                                                                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session or existing execution evidence | Retain detailed checks, current-head results, investigation, and internal bookkeeping without publishing a running diary. Link an appropriate existing check/artifact when readers need supporting detail.                                                                    |
| PR description                         | Explain the current purpose, changed behavior, material prerequisites, and reproducible testing within the repository's canonical template. Follow [Description and Evidence Placement](../workflows/pull-request-management-workflow.md#description-and-evidence-placement). |
| Existing issue or review conversation  | Answer the actual question or finding, communicate a decision or actionable risk, or add genuinely missing context in its owning thread. Do not repeat the full report or information already visible in checks.                                                              |
| Explicitly requested report or handoff | Preserve the requested detail and format in the selected destination; update an existing designated report in place rather than creating competing summaries.                                                                                                                 |

Write the smallest useful answer, result, risk, or next action with the supporting link or limitation it needs. Concision must not hide a blocker or remove explicitly requested detail. Keep historical evidence tied to its revision; a self-review or old PASS is not independent approval or proof of the current state.

Downstream links supplied as examples of a shared instruction problem are read-only research inputs. Improve the shared owner when that is the requested outcome; a broad follow-up such as “do what you think is best” does not turn those examples into cleanup targets. Editing or deleting downstream history requires an explicit cleanup request and target scope.

### Standalone Reports

Compose a report from the final evidence-backed understanding: lead with the current observable problem and its impact, then give expected versus actual behavior and relevant supporting evidence within the project's report shape. Do not make the opening a rebuttal to the agent's earlier assumptions. Omit superseded hypotheses and conversational corrections unless they independently help the receiving reader; a reader should not need the troubleshooting conversation to understand the report.

Introduce a diagnostic observation before discussing its limits or possible relevance. Place a qualification beside the evidence it qualifies, rather than foregrounding an unexplained comparison. Keep a material uncertainty or safety limitation in the opening when it changes how the reader must interpret the problem or act. Preserve necessary diagnostics, affected versions, regression history, and explicitly requested chronological detail, clearly distinguishing historical hypotheses from current findings. This is a relevance and placement rule, not a ban on caveats, technical detail, or investigation history.

## Rules

- Keep project-specific commands, services, routes, domain terms, auth, schemas, deployment details, and UI labels in the target project.
- Keep this shared package generic unless the filename or directory clearly identifies a project-specific scope.
- Do not copy full workflow bodies into skill entrypoints; link to the workflow.
- Do not mirror project-local docs into this package just for discoverability; extract only reusable guidance.
- Prefer directory discovery over long duplicated inventories. Directory READMEs should route readers to authoritative files, not repeat procedures.
- If a document must mention precedence for its audience, link back here instead of restating the full policy.
- Keep rationale for a local override next to the affected local guidance or in existing project agent instructions; do not maintain a separate guidance inventory.
