# Jira Reporting Workflow

Use when filing or drafting Jira Bugs, features, or general reports from user requests, emails, or observed product behavior.

## Intent

**WHY this workflow exists:** Jira reports need enough preserved evidence and structure to let the receiving team understand the request without inventing a cause or losing the reporter's words.

**WHAT this workflow produces:** A readable Jira description with reusable structure, project-local fields, and evidence that distinguishes observed behavior from the proposed response.

**Decision Rules:**

- Read the target project's Jira guidance, comparable tickets, and field requirements before choosing issue type, labels, components, or relationships.
- Keep project keys, issue types, labels, components, clients, and cross-system processes in project-local guidance.
- Use H1 headings for `Context`, `User Report`, and `Proposed Solution` or `Proposed Solutions`; do not use bold text as a primary-section heading.
- Preserve material user quotes in a blockquote. Name a reporter only when that disclosure is appropriate.
- Use H2 `To Reproduce` and `Expected Behavior` under `Context` for Bugs when known and useful. State observed versus expected behavior without inventing a root cause.
- Use H3 headings only for individual reports or numbered options beneath an H1 section.
- Embed supplied screenshots when the target supports media embeds. Do not invent source links from email message IDs or opaque identifiers; link a real remote source only when one exists.

- Link related Jira issues with the relationship that matches the evidence: use a dependency only when one issue blocks or requires the other, otherwise keep the relationship independent.
## Process

1. Read the project-local Jira workflow, comparable tickets, and target field requirements.
2. Separate reusable report content from project-local metadata and routing.
3. Draft `# Context` with the concise problem and impact. For a Bug, add `## To Reproduce` and `## Expected Behavior` when evidence supports them.
4. Add `# User Report` and quote material source language with `>`.
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

> <material report>

# Proposed Solution

<concrete response>
```
