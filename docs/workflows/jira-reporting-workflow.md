# Jira Reporting Workflow

Use when filing or drafting Jira Bugs, features, or general reports from user requests, emails, or observed product behavior.

## Intent

**WHY this workflow exists:** Jira reports need enough preserved evidence and structure to let the receiving team understand the request without inventing a cause or losing the reporter's words.

**WHAT this workflow produces:** A readable Jira description with reusable structure, project-local fields, and evidence that distinguishes observed behavior from the proposed response.

**Decision Rules:**

- Read the target project's Jira guidance, comparable tickets, and field requirements before choosing issue type, labels, components, or relationships.
- Keep project keys, issue types, labels, components, clients, and cross-system processes in project-local guidance.
- Use H1 headings for `Context`, `User Report`, and `Proposed Solution` or `Proposed Solutions`; do not use bold text as a primary-section heading.
- Make `User Report` a self-contained, human-readable account of the current problem and impact. Explain what conversational shorthand refers to; an approval fragment alone is not a problem report. Keep the issue distinct from its proposed solution.
- Apply [Standalone Reports](../references/guidance-precedence-reference.md#standalone-reports) within the project's report shape: write from the current evidence-backed understanding, not a rebuttal to earlier assumptions. Put qualifications beside introduced evidence unless a material uncertainty or safety limit belongs in the opening. Preserve necessary diagnostics and explicitly requested chronology; see the [contrasting examples](../../examples/reader-focused-publication.md#standalone-reports).
- Preserve material user quotes in a blockquote with enough context to understand their referent. Quote only actual source wording; never fabricate quotations or attribute an assistant-written explanation as verbatim user speech. Name a reporter only when that disclosure is appropriate.
- Use H2 `To Reproduce` and `Expected Behavior` under `Context` for Bugs when known and useful. State observed versus expected behavior without inventing a root cause.
- Use H3 headings only for individual reports or numbered options beneath an H1 section.
- Embed supplied screenshots when the target supports media embeds. Do not invent source links from email message IDs or opaque identifiers; link a real remote source only when one exists.

- Link related Jira issues with the relationship that matches the evidence: use a dependency only when one issue blocks or requires the other, otherwise keep the relationship independent.
- Filing or drafting a report alone does not start implementation. When asked to work on a Jira ticket, apply [Ticket Lifecycle](feature-workflow.md#ticket-lifecycle) for assignment, active work, review, and post-merge transitions. Resolve the intended person's Jira account separately from GitHub and use currently allowed transition IDs; a board column is not necessarily one issue status.

## Human-Sized Feature Descriptions

An ordinary feature proposal is not an implementation specification. Keep a short problem, proposed change, a few essential acceptance criteria, and useful links within the project's required report shape. Remove repeated caveats, exhaustive field inventories, and speculative implementation plans while retaining agreed scope, material risks, necessary diagnostics, and explicitly requested detail. There is no rigid word limit.

Before: “Add tag search with a tokenizer, indexing pipeline, API fields, UI events, rollout stages, several repeated no-migration caveats, and an exhaustive list of possible future syntax.”

After, using the existing report headings:

```markdown
# Context

Finding tagged workflows requires opening individual records.

# User Report

Tags should help people find workflows across the workflow list.

# Proposed Solution

Add workflow-wide tag search.

Acceptance:

- Search finds workflows by their tags across the workflow list.
- Changed tags are searchable.
- Existing tags are not migrated.
```

The example assumes that scope was agreed; do not invent it for another request. Link real supporting issues when useful instead of repeating their implementation detail.

## Authorized Comment Voice

For an authorized comment spoken on the user's behalf through their account, express views they actually supplied in first person or omit unnecessary attribution. Replace “Marlen considers richer tags useful” with “I think richer tags could be useful” only when the user expressed that view. Keep comments brief and natural; detailed scope belongs in the description. Distinguish this from a third-party report, where legitimate reporter attribution or a requested formal report remains appropriate. This governs wording after publication is authorized: it does not invent opinions, impersonate another account, or authorize posting.

## Process

1. Read the project-local Jira workflow, comparable tickets, and target field requirements.
2. Separate reusable report content from project-local metadata and routing.
3. Draft `# Context` with the concise problem and impact. For a Bug, add `## To Reproduce` and `## Expected Behavior` when evidence supports them.
4. Add `# User Report` with a concise explanation understandable without conversation history. Explain the current problem and impact separately from the proposed solution, then include useful material source language with `>`.
5. Add `# Proposed Solution` for one response, or `# Proposed Solutions` with H3 headings for explicit alternatives.
6. Embed supplied visual evidence when supported. Add source links only for real external URLs.
7. Before filing, verify headings, project-local metadata, links, evidence, and issue relationships against comparable tickets.

## Output Contract

```markdown
# Context

<problem and impact>

## To Reproduce

<supported steps, when applicable>

## Expected Behavior

<supported expected behavior, when applicable>

# User Report

<self-contained explanation of the current problem and impact; explain conversational referents>

> <material verbatim source quote, when useful; not an assistant-written paraphrase>

# Proposed Solution

<concrete response>
```
