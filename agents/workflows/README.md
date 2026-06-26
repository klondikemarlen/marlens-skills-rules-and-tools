# Workflows

Reusable AI-agent procedures live here.

## Intent

**WHY this directory exists:** Workflows turn repeated agent tasks into explicit procedures so agents
do not infer important decision rules from examples or prior chat.

**WHAT this directory produces:** Reusable workflow files with clear inputs, steps, decision rules,
and output contracts.

**Decision Rules:**
- **Workflow shape:** Start each workflow with an `Intent` section that states why it exists, what it
  produces, and the key decision rules.
- **Specificity:** Keep project-specific details out of generic workflows. If a workflow is
  project-specific, put it under a project-named subtree or name that scope explicitly.

## Naming

Use `verb-noun-workflow.md` or `task-domain-workflow.md`.

Examples:

- `pull-request-management-workflow.md`
- `testing-instructions-workflow.md`
- `release-notes-workflow.md`

## Authoring Rules

- State when to use the workflow.
- List required source material to inspect before acting.
- Include ordered steps for the expected path.
- Include decision rules for common forks.
- Include an output contract.
