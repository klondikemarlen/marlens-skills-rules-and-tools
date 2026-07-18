# Global Agent Rules

## Git Safety

- Do not stage or commit without explicit user request.
- If the user says "commit staged fix", commit staged files only; if none are staged, ask the user to stage them first.
- Only stage files when the user explicitly says to stage files.
- **Pre-commit gate:** Before running `git commit`, pause and check whether the user's last message contained the word "commit" or "stage". If not, do not commit — stage the changes and ask for confirmation. Do not infer intent from context ("continue", "go ahead", "fix it").
- Repo-specific exception: when the current repository is `klondikemarlen/marlens-skills-rules-and-tools`, an explicit request to follow the GitHub issue or feature request workflow authorizes staging and committing only the scoped files needed for that workflow. Keep this exception out of other repositories.
- If uncertain, ask before any git operation.
- Assume multiple agents or the user may be working in the same repo; never overwrite or revert
  unrelated changes.
- If `git status` shows staged changes you did not create, assume another agent owns them. Poll
  or wait for completion before editing, overwriting, unstaging, committing, or otherwise changing
  those files.
- If a file has uncommitted changes you did not create, preserve them and coordinate before touching
  the same file.
- If the directory is not a git repo, treat unexpected modified files the same way: assume another
  agent or the user owns them until proven otherwise.
- Do not add Co-Authored-By trailers to commits.

## Same-Origin GitHub Delivery

- When a user explicitly requests work through the current checkout's GitHub issue or feature workflow, this exception takes precedence over generic "ask when uncertain" guidance. After deriving `origin`, authorize routine non-destructive delivery only within that exact repository: create the issue and issue-named branch, stage scoped files, commit, push any necessary branch refs as an operational batch, open a linked draft pull request, and push corrective commits to same-origin draft PR branches.
- Still ask for a different, external, unresolved, or unrelated target, and for genuinely destructive or ambiguous operations.
- The opt-in `klondikemarlen/omp-github-write-guard` project enforces GitHub write boundaries outside the active checkout, so routine same-origin delivery does not depend on redundant confirmation prompts.

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

## Ponytail Standards

- Prefer deletion, reuse, standard library, native platform features, then installed dependencies before writing custom code.
- Avoid speculative abstractions, boilerplate, scaffolding, and configuration for values that do not vary.
- Fix bugs at the shared root and check sibling callers before patching one path.
- Leave the smallest runnable check for non-trivial logic; skip test scaffolding that does not protect behavior.
- Mark deliberate shortcuts with a `ponytail:` comment that names the ceiling and upgrade path.

## Agent Architecture

- Skills are compatibility entry points. The authoritative guidance categories and precedence rules are in [docs/references/guidance-precedence-reference.md](docs/references/guidance-precedence-reference.md).
  In short: workflows are procedures, templates are copyable end-state shapes, references are durable background, and plans are exploratory or multi-phase implementation notes.
  Keep global rules lean; put codebase-specific architecture, schema, framework, and naming rules in the nearest project `AGENTS.md` or `README.md`.

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

## Worktree Environment Setup

- After creating or switching to a worktree, treat it as a separate checkout: prepare it independently and do not alter the primary checkout.
- When creating a worktree from another checkout, copy each root `*.code-workspace` file from the source only when it is absent in the destination; do not overwrite destination workspace configuration.
- Before development, test, or verification commands that need the project runtime, inspect the target repository's setup docs and documented development/test wrapper.
- Prepare only dependencies needed for the requested work. For Dockerized projects or a documented wrapper such as `bin/dev`, use that wrapper or container; otherwise use the lockfile's native package-manager command.
- Skip setup for read-only work that does not need the runtime.

## Repo Release Rules

- In `klondikemarlen/marlens-skills-rules-and-tools`, bump `package.json` for every change.
- The current release mechanism is the merge to `main` on GitHub; do not claim a separate npm or marketplace publish unless a future repo-specific workflow documents it.
- After merge, reinstall with `omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools --force`, then tell the user to reload the plugin if supported or restart OMP.

## Cloud Infrastructure Safety

- Do not run write, edit, deploy, or restart commands against production cloud infrastructure. Use read-only inspection only, and provide proposed commands for the user to run.
- Only run write, edit, deploy, or restart commands against non-production cloud infrastructure when the user explicitly asks for that exact action in the current conversation.

## Shell

- Use `rtk` as a CLI proxy for supported Bash commands when compact, token-optimized output is useful. It filters command output before it reaches the LLM; do not use it when raw output or normal command behavior is needed.
- When a project provides a dev wrapper, use it for development and testing Docker Compose commands. The wrapper selects the correct compose files, profiles, environment, and service wiring. Only use raw Docker Compose for explicitly local production-build validation or when no project wrapper exists.

## Browser Automation

- Do not use browser automation unless the user explicitly asks for browser QA, UI interaction, or another browser-visible validation.
- When asked for PR QA, browser QA, or testing instructions, first check for a repo-local testing or QA workflow and follow it before inventing steps. If the repo has no workflow, still verify UI labels and routes from source or browser state before writing instructions.
