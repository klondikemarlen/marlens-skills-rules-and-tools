# Port Gitea PR to GitHub Workflow

Use when a pull request was created in Gitea and needs to be recreated or updated on GitHub.

## Preconditions

- The branch exists on GitHub or can be pushed there.
- The Gitea PR title, body, base, and head branch are readable.
- GitHub is reachable.

## Process

1. Read the source Gitea PR title, body, comments if relevant, base branch, and head branch.
2. Verify the branch commits exist on GitHub.
3. Create or update the GitHub PR with equivalent title/body and correct base/head.
4. Preserve issue-closing keywords only when the GitHub PR should close the issue.
5. Return both source and destination PR URLs.

## Output Contract

State whether the GitHub PR was created or updated, list base/head branches, and note any content that could not be ported.
