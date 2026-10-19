# Quality Ownership Across MSSRT, Verifier, and Learner

Use this reference to place a quality improvement without duplicating policy, execution, or learning. Each repository owns its implementation and release; installing MSSRT does not enable either companion.

## Purpose and Boundaries

| Owner                                                          | Owns                                                                                                                           | Does Not Own                                                                                             | Authoritative Surface                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MSSRT                                                          | Reusable doctrine, workflows, templates, rules, package-owned quality checks, and thin tool adapters                           | Advisor scheduling, verification discovery/execution, automatic learning, or application-specific policy | [`guidance-precedence-reference.md`](guidance-precedence-reference.md), [`rules-and-verifications-reference.md`](rules-and-verifications-reference.md), [`package.json`](../../package.json), and [`verifications/`](../../verifications/) |
| [OMP Verifier](https://github.com/klondikemarlen/omp-verifier) | Declared check discovery, changed-path selection, execution, suppression, structured evidence, and verifier-advisor correction | Generic test/style policy, arbitrary remote checks, model configuration, or learning                     | Its [scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md) and [concepts reference](https://github.com/klondikemarlen/omp-verifier/blob/main/docs/references/verifier-concepts-reference.md)    |
| [OMP Learner](https://github.com/klondikemarlen/omp-learner)   | High-confidence feedback eligibility, calls to native `learn`, and deduplicated reviewable proposal routing                    | Memory storage, implementing proposals, executing verifications, or automatic PRs/releases               | Its [purpose and routing contract](https://github.com/klondikemarlen/omp-learner/blob/main/README.md) and `omp-plugin/learner/` implementation                                                                                             |
| OMP Core                                                       | Memory backend, managed skills, advisor lifecycle, model roles, and native tools                                               | Companion-specific policy and proposal decisions                                                         | The running OMP version and its native tool contracts                                                                                                                                                                                      |
| Target Project                                                 | Domain invariants, local conventions, runtime setup, and project-only checks                                                   | Shared policy for unrelated projects                                                                     | Its local docs, code, and observed QA                                                                                                                                                                                                      |

The boundary separates **what should be checked**, **how a check runs**, and **what durable lesson merits retention or a proposal**. A package-owned `.mjs` verification is policy implementation, not a second verifier runtime. The target project's local guidance wins over shared advice.

Standalone application and test libraries belong in focused packages with their own implementation and release boundaries. Shared examples and authoring guidance may reference those packages, but must not require installing a doctrine or plugin bundle wholesale to obtain one helper.

## Integration Handoffs

- MSSRT declares deterministic checks and supplied semantic contracts in `package.json` under `omp.verifications`. Executable entries implement bounded policy; agentic entries declare the accepted standard and rubric without a dummy executable.
- Verifier discovers trusted installed manifests and selects matching `pathTriggers`. Deterministic entries receive project-relative scope through `OMP_VERIFIER_CHANGED_PATHS`; supported semantic contracts are evaluated by the existing verifier advisor against fresh captured evidence. Verifier owns malformed-result handling, runtime-level suppression, and stale-assessment rejection.
- Check-specific configuration remains with its policy owner. MSSRT's `.marlens-verifications.json` is not interchangeable with Verifier's runtime `.omp-verifier.json`.
- Verifier's `FAIL` or `BLOCKED` results can become standard advisor blocker advice when the advisor is enabled and model-resolved. A notification or a local script run does not prove that correction reached the primary agent.
- Learner retains eligible durable feedback through OMP's native `learn`. A reviewable ticket is a separate output, not an executable check or automatically accepted instruction. Its generic knowledge-base target is configurable (default `klondikemarlen/omp-config`); explicitly choose MSSRT when shared guidance belongs here.
- Learner routes reusable check proposals to MSSRT, project-only checks to the active origin, verifier runtime/discovery gaps to Verifier, and Learner capability gaps to itself. Maintainers still decide and release the proposal at that owner.

## Choose the Smallest Improvement

| Finding                                                                                         | Owner and Action                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repeated cross-project judgment or authoring mistake                                            | Update MSSRT's existing workflow/reference; compare representative consumer decisions.                                                                |
| Deterministic reusable repository invariant                                                     | Implement the bounded check in MSSRT, or reuse a maintained compiler/linter that already proves it.                                                   |
| Domain-specific invariant or convention                                                         | Update the target project's docs/checks; do not generalize its domain nouns into shared guidance.                                                     |
| Missed trigger, malformed-result handling, timeout, suppression, or advisor correction          | Fix Verifier's execution contract with a failing-before/passing-after runtime check.                                                                  |
| Repeatable eligible feedback missed, misrouted, duplicated, or stripped of necessary provenance | Fix Learner with the actual signal and routing evidence; do not file a detection bug merely because a human created an issue.                         |
| Suspected performance problem or proposed language rewrite                                      | Measure the owning path first. Separate model/network latency, subprocess startup, parsing, and repeated I/O before changing implementation language. |

## Promote Standards Through Explicit Contracts

A verification needs a bounded input, declared quality standard, evidence location, useful remediation, and examples that distinguish a violation from a valid counter-example. Deterministic conditions belong in scripts or an existing native checker. Context-dependent accepted standards require a [declared semantic contract](rules-and-verifications-reference.md#agentic-semantic-verification), not a metric proxy or an inferred policy from prose. Preserve local configuration and test the actual consumer-visible boundary.

Readability, test focus, and architectural cohesion need context unless the project defines a precise contract. Syntax metrics can enforce an explicitly selected local policy, but do not prove quality. In particular, counting `expect` calls cannot distinguish direct assertions of a coupled invariant from unrelated assertions bundled into one synthetic object. [Test alignment](test-alignment-verifier-reference.md) therefore leaves assertion quality to authoring/review and enforces assertion count only when a project explicitly requests it.

Do not add another English rule when the existing owner already covers the decision. Do not add a runtime gate merely because a prose rule exists. Use [`self-improvement-workflow.md`](../workflows/self-improvement-workflow.md) for evidence-backed classification and the existing release workflow for implementation.

## Authority and Proof

Documentation records intended meaning; source establishes current behavior; runnable scenarios establish observed evidence. Keep conflicts as cited findings instead of silently choosing one source.

- MSSRT's `npm test` verifies package contracts and isolated policy fixtures. A policy fixture's `PASS` proves only that policy, not that the tests are useful or the application works.
- Verifier's checks establish discovery/execution and advisor integration. A required correction-flow claim needs a fresh enabled, model-resolved advisor and an observed blocker followed by remediation.
- Learner's route checks can exercise target selection, normalization, redaction, and deduplication without creating test GitHub issues. Native memory retention is owned by OMP and is not proved by a ticket fixture.
- Released-plugin proof comes from the remote artifact's installed version and a fresh OMP process. Existing sessions retain already-loaded extension modules.

Sibling implementation detail stays in the sibling's own knowledge base. These links describe responsibilities, not a promise that all three plugins share a version or release together.
