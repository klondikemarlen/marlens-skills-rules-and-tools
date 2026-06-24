# Global Agent Rules

## Git Safety

- Do not stage or commit without explicit user request.
- If the user says "commit staged fix", commit staged files only; if none are staged, ask the user to stage them first.
- Only stage files when the user explicitly says to stage files.
- **Pre-commit gate:** Before running `git commit`, pause and check whether the user's last message contained the word "commit" or "stage". If not, do not commit — stage the changes and ask for confirmation. Do not infer intent from context ("continue", "go ahead", "fix it").
- If uncertain, ask before any git operation.
- Assume multiple agents or the user may be working in the same repo; never overwrite or revert unrelated changes.
- Do not add Co-Authored-By trailers to commits.

## Edits

- Make multi-location edits from local usage outward; update imports, exports, and shared declarations last.
- Find all affected references before deleting or renaming repeated code.
- For line-based patch/delete ranges, work from the bottom of the file upward so pending locations stay stable.
- Prefer sed or regex for bulk replacements, then verify by reading affected code and running relevant checks.
- Prefer self-documenting code; add comments only for non-obvious rationale.

## Style Defaults

- Use descriptive names and avoid abbreviations unless the project already uses them.
- Prefer expanded, readable control flow: guard clauses, blank lines after guards, and named constants for magic values.
- Keep project-specific architecture, schema, auth, and formatting rules in the project's local docs.

## Agent Architecture

- Skills are not used directly. The equivalent is **workflows** (process guidance) + **templates** (code examples/end state).
- Per-agent skills may serve as thin shortcuts to existing workflows, but never as substitutes.
- **Plans** are a separate category for exploratory, multi-phase work — not a skill or workflow.
- Keep durable project-specific patterns in the project's local docs. Only promote cross-project
  process habits to global rules or memory.

## Branch Continuation

- When resuming ongoing branch work, inspect the repository state instead of relying on chat memory
  alone.
- Separate completed commits, staged changes, unstaged changes, and untracked files when summarizing
  current work.
- Treat staged files as intentionally selected work unless the user says otherwise.
- Preserve unrelated unstaged and untracked files. Plan files and exploratory notes are context, not
  commit candidates, unless the user explicitly asks to include them.
- Compare any existing plan or handoff note against current code and commits before using it as a
  checklist.

## Cloud Infrastructure Safety

- Do not run write, edit, deploy, or restart commands against production cloud infrastructure. Use read-only inspection only, and provide proposed commands for the user to run.
- Only run write, edit, deploy, or restart commands against non-production cloud infrastructure when the user explicitly asks for that exact action in the current conversation.

## Shell

- Use `rtk` as a CLI proxy for supported Bash commands when compact, token-optimized output is useful. It filters command output before it reaches the LLM; do not use it when raw output or normal command behavior is needed.
- When a project provides a dev wrapper, use it for development and testing Docker Compose commands. The wrapper selects the correct compose files, profiles, environment, and service wiring. Only use raw Docker Compose for explicitly local production-build validation or when no project wrapper exists.

## Browser Automation

- Do not use Playwright unless the user explicitly asks for Playwright, browser automation, or UI interaction.
- When asked for PR QA, browser QA, or testing instructions, first check for a repo-local testing or QA workflow and follow it before inventing steps. If the repo has no workflow, still verify UI labels and routes from source or browser state before writing instructions.
