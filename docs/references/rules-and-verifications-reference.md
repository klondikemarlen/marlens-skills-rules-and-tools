# Rules and Verifications

Rules and verifications are complementary enforcement layers, not interchangeable packaging.

## Choose the Smallest Layer

| Concern                                                                                     | Use                        | Reason                                                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| An agent must make a contextual decision or follow a procedure                              | Rule                       | It needs intent, repository context, or human judgment.                                              |
| A final repository state has a deterministic, bounded pass/fail condition                   | Verification               | A read-only script can produce repeatable evidence without model judgment.                           |
| Both are true                                                                               | Rule and verification      | The rule prevents the mistake early; the verification is a backstop at the boundary.                 |
| An accepted quality standard has explicit success criteria, a rubric, and required evidence | Agentic verification       | The existing verifier model evaluates the declared contract; unknown or missing evidence is BLOCKED. |
| The signal is subjective, incomplete, or too costly to specify precisely                    | Advisor or review guidance | A blocking script would create false positives and reward mechanical compliance.                     |

A verification must declare a concrete input scope, fail condition, evidence, and remediation. Do not add one merely because a rule exists. A rule must explain the decision an agent must make; do not replace that explanation with a script name.

## Agentic Semantic Verification

A **quality standard** names the concrete engineering outcome and evidence required to assess it. It can address correctness, security, and readability, with diligence in verification; priorities follow the applicable standard and project requirements rather than a universal ranking.

Choose initial delivery scope with [Simple-First Delivery](../workflows/hands-off-agentic-coding-workflow.md#simple-first-delivery).

Some review policies require contextual judgment and therefore cannot be implemented as deterministic scripts. The package may declare such a policy as an `agentic` entry in the existing `omp.verifications` manifest, pointing to a versioned JSON contract that names the standard/source, expected outcome, required context, and rubric. The provider owns that policy and keeps its existing guidance authoritative; the verifier runtime owns discovery, fresh evidence capture, and evaluation through its existing verifier advisor. Do not add a dummy executable, a metric proxy, another registry, or a new advisor.

The consumer requires OMP Verifier 0.10.0 or later. The runtime must surface unsupported contracts or missing required context as `BLOCKED`, with the actual check ID and missing evidence; unavailable context is not evidence of a pass or failure. Project-specific guidance takes precedence over shared policy. Correct a reported issue and request a fresh evaluation, or use a deliberate bounded suppression with its reason. Stale assessments cannot clear later changes.

An agentic verification result is not by itself a hard completion gate. The provider contract and runtime protocol are documented in the [Module Boundary Alignment guidance](code-organization-reference.md#semantic-module-boundary-review) and the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md); final completion-veto behavior depends on OMP's native advisor.

For cross-project responsibility and promotion of prose into checks, use [`quality-ownership-reference.md`](quality-ownership-reference.md). This package owns reusable check policy/implementation; OMP Verifier owns discovery, execution, and correction, while OMP Learner owns eligible feedback and proposal routing.

## Current Package Classification

| Asset                                             | Layer                | Why                                                                                                             |
| ------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `whitespace-matters`                              | Rule                 | Formatting and sibling grouping require project-local tools and structure judgment.                             |
| `solve-real-user-needs`                           | Rule                 | User value needs request/product context; use contextual review, not keyword or edge-case counts.               |
| `no-envrc-example-commits` and `no-envrc-example` | Both                 | The rule prevents staging; the verifier backstops tracked repository state.                                     |
| `omp-not-opencode-target-check`                   | Rule                 | Product identity depends on the user request and target package.                                                |
| `use-dev-wrapper-for-development-compose`         | Rule                 | Wrapper availability and command intent require repository context.                                             |
| `no-oversized-source-files`                       | Verification         | Tracked source paths and line ceilings are deterministic.                                                       |
| `default-function-exports`                        | Verification         | TypeScript paths are checked by default; projects may explicitly opt out.                                       |
| `typescript-runtime-entrypoints`                  | Verification         | Finite runtime compiler commands expose lazy declaration-loading mismatches.                                    |
| `test-alignment`                                  | Verification         | Changed tests follow naming/structure rules plus explicit local policies; assertion quality still needs review. |
| `module-boundary-alignment`                       | Agentic verification | Contextual evidence establishes meaningful ownership; size and count metrics are not substitutes.               |

## Default-Enabled Package Policies

Shared package policies and manifest verifications are available by default; a consuming project may explicitly opt out only where documented configuration supports it. Automatic execution still requires OMP Verifier and a matching trigger. Test-alignment's explicit local additions, including assertion-count limits, are project-selected conventions rather than shared defaults.

For `default-function-exports`, inspect all tracked TypeScript modules by default. Add the following to `.marlens-verifications.json` only to disable that verification:

```json
{
  "defaultFunctionExports": false
}
```

## Code-Style Advice

`source.activity === "unlabelled" ? "" : normalizeNote(source.activity)` is not behaviorally wrong, but it compresses two decisions: a domain sentinel means no activity, and real activity is normalized. Review it when that compression hides why normalization is skipped.

Name the domain policy when it deserves a reusable boundary:

```ts
const sourceActivity = source.activity

function normalizeActivity(activity: typeof sourceActivity) {
  if (activity === "unlabelled") return ""

  return normalizeNote(activity)
}

const activity = normalizeActivity(sourceActivity)
```

This remains advisor or review guidance unless the project defines an objective policy and transformation contract. A verifier for this pattern would need to prove that `"unlabelled"` returns `""`, ordinary values receive `normalizeNote`, and the normalizer is not called for the sentinel. Without that contract, a syntax-only failure would be a false-positive style gate.
