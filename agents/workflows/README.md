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
- **Skill shims:** Keep substantive procedures here. Top-level `skills/` files should stay thin aliases
  that point to the authoritative workflow or template under `agents/`; do not mirror workflow files under `skills/`.
- **Local precedence:** Project-local rules, docs, workflows, templates, and skills override this
  package. Use this package only as the base layer when the target project does not say otherwise.
- **Command discovery:** Read project-local setup docs and wrappers before choosing commands. For
  example, prefer a repo's `bin/dev` or documented Docker wrapper over raw commands.

## Naming

Use `verb-noun-workflow.md` or `task-domain-workflow.md`.

Examples:

- `code-review-workflow.md`
- `commit-workflow.md`
- `express-light-rail-backend-workflow.md`
- `feature-workflow.md`
- `git-rebase-workflow.md`
- `learn-workflow.md`
- `node-express-api-workflow.md`
- `pull-request-management-workflow.md`
- `testing-instructions-workflow.md`
- `pull-request-comment-resolution-workflow.md`
- `release-notes-workflow.md`
- `typescript-migration-slice-workflow.md`
- `upload-pr-screenshots-workflow.md`

## Authoring Rules

- State when to use the workflow.
- List required source material to inspect before acting.
- Include ordered steps for the expected path.
- Include decision rules for common forks.
- Include an output contract.
