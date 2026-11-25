# GitHub PR Stack

Use when creating or verifying a GitHub pull-request stack for dependent slices, or propagating an accepted fix through an existing stack.

A direct request to stack GitHub PRs (for example, “stack these PRs”) explicitly requests native GitHub registration. The requester does not need to say “register.” A planning question or read-only review does not authorize registration. Requests for dependent branches or PR bases without a stack request remain base-only, and an explicit instruction not to register takes precedence.

## Creating a Stack

Create dependent slices as a bottom-to-top chain. For the bottom slice, create its branch from the intended trunk; for each child slice, create its branch from the immediate predecessor's head branch so its diff contains only its own work. Push each branch and open each PR as a draft targeting its predecessor's head branch (the bottom targets trunk). Do not mark the whole ticket ready while any slice remains unmerged; each PR must carry its own callers, tests, and verification.

Follow [Customer Contract in Stacked PRs](../pr/workflow.md#customer-contract-in-stacked-prs) when drafting each PR body and when refreshing affected open bodies after the agreed contract changes. This applies whether or not the chain is registered natively.

Before native registration, preflight the chain with the installed `github-pr-stack` helper, which confirms every PR is in the same repository, reports each base/head branch, exact SHAs, draft state, and current stack membership, and prints the `gh stack link` command without running it:

```bash
github-pr-stack \
  https://github.com/OWNER/REPO/pull/BOTTOM_PR \
  https://github.com/OWNER/REPO/pull/NEXT_PR \
  https://github.com/OWNER/REPO/pull/TOP_PR
```

## Registering Natively

After a successful preflight, run the emitted `gh stack link` command only for a request that authorizes native registration. Use the existing PR URLs, not branch arguments or `--open`. Registration does not authorize rewriting commits, merging, or changing readiness.

Chained bases and body links alone do not prove native stack membership. Re-read every PR through `gh api repos/OWNER/REPO/pulls/NUMBER` and verify its base chain, base/head SHAs, and draft state are unchanged and all PRs report the same non-null `stack.id` and `stack.number`, the expected `stack.size`, and consecutive `stack.position` values from bottom to top. If any required state cannot be verified, report the exact missing prerequisite instead of claiming registration.

Fix a base-chain error by retargeting the PR base, not by rewriting history, unless the user explicitly authorizes history changes.

## Propagating a Fix Through an Existing Stack

Start with the originating PR, the exact accepted change (its behavior and any known commit or diff), and the requested scope. This applies to native stacks and ordinary chained bases. It is not a request to create or register a stack.

1. **Map the live dependencies.** List open PRs in the authorized repository, paginating as needed. Use the existing [REST PR readback](../pr/workflow.md#pr-size-and-stack-planning) to record state, draft state, base and head repository/ref and SHA, and any native membership.
   - Follow each parent head repository/ref to the matching child base repository/ref. Work only on the requested open descendants. Native membership can corroborate the chain; issue numbers, body links, branch names alone, and historical stack lists cannot establish it.
   - If the origin was merged, verify the revision where the fix landed and the live dependency on that revision before proceeding. Sharing a trunk base does not establish descent.
2. **Start at the origin and work parent to child.** Verify where the accepted fix is published. If it is still local, use the originating PR's existing fixup workflow to deliver it only when authorized. Before each update, re-read and fetch the actual parent and child heads. Inspect the child's own changes against its parent, including affected callers and tests.
   - Before mutating a child, use the project-local PR workflow or the packaged [PR fixup process](../pr/workflow.md#process), including the [Stack Target Advisory](../pr/workflow.md#stack-target-advisory), continuation on the actual child branch in its verified worktree, and any applicable draft/readiness gates.
   - **Inherits the fix:** If the published child head does not contain the updated parent, integrate the parent using the project's authorized procedure. Do not duplicate the parent fix or manufacture a child code change. A current GitHub base SHA alone does not mean the branch head contains it.
   - **Needs adaptation:** Integrate the verified parent and update the child-owned callers, tests, or behavior affected by the accepted change. Keep shared changes in the owning lower slice. Compare the old and new child-only changes against their respective parents to account for the adaptation and preserve the child's other work.
3. **Stop unsafe updates.** If a child needs a replay, use the project-local equivalent or [Stacked Pull Request Conflicts](../rebase/workflow.md#stacked-pull-request-conflicts) for the historical parent boundary, backup ref, child-only replay and comparison, preservation of merge conflict-resolution intent, and exact expected-remote-SHA lease on an authorized published rewrite.
   - Stop on unclear ancestry or unexpected remote work. Abort an in-progress replay if conflicts are out of scope or the child's work cannot be preserved safely. Block any further updates that require the blocked slice; independently authorized paths can continue.
   - Propagation grants no new authority to rewrite an exact branch, retarget bases, register a stack, change readiness, or merge. If a required update or gate is unauthorized, stop rather than bypassing it with a different history strategy.
4. **Prove the published result.** After each authorized push, re-read the PR and resolve its exact remote head before using it as the next child's parent. Do the same readback for an unchanged child.
   - Check ancestry on the fetched commits (for example, `git merge-base --is-ancestor <verified-parent-sha> <published-child-sha>`). Inspect the resulting tree for the accepted fix and the child-only diff for preserved work and intended edits. Ancestry alone cannot show that the child did not undo the fix.
   - Use affected-contract evidence tied to the published SHA, such as a focused check on that revision or a check run locally on the same SHA. Reuse inherited evidence only where it still applies to that head. A changed caller or test needs its own focused proof. Apply required current-head checks under the PR workflow. A local commit, successful push command, base update, or stale check alone is not proof.
5. **Confirm the whole requested path.** Re-read GitHub at the end: confirm each child is still open on its intended immediate parent, with the expected base and head SHAs, and that the recorded evidence still matches. If the accepted customer contract changed, use [Customer Contract in Stacked PRs](../pr/workflow.md#customer-contract-in-stacked-prs) to refresh affected bodies and read them back.
   - Report per PR whether it inherited the fix or adapted its slice, its observed head and relevant checks, and the exact blocker for any slice not updated or verified. Do not call the stack synchronized if any requested dependency, update, or proof is missing.

**Example:** The origin renames a nested-write method. The first child adds behavior that does not call that method: verify its published head contains the updated parent, preserves its own diff, and has applicable behavior evidence; no child code edit is needed. The next child calls the old method and tests it: update the caller and its test, then verify both on that child's published head. If the first child needs an unauthorized rewrite or a conflict would discard its work, stop that update and leave the dependent child's synchronization unverified even if a proposed caller edit passes locally.
