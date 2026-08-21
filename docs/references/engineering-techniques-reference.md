# Engineering Techniques Reference

Use this reference for durable implementation background that is too specific for a global rule and too cross-cutting for one workflow. Keep executable procedures in workflows; the cited product examples are evidence, not shared schemas or requirements.

## Evidence Status and Limits

- **Established technique:** an observed implementation or review outcome that is reusable across projects.
- **Upstream limitation:** a source-verified absence of a safe public capability. It documents the current boundary; it does not require a workaround.
- **Speculative extension:** a new API, helper, or policy not supported by the cited evidence. Do not present it as established guidance until its contract and verification exist.

## Safe Worktree Cleanup in Dockerized Projects

Before cleanup, verify the target branch, pull request, worktree owner, and local changes. Preserve the primary checkout and user-owned untracked files.

Use the target project's documented wrapper to stop only services belonging to the target worktree. Remove only explicitly allowlisted Docker-owned generated artifacts from inside those project containers; do not use host-side ownership guesses to delete source or user files.

`git worktree remove` can remove registry metadata while leaving the directory behind. Re-check the worktree registry before treating a remaining directory as orphaned, then verify the target directory, worktree list, branch state, and primary checkout after cleanup.

## GitHub Asynchronous Merge for PR Stacks

First detect a stacked pull request or the standard merge endpoint's stacked-merge `403`; ordinary pull requests use the normal merge path.

For the asynchronous path, submit `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge-async` with the current expected head SHA and requested merge method. A `pending` or `enqueued` result carries `details.uuid`; poll `GET /repos/{owner}/{repo}/pulls/{pull_number}/merge-async/{uuid}` to a terminal result, and stop on an unexpected head change or failed operation.

After a successful operation, re-read the pull request and verify its merged state, merge commit, base branch, and fetched remote refs before deleting an agent-owned branch.

## Keyed Frontend Request Coalescing

Time-window request aggregation shares one equivalent operation; it is not response caching. Define equivalence with a canonical argument key, not a hash that can collide or hide argument normalization.

Return independently owned fulfilled values to consumers when the value is mutable. Mutations that invalidate the repeated-GET assumption need targeted invalidation for the affected canonical key.

Caller-owned `AbortSignal` handling is a separate cancellation policy. Decide whether an individual caller stops only its own delivery or the shared operation; do not accidentally encode that choice in the aggregation key.

## Real Async Runtime Barriers in Integration Tests

Synchronize against an observable runtime condition, not a guessed delay. Keep bounded polling and diagnostics in stable test support, then wait for the condition that proves the system reached the intended lifecycle point.

Use a unique marker per test so parallel execution cannot satisfy another test's barrier. The marker belongs in the observed request, query, job, or other runtime record—not only in test-process memory.

## TypeScript Declaration Ownership and Loading

Keep library augmentations with their owning module. Expose real global augmentations through package-shaped `typeRoots` entries rather than an arbitrary declaration file that a runtime loader may miss.

Use explicit imported intersection types for local lifecycle contracts instead of widening ambient globals. Verify the owning TypeScript project and its lazy runtime entrypoints in addition to a full-project `tsc` check; editor and test compilation alone can miss runtime loader discovery.

## Evidence-Backed Upstream Limitations

Inspect the installed dependency source and version before proposing a private monkey patch. Record the missing public API, the unsafe alternatives considered, and the behavior intentionally preserved.

Prefer an existing upstream issue over filing a duplicate. A private field, a promise race that leaks later work, or a workaround that weakens a transaction or lifecycle invariant is not a safe substitute for an absent public API.

## Sources

- [GitHub REST API: Merge a Pull Request Asynchronously](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2026-03-10#merge-a-pull-request-asynchronously) — request, polling, and terminal-status contract.
- [Issue #390](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/issues/390) — curated cross-project evidence and acceptance boundary.
- [WRAP PR #583: Workflow Search Cancellation](https://github.com/icefoganalytics/wrap/pull/583) — request-coalescing review, runtime-barrier test, and declaration-loading evidence.
- [Sequelize issue #14247](https://github.com/sequelize/sequelize/issues/14247) — current query-cancellation limitation context.
