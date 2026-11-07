# GitHub PR Stack

Use when creating or verifying a GitHub pull-request stack for dependent slices.

## Creating a Stack

Create dependent slices as a bottom-to-top chain. For the bottom slice, create its branch from the intended trunk; for each child slice, create its branch from the immediate predecessor's head branch so its diff contains only its own work. Push each branch and open each PR as a draft targeting its predecessor's head branch (the bottom targets trunk). Do not mark the whole ticket ready while any slice remains unmerged; each PR must carry its own callers, tests, and verification.

Before native registration, preflight the chain with the installed `github-pr-stack` helper, which confirms every PR is in the same repository, reports each base/head branch, exact SHAs, draft state, and current stack membership, and prints the `gh stack link` command without running it:

```bash
github-pr-stack \
  https://github.com/OWNER/REPO/pull/BOTTOM_PR \
  https://github.com/OWNER/REPO/pull/NEXT_PR \
  https://github.com/OWNER/REPO/pull/TOP_PR
```

## Registering Natively

Chained bases and body links alone do not prove native stack membership. Run the emitted `gh stack link` command only when registration is explicitly requested, then re-read every PR through `gh api repos/OWNER/REPO/pulls/NUMBER` and verify its base/head SHAs and draft state are unchanged and all PRs report the same non-null `stack.id` and `stack.number`, the expected `stack.size`, and consecutive `stack.position` values from bottom to top. If any required state cannot be verified, report the exact missing prerequisite instead of claiming registration.

Fix a base-chain error by retargeting the PR base, not by rewriting history, unless the user explicitly authorizes history changes.
