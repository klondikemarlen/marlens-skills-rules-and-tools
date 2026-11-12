# Worktree Creation Workflow

Use this workflow before starting ticket work in a separate Git worktree, or when continuing work in an explicitly selected existing worktree.

## Checkout Selection

For new repository implementation work, default to an appropriate separate Git worktree; the user does not need to request isolation each time. Before creating anything, inspect the registered worktrees, current ticket/PR branch, and project-local naming/layout.

- Honor an explicitly selected checkout and higher-priority repository-boundary restrictions. The default is not permission to enter another repository or override a current-checkout instruction; obtain required authorization when the allowed target remains constrained.
- For continuing ticket/PR work, reuse its verified registered worktree instead of creating a competing checkout.
- For genuinely new implementation with no selected continuation, create the appropriate same-repository worktree using this workflow and the project's branch/path conventions. Prepare its own documented runtime environment; preserve primary and unrelated checkouts.
- Read-only investigation does not require a new worktree. Follow deliberate project-local exceptions rather than mechanically creating one.

Before creating or resuming an implementation worktree for a ticket, apply [Ticket Source Selection](feature-workflow.md#ticket-source-selection) and [Ticket Lifecycle](feature-workflow.md#ticket-lifecycle): verify the authoritative ticket, assign the intended person, and move it into the project's active-work state. Preserve its exact key in the project-approved branch format; never infer a Jira key from a GitHub issue number. A worktree or draft-PR request is a work-start event, not just Git setup. Read-only inspection does not claim the ticket.

## Continue an Existing Pull Request

Before implementation on an existing PR, resolve its live head repository, branch, and commit through the tracker. Match that repository to a verified Git remote; do not assume the base repository's `origin` owns a fork's head. A fork does not expand repository-write authority.

1. Inspect `git worktree list`, local branches, upstreams, and working changes. Reuse the registered worktree checking out the actual PR head branch. Do not create a parallel `review/...` branch unless the user explicitly requests one; matching ancestry alone does not satisfy branch identity.
2. If no worktree checks out that branch, reuse the existing local branch in a new project-convention worktree. If the local branch is absent, create it from the fetched PR head branch with that head remote as its upstream—not from the default branch or current `HEAD`. Preserve unrelated worktrees and prepare the selected checkout's environment normally.
3. Before edits and again before committing or pushing, verify the selected local branch, upstream repository/branch, and that the freshly resolved PR head commit is an ancestor of local `HEAD`. Refresh the remote head before pushing. A mismatch, divergence, or conflicting local work needs reconciliation; do not reset, overwrite, rename, or rewrite existing work to make the checks pass. Keep any push explicitly targeted to the verified PR head remote and branch.

For example, after verifying that the PR's head is `issue/243-correct-pagination` in the repository served by `origin`, and that neither that local branch nor the selected worktree path exists:

```bash
head_remote=origin
head_branch=issue/243-correct-pagination
worktree_path=../project-worktrees/issue-243-correct-pagination
git fetch "$head_remote" &&
git worktree add --track -b "$head_branch" "$worktree_path" "$head_remote/$head_branch"
```

If the local branch already exists but is not checked out, use `git worktree add "$worktree_path" "$head_branch"` instead; inspect its commits and upstream rather than replacing it. In the selected checkout, compare these results to the live PR identity:

```bash
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
git merge-base --is-ancestor "$pr_head_sha" HEAD
```

Set `pr_head_sha` from the freshly resolved PR head, not an assumed local ref. The ancestry command must exit successfully; print and compare the branch/upstream as well. Existing local commits may remain when they continue the PR head and belong to the requested work. Read-only review does not require a branch change. Before fixup mutations, also follow the PR workflow's draft-state gate.

## Goal

Create a ticket worktree without guessing its layout or forgetting the repository's local environment setup.

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

### Reusable Preview Data

For local feature previews and QA, prefer the primary checkout's development database as the reusable scenario-data source, then copy it into the feature worktree's separate database. This is a setup default where compatible and authorized, not permission to reset data or share a writable database between checkouts.

1. **Establish compatibility and identity.** Read the project's wrapper and documented development export/import procedure. Verify the primary and feature checkout paths, database identities, schema versions, and separate storage without printing credentials. Follow project-local exceptions and data-handling restrictions; never use production data for this procedure.
2. **Prepare reusable records at the source.** Inspect suitable existing primary records first. When setup is authorized and the primary schema supports the scenario, create only the missing synthetic data there. Preserve unrelated records and primary source changes; do not reset the primary database or change its code to make a scenario fit.
3. **Copy safely.** Use the documented wrapper and consistent snapshot procedure. Stop destination writers before replacement, preserve valuable destination-only data, and retain private export/backup paths until restoration and data verification succeed. If replacement would discard unique work whose disposition is unresolved, stop before overwriting it.
4. **Adapt only the destination.** Apply feature-branch migrations and feature-only fixture changes to the destination copy. Never migrate the primary database to unmerged schema or point both checkouts at the same writable database/volume.
5. **Verify the handoff.** Confirm the destination identity again, inspect the copied scenario records and relationships, and check application readiness through the project's supported commands. Keep dataset preparation, runtime readiness, authentication, and actual UI verification as separate results.

If the primary dataset is unavailable or incompatible, or no supported safe copy procedure exists, explain that condition and use the project's supported isolated setup. Do not invent database-engine commands, weaken data protections, or force a copy. For example, reusable bookings can be prepared in primary and copied; a field introduced only by the feature is populated after migrating the feature database, not by modifying primary.

## OMP Boundary

OMP's `worktree` / `wt` command only lists or clears OMP-managed worktrees under `~/.omp/wt`. It does not create issue worktrees in this layout.

## Verification

After creation, verify the new worktree is on the requested branch and use the target repository's documented setup wrapper before starting its runtime:

```bash
git -C "$worktree_path" branch --show-current
```
