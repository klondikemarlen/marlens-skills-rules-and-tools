# Engineering Techniques Reference

Use this reference for durable implementation background that is too specific for a global rule and too cross-cutting for one workflow. Keep executable procedures in workflows; the cited product examples are evidence, not shared schemas or requirements.

## Evidence Status and Limits

- **Established technique:** an observed implementation or review outcome that is reusable across projects.
- **Upstream limitation:** a source-verified absence of a safe public capability. It documents the current boundary; it does not require a workaround.
- **Speculative extension:** a new API, helper, or policy not supported by the cited evidence. Do not present it as established guidance until its contract and verification exist.

## Safe Worktree Cleanup in Dockerized Projects

Before cleanup, verify the target branch, pull request, worktree owner, and local changes. Preserve the primary checkout and user-owned untracked files.

Use the target project's documented wrapper to stop only services belonging to the target worktree. Remove only explicitly allowlisted Docker-owned generated artifacts from inside those project containers; do not use host-side ownership guesses to delete source or user files.

Before deleting the worktree or its configuration, capture its exact Compose project identity and inventory its containers, volumes, networks, and worktree-specific image tags. Establish ownership from the project configuration and resource metadata, including `com.docker.compose.project` labels; a matching label alone does not prove that data is disposable.

Use the documented wrapper with that exact project selected for service/database cleanup. Remove volumes only when target ownership, disposable verification purpose, and cleanup authorization are all established. Preserve user development data, shared/external volumes, backups, and uncertain resources; record intentional retention and its reason. Do not make `down --volumes` a blanket default.

Remove only obsolete worktree-specific image tags when safe; preserve shared tags/layers. Do not use global image, volume, or system pruning. Verify the final inventory by the captured exact project labels/identities, and report retained Docker resources and their reasons separately from successful Git/filesystem cleanup.

`git worktree remove` can remove registry metadata while leaving the directory behind. Re-check the worktree registry before treating a remaining directory as orphaned, then verify the target directory, worktree list, branch state, and primary checkout after cleanup.

## GitHub Asynchronous Merge for PR Stacks

First detect a stacked pull request or the standard merge endpoint's stacked-merge `403`; ordinary pull requests use the normal merge path.

For the asynchronous path, submit `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge-async` with the current expected head SHA and requested merge method. A `pending` or `enqueued` result carries `details.uuid`; poll `GET /repos/{owner}/{repo}/pulls/{pull_number}/merge-async/{uuid}` to a terminal result with a bounded timeout, and stop on an unexpected head change or failed operation.

After a successful operation, re-read the pull request and verify its merged state, merge commit, base branch, and fetched remote refs before deleting an agent-owned branch.

## Keyed Frontend Request Coalescing

Time-window request aggregation shares one equivalent operation; it is not response caching. Define equivalence with a canonical argument key, not a hash that can collide or hide argument normalization.

Return independently owned fulfilled values to consumers when the value is mutable. Mutations that invalidate the repeated-GET assumption need targeted invalidation for the affected canonical key.

Caller-owned `AbortSignal` handling is a separate cancellation policy. Decide whether an individual caller stops only its own delivery or the shared operation; do not accidentally encode that choice in the aggregation key.

## Real Async Runtime Barriers in Integration Tests

Synchronize against an observable runtime condition, not a guessed delay. Keep bounded polling and diagnostics in stable test support, then wait for the condition that proves the system reached the intended lifecycle point.

Use a unique marker per test so parallel execution cannot satisfy another test's barrier. The marker belongs in the observed request, query, job, or other runtime record—not only in test-process memory.

## Intermediary Responses to JSON Requests

Classify responses at the HTTP transport boundary before consuming expected JSON, on both successful and rejected statuses. Inventory authenticated and public routes, startup, health/status, and release-note consumers; a `/api` prefix does not identify every JSON request. Preserve intentionally requested downloads and other non-JSON contracts.

Recognize a Cloudflare challenge only when `cf-mitigated` is exactly `challenge`; the documented challenge response is HTML regardless of requested resource type. A 403, `server: cloudflare`, or Ray ID alone is insufficient. Other unexpected HTML must fail visibly through the existing application-error path without retaining or displaying its body. Preserve ordinary JSON authentication, permission/validation, cancellation, transport, and unknown-error semantics; neither HTML nor JSON parse failure may masquerade as successful data.

Recover at the UI boundary through the existing application/framework error path. Preserve safely loaded forms or drafts where feasible, and offer an explicit reload or normal-browser verification route with an unsaved-changes warning. Startup failure must reach a terminal recovery state rather than an endless loader; protected views must not mount before account readiness. An interrupted response does not establish whether the origin applied a write: never automatically replay it. Check current server state before an explicit manual retry, and do not promise that reloading clears a challenge or block.

Trace awaited callbacks, catches, and rethrows before adding another error bus, interceptor subscription, or recovery channel. Background refreshes, detached editors, and socket/event listeners must forward synchronous exceptions and rejected listener promises through the existing boundary. Remove lifecycle-owned listeners on teardown so remounts do not duplicate requests or error delivery. Preserve intentionally synchronous callback contracts and intentional concurrency.

Use application-owned messages and safe minimal diagnostics, such as method, sanitized path, status, and Ray ID. Exclude credentials, cookies, query secrets, and response bodies from routine logs and support reports.

### Optional Diagnostic Previews

Metadata-only recovery is the simpler default; a diagnostic preview is not a baseline feature. If an evidenced product need warrants one, accept only bounded content from a marked challenge. Require acknowledgement followed by a separate reveal action, and keep a persistent trusted warning outside the preview.

Reuse a compatible existing sanitizer with the stricter preview-specific policy, not permissive defaults. Remove complete hidden, metadata, control, and media subtrees rather than exposing fallback text. Render sanitized content only in an inert opaque-origin sandbox with restrictive CSP and no referrer; permit no scripts, controls, navigation, or external resources. Sanitization does not make persuasive content trustworthy, and a static preview cannot complete verification or establish clearance.

The [Cloudflare marker contract](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/), merged [WRAP #699](https://github.com/icefoganalytics/wrap/pull/699) and [WRAP #718](https://github.com/icefoganalytics/wrap/pull/718), and [WRAP's recovery architecture](https://github.com/icefoganalytics/wrap/blob/fd3c59824e88158db86adad9e6591ff78502e801/docs/architecture/Docs%2C%20API%20Response%20Error%20Recovery%2C%202026-10-21.md) are design evidence, not a shared runtime or proof of another application's behavior. Preserve local architecture and protection policy; do not add automatic retries, weaken WAF/authentication, or copy an application's implementation wholesale.

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
