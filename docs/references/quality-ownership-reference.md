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

Specific verification rules, code/test standards, and their rule definitions belong in MSSRT (or the target project for genuinely project-only policy). Generic enforcement architecture and runtime mechanisms belong in omp-verifier. Asking to verify a particular standard is not, by itself, a Verifier architecture request: for example, default subject-import placement belongs in MSSRT's existing test standard and semantic contract, while a proven discovery/execution defect belongs in Verifier. Apply this boundary when authoring, reviewing, contributing, or routing a learning proposal; do not send a missing rule to the runtime owner merely because verification was requested.

Standalone application and test libraries belong in focused packages with their own implementation and release boundaries. Shared examples and authoring guidance may reference those packages, but must not require installing a doctrine or plugin bundle wholesale to obtain one helper.

## Integration Handoffs

- MSSRT declares deterministic checks and supplied semantic contracts in `package.json` under `omp.verifications`. Executable entries implement bounded policy; agentic entries declare the accepted standard and rubric without a dummy executable.
- Verifier discovers trusted installed manifests and selects matching `pathTriggers`. Deterministic entries receive project-relative scope through `OMP_VERIFIER_CHANGED_PATHS`; supported semantic contracts are evaluated by the existing verifier advisor against fresh captured evidence. Verifier owns malformed-result handling, runtime-level suppression, and stale-assessment rejection.
- Check-specific configuration remains with its policy owner. MSSRT's `.marlens-verifications.json` is not interchangeable with Verifier's runtime `.omp-verifier.json`.
- Verifier's `FAIL` or `BLOCKED` results can become standard advisor blocker advice when the advisor is enabled and model-resolved. A notification or a local script run does not prove that correction reached the primary agent.
- Learner identifies human corrections, checks whether their practical behavior and scope are represented in current guidance, and routes genuinely missing learning. It may also retain eligible durable feedback through OMP's native `learn`; a reviewable ticket is a separate proposal, not an accepted instruction or executable check. Its shared knowledge-base destination is configurable and defaults to MSSRT; other repositories may be selected. See [Learner's purpose and routing contract](https://github.com/klondikemarlen/omp-learner/blob/main/README.md#learning-classification-and-integration) for its maintained setup details.
- Learner routes reusable check proposals to the configured shared knowledge base, project-only checks to the active origin, evidenced verifier runtime/discovery gaps to Verifier, and Learner capability gaps to itself. The relevant destination owner decides whether to accept, maintain, and release the proposal.

### Correction Coverage and Verification Evidence

The configured shared knowledge-base owner, or the project owner for project-local guidance, maintains accepted rules and any declared check or rubric. Correction coverage, a supplied verification contract, and an observed current result are separate facts; none implies the next:

1. **Tracked rule:** Learner checks whether the correction's practical behavior and scope are already represented in current guidance. A cited covered result completes its ordinary coverage responsibility: it means no duplicate guidance proposal is needed, not that code complies or a check exists.
2. **Supported contract:** The policy owner maintains the accepted rule and any declared deterministic check or versioned agentic contract. Deterministic entries state a bounded input and fail condition; agentic contracts declare the standard/source, Gold condition, required context, and rubric. Verifier discovers supported declarations and selects them by current changed paths or explicit project requirements. Prose, an issue, or Learner's coverage report does not create, install, or activate a check.
3. **Current evidence:** Verifier evaluates an applicable check against current changed code and reports its actual `PASS`, `FAIL`, or `BLOCKED` evidence. A `PASS` establishes only that the declared check passed for the assessed scope, not overall code quality. An unavailable required provider, unsupported contract, or missing required context is `BLOCKED`, not a guessed result. A supplied but inapplicable or unrun contract is not a current result; a past result cannot establish the state after a change.

Project-local guidance takes precedence over shared policy. Verifier uses its declared checks and project requirements independently; it does not require a new Learner ticket or live Learner handoff for each run. An explicitly authorized verification-integration proposal remains a separate Learner routing/classification action; coverage neither creates nor precludes it, and Learner does not execute or activate its proposed check.

#### Example: Covered Guidance, Violating Code

Suppose a presenter extracts `accountName(account)` solely to return `account.name`, with no invariant or independently changing responsibility. A human correction maps to the existing [module-decomposition rule](module-boundary-reference.md#module-decomposition). Learner correctly reports covered guidance even if the unnecessary helper remains; it should not file a duplicate rule or issue a code-adherence verdict. When the supplied module-boundary contract applies, Verifier separately evaluates the changed code with the required caller, sibling, and project context; a boundary with no meaningful ownership can yield an evidence-backed `FAIL`. The primary agent can inline the direct field selection and remove the helper, then request a fresh scoped evaluation. A short boundary that owns a meaningful invariant or independently changing responsibility remains valid; size alone is not the standard. This illustrates the handoff, not an observed verification result.

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

Readability, test focus, and architectural cohesion need context even when a precise structural contract applies. [Test alignment](test-alignment-verifier-reference.md) enforces the shared exactly-one-expect default for non-controller tests, with the explicit controller exception and native `node:assert` framework preserved. Counting cannot prove meaningful assertions, distinguish a real result from a synthetic bundle, detect hidden assertions, or establish preserved transition/race/rollback coverage. Those responsibilities remain with authoring/review and the declared assertion-focus semantic contract; structural `PASS` alone is not semantic approval.

Do not add another English rule when the existing owner already covers the decision. Do not add a runtime gate merely because a prose rule exists. Use [`self-improvement-workflow.md`](../workflows/self-improvement-workflow.md) for evidence-backed classification and the existing release workflow for implementation.

## Measure Rule-Induced Rework

Use existing review receipts and Git patches to answer a narrow question: **Which findings from this rule led someone to edit the PR again, and what did those edits change?** Start with this read-only method before adding instrumentation.

1. **Pick the cohort before reading findings.** Name the repository, target branch, UTC merge window, and eligible changed paths. Keep every eligible PR, including those without a finding or a retained receipt. Record the policy actually loaded in each review (release or immutable source), the check ID, and Verifier/model versions when known. Check the project guidance captured for that revision. Separate the shared rule, explicit binding project policy, and unknown origin; an authoring default alone is not a local requirement.
2. **Pair the finding with the edit.** Use the GitHub thread, retained named Verifier result, or local session record to identify the check/rule, cited finding, and assessed base and head. Match it to the before/after patch and evidence that the edit answered the finding. A commit subject, whitespace diff, or later `PASS` cannot establish the cause on its own. Keep findings that did not lead to an edit and cases with unresolved attribution separate; missing evidence is not zero rework.
3. **Count rounds, not operations.** A round is one batch of actual edits responding to review before resubmission or reassessment. Several locations, commits, or reviewers in that batch still make one round. Count another only after new feedback causes another batch. Retries, resumed pages, rebases without a new correction, and initial implementation are not rounds. If two rules caused edits in one round, credit both rule rows, but count the round only once in the overall total.
4. **Classify the attributed changes.** Use **layout-only** when only presentation changes and the same behavior and matcher remain; **semantic** when asserted behavior, coverage, or matcher strength changes; **mixed** when the attributed response contains both; **unknown** when the patch cannot settle the distinction. Do not classify a whole round from unrelated edits in the same commit. Keep an unverifiable finding-to-edit link out of confirmed categories even if the patch visibly changes the layout.
5. **Report coverage with the result.** For each policy and rule, report eligible PRs, unique PRs with a completed relevant review, distinct completed review scopes, unique PRs with confirmed edits, round counts by kind, and unresolved cases. Count one review scope per PR, check, assessed base/head, and policy revision; retain the request IDs for provenance but deduplicate reruns of equivalent scope. Keep blocked, pending, and unavailable evidence separate from completed scopes. Compare rounds per reviewed PR only for similarly selected cohorts and disclose review coverage (`reviewed/eligible`); run counts expose differences in review frequency, not independent samples. This is not a quality score or a measure of time saved.

For the assertion-layout pilot, this query lists candidate PRs and their eligible test paths. Keep merges at or after `start` and strictly before `end`. Check that the search was not capped; split the window if needed, and use the paginated PR files endpoint if a file list is incomplete.

```bash
repo=klondikemarlen/marlens-skills-rules-and-tools
start=2026-11-26T21:00:00Z
end=2026-11-27T00:00:00Z
gh pr list -R "$repo" --state merged --search "base:main merged:$start..$end" \
  --limit 100 --json number,mergedAt,headRefOid,files \
  --jq 'sort_by(.mergedAt)[] | [.number,.mergedAt,.headRefOid,([.files[].path | select(test("^tests/.*\\.[cm]?[jt]sx?$"))] | join(","))] | @tsv'

pr=1689
for resource in commits reviews comments; do
  gh api --paginate "repos/$repo/pulls/$pr/$resource?per_page=100"
done
git show 4544c02594220437067e9806aab9d560c0829cbb -- tests/github-pr-screenshots/publishing.test.mjs
```

Use the base/head printed in the historical receipt, not today's branch tip. Examine relevant patches and use retained named results or archived diagnostic output when no GitHub review was posted. For a retained Verifier request, the installed CLI's `diagnostics <request> --reporter json` can locate its current state; a superseded receipt still describes its own historical scope. Do not rerun review to reconstruct an old verdict. Keep working notes on the maintainer's machine or in the existing private evidence record; share counts and necessary public PR/commit links, not prompts, private paths, or raw receipts.

### Assertion Layout Pilot Baseline

The fixed window above contained **7 MSSRT merges, 2 eligible test PRs, and 2 PRs with retained completed `marlens-rules:test-assertion-focus` reviews**. The reviews below used the shared MSSRT **5.21.0** standard; no binding local layout rule was identified in the captured guidance.

- [#1685](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/pull/1685): `PASS` at `d3f28ad2..7a977766` (receipt `8c5787e3`). **0 observed rounds.** The PR's only test-changing commit introduced the feature tests; later commits did not revise those tests.
- [#1689](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/pull/1689): earlier archived `PASS` at `2d16ec8c..7f8be5fc`, then `FAIL` at `dc5ec616..4a64b2bf` (`ff12898d`) and `PASS` at `dc5ec616..4544c025` (`8e2c850a`). **1 layout-only round.** The failure named two compact ENOENT matchers. The [corrective commit](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/commit/4544c02594220437067e9806aab9d560c0829cbb) expanded both without changing the expected error code or matcher.

That is **1 affected PR / 2 reviewed PRs**, **4 distinct completed scopes observed**, and **1 confirmed layout-only round; 0 semantic or mixed rounds attributed to this check in the retained evidence**. For example, the [earlier concurrent-append test](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/commit/6bf493215cd3ffcb688117224e4c98e9e7e8ff4a) added real coverage, but did not answer this layout finding or a failure of this check. The sources cannot account for unrecorded edits, incomplete reviews, or missing earlier receipts. The short window contains the motivating incident and is not a representative estimate.

For the first comparison, sample seven full UTC days ending at the start of the UTC release day, and seven full UTC days starting at the first UTC midnight after a named review confirms it has loaded the pilot contract. Use the same repository, paths, and reporting rules. Verify the contract source and revision in each receipt; a package install cannot tell what an existing review process evaluated. Report mixed-version PRs, unverified versions, and coverage gaps separately rather than attributing them to either policy. Compare shared-rule layout-only, semantic, and mixed rounds separately; keep explicit-local and unknown cases visible. No post-release editing rounds have been measured in this baseline.

Use the weakened any-error matcher as a quality control: the revision under evaluation must still flag the lost ENOENT requirement. Keep that result, the compact/expanded verdicts, and the explicit-local-policy verdict in the targeted replay report. Replay verdicts help check that the changed decision is about layout without giving up assertion strength; they do not count as observed editing rounds or prove that work was avoided.

## Authority and Proof

Documentation records intended meaning; source establishes current behavior; runnable scenarios establish observed evidence. Keep conflicts as cited findings instead of silently choosing one source.

- MSSRT's `npm test` verifies package contracts and isolated policy fixtures. A policy fixture's `PASS` proves only that policy, not that the tests are useful or the application works.
- Verifier's checks establish discovery/execution and advisor integration. A required correction-flow claim needs a fresh enabled, model-resolved advisor and an observed blocker followed by remediation.
- Learner's route checks can exercise target selection, normalization, redaction, and deduplication without creating test GitHub issues. Native memory retention is owned by OMP and is not proved by a ticket fixture.
- Released-plugin proof comes from the remote artifact's installed version and a fresh OMP process. Existing sessions retain already-loaded extension modules.

Sibling implementation detail stays in the sibling's own knowledge base. These links describe responsibilities, not a promise that all three plugins share a version or release together.
