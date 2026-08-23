# Worktree Creation Workflow

Use this workflow before starting issue work in a separate Git worktree.

## Goal

Create an issue worktree without guessing its layout or forgetting the repository's local environment setup.

## Command

From any directory in the target repository, resolve the installed package binary and run:

```bash
agent_rebase_edit=$(command -v agent-rebase-edit) || exit 1
agent_worktree="$(dirname "$agent_rebase_edit")/agent-worktree"
[ -x "$agent_worktree" ] || exit 1

if worktree_path=$("$agent_worktree" wrapx-243); then
  cd "$worktree_path"
else
  exit 1
fi
```

The resolved executable keeps the target repository as its current directory. It prints only the absolute worktree path to standard output and writes diagnostics to standard error, so the guarded `cd` is safe.

For primary checkout `./wrap`, the default result is:

```text
../wrap-worktrees/wrapx-243
```

It creates branch `wrapx-243` from the current `HEAD`. A project with a different branch convention can supply it explicitly:

```bash
agent_rebase_edit=$(command -v agent-rebase-edit) || exit 1
agent_worktree="$(dirname "$agent_rebase_edit")/agent-worktree"
[ -x "$agent_worktree" ] || exit 1
"$agent_worktree" wrapx-243 --branch issue/243-wrap --base origin/main
```

The worktree name must be one safe path segment. The command refuses existing paths and branches rather than overwriting user data. Re-running it for the same registered path and branch returns that path.

## Local Environment

When present, a root `.envrc` is copied into the new worktree. If `direnv` is installed and the new worktree has `.envrc`, the command runs `direnv allow` there.

It deliberately does not copy `.env`, `.env.development`, or other secret-bearing files by default. A project can opt in to additional repository-relative files with a root `.agent-worktree.json`:

```json
{
  "copy": [".env", ".env.development"]
}
```

Each configured path must resolve inside the repository and name a file. Missing files are skipped. Files already present in the selected base commit are not overwritten.

Do not add `.envrc.example`; environment and token setup remain local unless a user explicitly requests a versioned example file.

## OMP Boundary

OMP's `worktree` / `wt` command only lists or clears OMP-managed worktrees under `~/.omp/wt`. It does not create issue worktrees in this layout.

## Verification

After creation, verify the new worktree is on the requested branch and use the target repository's documented setup wrapper before starting its runtime:

```bash
git -C "$worktree_path" branch --show-current
```
