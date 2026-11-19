# Cohesive Module Review

## Task

Assess ownership in a touched implementation, including an extension that adds no exports. Apply [Module Decomposition](../docs/references/module-boundary-reference.md#module-decomposition) and the canonical [Implementation File Boundaries](../docs/references/code-organization-reference.md#implementation-file-boundaries), with the consumer's actual conventions. The goal is a readable primary responsibility and safe state ownership, not smaller files at any cost.

## Pinned Consumer Evidence

The example is grounded in `klondikemarlen/omp-verifier` at commit `a7ea28814094d0a5178be6946c292e961614f56f`. It is a source assessment and illustrative decomposition, not a claim that a refactor shipped, a verifier ran, or a runtime bug occurred.

The complete [semantic-evaluations.js](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L1-L1116) contains several concrete ownership clusters:

- **Private request storage and concurrency:** cache paths and identities, directory permissions, atomic writes, a per-check lock, retention, and request integrity. [The lock](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L115-L164) also reads and rewrites lifecycle diagnostics after executing its callback. Extracting only file operations could accidentally release the lock before the diagnostic update or split a state transition across owners; those are preservation obligations, not evidence of an existing race.
- **Request lifecycle and evidence policy:** capture, freshness checks, automatic delivery-scope reconciliation, reuse, and renewal. [Capture and persistence](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L307-L442) bind provider/source hashes, context fingerprints, request identity, and state. This invariant must survive any move; a generic cache helper must not become the owner of evidence-selection policy.
- **Presentation progress and observation:** [page receipts and diagnostics](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L819-L935) track delivered views and project privacy-safe progress/timing. The diagnostics operation builds a review page but explicitly does not reconcile scope or approve freshness. A presentation change and a freshness-policy change have different reasons to change; merging their owners risks turning observation into a mutating approval operation.
- **Assessment validation and completion:** [normalization and result construction](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L954-L1008) validate status, text, citations, and finding attribution, while [completion](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/semantic-evaluations.js#L1010-L1116) gates on page coverage, handles continuation checkpoints, and consumes state. Pure assessment policy can change independently of filesystem locking; separating it must not let rejected assessments consume requests or stale receipts acknowledge a renewed view.

The failure mechanism to flag when extending this mixed owner is responsibility accumulation: storage mechanics, evidence lifecycle, observation/progress projection, and assessment policy are all implementation responsibilities of one file despite private helpers. Their distinct change axes and shared state paths require an explicit ownership decision. Its length and its five exports are not the finding, and multiple lifecycle operations are not inherently wrong.

### Observed Public Relationships

All five exports have runtime consumers, so none should be dismissed as a test-only helper:

| Export | Inspected runtime consumer |
| --- | --- |
| `prepareSemanticEvaluation` | [verifications.js](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/omp-plugin/verifications.js#L63-L86) prepares agentic checks with selected scope/reuse policy. |
| `readSemanticEvaluation`, `completeSemanticEvaluation`, `readSemanticDiagnostics` | [semantic-commands.js](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/bin/semantic-commands.js#L48-L121) implements review, evaluate, and diagnostics commands. |
| `recordSemanticReviewPage` | [cli-output.js](https://github.com/klondikemarlen/omp-verifier/blob/a7ea28814094d0a5178be6946c292e961614f56f/bin/cli-output.js#L54-L67) records a pending text page only after the output write completes. |

The evaluator already delegates contract loading, automatic check discovery, delivery scope, finding attribution, context capture/citations, continuation capture, continuation review, and page building to named sibling modules. Their import/export declarations were inspected for the relevant dependency direction; those siblings do not import the evaluator back. That existing decomposition is useful evidence, not proof that the remaining implementation has one owner.

Coverage: all evaluator source, the three runtime caller files above, package import/entrypoint configuration, consumer `AGENTS.md`, direct sibling import/export topology, and repository-wide JavaScript/module import references to the evaluator at the pin. Test import references establish consumers but their full scenarios were not audited here. No unrelated Verifier module behavior, runtime concurrency, or proposed refactor correctness is claimed.

## Contrasting Layouts

These are illustrative end states, not prescribed Verifier filenames or permission to change its API. Preserve the project's flat-module layout when it expresses the same ownership just as clearly.

```text
FAIL: mixed owners, even if every function is short
semantic-evaluations.js  # storage + locks + lifecycle + assessment + presentation

FAIL: smaller files, same entanglement
semantic-evaluations/
  index.js              # export * from every file
  helpers-one.js        # half the original functions; imports helpers-two
  helpers-two.js        # other half; imports helpers-one
  manager.js            # catch-all facade; callers can also mutate raw state

PASS: useful feature API with private semantic owners
semantic-evaluations/
  index.js              # explicit supported lifecycle/progress operations only
  prepare-evaluation.js # prepare operation and its local helpers
  read-evaluation.js    # read/renew operation and its local helpers
  complete-evaluation.js
  record-review-page.js
  read-diagnostics.js
  request-store.js      # internal atomic state/lock/integrity owner
  reconcile-request.js  # internal freshness/renewal owner
  assessment.js         # internal pure assessment policy
```

In the cohesive feature, operations depend on internal owners, never the reverse. A request-store API encloses the full locked read-modify-write and cleanup, rather than exposing a lock handle to every caller. Shared request state retains its existing lifetime; operations do not create their own independent caches. Observation reads without renewing evidence. Page recording preserves the output-before-receipt relationship. Pure assessment validation cannot write state. A public entrypoint lists actual useful operations, not every internal symbol. Tests exercise those operations and observable failures/transitions without making private primitives public.

A legitimate same-invariant multi-function module can remain flat:

```text
reservation-lease.js  # acquireLease, renewLease, releaseLease
```

Those functions can share one lease identity, expiry rule, and lock/cleanup protocol. Keeping that lifecycle together is `PASS` when callers and state transitions support the ownership; scattering it solely to achieve one export per file is not an improvement. An unrelated report formatter added to that module needs its own ownership decision even if no function or file exceeds a size limit.

## Check the Difference

These are proposed semantic QA cases, not recorded verification results. Use the existing `marlens-rules:module-boundary-alignment` contract with complete changed source and material callers/siblings/project guidance.

| Case | Expected decision and observable evidence |
| --- | --- |
| Extend assessment behavior in the mixed evaluator, keeping exports unchanged and all size checks green | `FAIL` when source shows the touched file still owns independent storage/lifecycle/presentation/assessment decisions. Cite the touched responsibility and coupling, not line count. |
| Split by numbered chunks, export all internals, and introduce mutual imports | `FAIL`: cite arbitrary ownership, leaked mutation access, and the dependency cycle; smaller files do not satisfy cohesion. |
| Cohesive feature API with operation owners and internal store/validation ownership | `PASS` when inspected callers use only useful operations, dependencies are one-way, state lifetime is unchanged, and locked transitions/cleanup and real error paths remain owned. Layout alone is not proof. |
| Flat acquire/renew/release lease module sharing one invariant | `PASS` with caller/state evidence; no forced folder, barrel, or exactly-one-export quota. |
| Existing project-specific entrypoint/layout keeps a cohesive small operation and local helpers together | Preserve that convention and report `PASS` when the actual ownership is clear; do not manufacture extraction. |
| Only the first evaluator page, export list, or a diff hunk is available | `BLOCKED`: identify missing implementation/state/caller evidence and recover it without dropping changed scope; neither file length nor unchanged exports permits a verdict. |

For a real extraction, focused behavioral proof must additionally observe tampered/stale request rejection, pending-to-complete and checkpoint transitions, invalid-assessment non-consumption, missing-page behavior, receipt timing, diagnostic non-mutation, and lock release after failure where affected. Keep scenario-specific setup and assertions; native `node:assert` is not subject to an exactly-one-`expect` rule. Do not re-pin incidental output to hide a changed lifecycle contract.
