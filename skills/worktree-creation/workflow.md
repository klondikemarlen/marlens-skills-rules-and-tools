# Worktree Creation Workflow

Use this workflow before starting issue work in a separate Git worktree, or when continuing work in an explicitly selected existing worktree.

## Checkout Selection

For new repository implementation work, default to an appropriate separate Git worktree; the user does not need to request isolation each time. Before creating anything, inspect the registered worktrees, current issue/PR branch, and project-local naming/layout.

- Honor an explicitly selected checkout and higher-priority repository-boundary restrictions. The default is not permission to enter another repository or override a current-checkout instruction; obtain required authorization when the allowed target remains constrained.
- For continuing issue/PR work, reuse its verified registered worktree instead of creating a competing checkout.
- For genuinely new implementation with no selected continuation, create the appropriate same-repository worktree using this workflow and the project's branch/path conventions. Prepare its own documented runtime environment; preserve primary and unrelated checkouts.
- Read-only investigation does not require a new worktree. Follow deliberate project-local exceptions rather than mechanically creating one.

Before creating or resuming an implementation worktree for a ticket, apply [Ticket Lifecycle](../feature/workflow.md#ticket-lifecycle): assign the intended person and move the ticket into the project's active-work state. A worktree or draft-PR request is a work-start event, not just Git setup. Read-only inspection does not claim the ticket.

## Goal

Create an issue worktree without guessing its layout or forgetting the repository's local environment setup.

## Command

From any directory in the target repository, resolve the installed package binary and run:

```bash
agent_rebase_edit=$(command -v agent-rebase-edit) || exit 1
agent_worktree="$(dirname "$agent_rebase_edit")/agent-worktree"
[ -x "$agent_worktree" ] || exit 1

if worktree_path=$("$agent_worktree" wrap-243-correct-pagination); then
  cd "$worktree_path"
else
  exit 1
fi
```

The resolved executable keeps the target repository as its current directory. It prints only the absolute worktree path to standard output and writes diagnostics to standard error, so the guarded `cd` is safe.

For primary checkout `./wrap`, the default result is:

```text
../wrap-worktrees/wrap-243-correct-pagination
```

It creates branch `wrap-243-correct-pagination` from the current `HEAD`. A project with a different branch convention can supply it explicitly:

```bash
agent_rebase_edit=$(command -v agent-rebase-edit) || exit 1
agent_worktree="$(dirname "$agent_rebase_edit")/agent-worktree"
[ -x "$agent_worktree" ] || exit 1
"$agent_worktree" wrap-243-correct-pagination --branch issue/243-correct-pagination --base origin/main
```

The worktree name must be one safe path segment. Use the project convention plus a concise, meaningful outcome slug; never use opaque abbreviations or a bare issue number. The command refuses existing paths and branches rather than overwriting user data. Re-running it for the same registered path and branch returns that path.

## Target the Selected Checkout

For a new worktree, use the command's verified returned path. For an existing worktree, identify its registered path and branch before continuing; do not recreate it or change an unrelated checkout.

A shell's cwd and file tools' workspace roots can be independent. A successful `cd`/`pwd` proves that shell's location, not an all-tool workspace switch. Use each tool's supported workspace/cwd selector when available; otherwise qualify file/search/edit paths with the selected checkout. Relative paths remain valid when that tool's root is known and verified.

For example, after discovering a source path inside the selected checkout:

```text
bash(cwd="<selected-checkout>", command="git status --short --branch")
read(path="<selected-checkout>/src/feature.ts")
grep(path="<selected-checkout>/src", pattern="expectedSymbol")
```

Replace the example file with the discovered path; do not infer that a PR file is absent from an unexpected empty/missing relative result. Check the selected checkout and the file tool's root first, then retry with the verified qualified path. Keep the primary checkout and unrelated worktrees untouched.

## Local Environment

When present, a root `.envrc` is copied into the new worktree. If `direnv` is installed and the new worktree has `.envrc`, the command runs `direnv allow` there.

It deliberately does not copy `.env`, `.env.development`, or other secret-bearing files by default. A project can opt in to additional repository-relative files with a root `.agent-worktree.json`:

```json
{
  "copy": [".env", ".env.development"]
}
```

Each configured path must resolve inside the repository and name a regular file. Direct symbolic links and paths whose resolved target leaves the repository are rejected. Missing files are skipped. Files already present in the selected base commit are not overwritten.

Do not add `.envrc.example`; environment and token setup remain local unless a user explicitly requests a versioned example file.

## OMP Boundary

OMP's `worktree` / `wt` command only lists or clears OMP-managed worktrees under `~/.omp/wt`. It does not create issue worktrees in this layout.

## Verification

After creation, verify the new worktree is on the requested branch and use the target repository's documented setup wrapper before starting its runtime:

```bash
git -C "$worktree_path" branch --show-current
```
