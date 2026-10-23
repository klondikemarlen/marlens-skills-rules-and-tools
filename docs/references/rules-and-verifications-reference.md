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

For cross-project responsibility and promotion of prose into checks, use [`quality-ownership-reference.md#correction-coverage-and-verification-evidence`](quality-ownership-reference.md#correction-coverage-and-verification-evidence). It distinguishes Learner's correction-coverage result from an accepted rule, a supplied supported contract, and Verifier's evidence from applicable current code. This package owns reusable policy and check assets; Verifier owns discovery, execution, and correction; Learner owns eligible feedback and proposal routing.

The default `whitespace-matters` rule selects commit/push and PR creation/readiness/merge commands, not an operation merely named `review`. Request/evidence inspection is not a readiness claim. The rule still requires project formatter/checker use and `git diff --check` at delivery, with existing project/user precedence and explicit overrides.

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
| `barrel-only-indexes`                             | Verification         | Explicit library indexes contain static barrel constructs, with reasoned runtime-entrypoint exclusions.         |
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

## Library Index Verification

`marlens-rules:barrel-only-indexes` checks Git-tracked and nonignored untracked `index.js`, `index.jsx`, `index.mjs`, `index.cjs`, `index.ts`, `index.tsx`, `index.mts`, and `index.cts` files under a directory segment named `lib` by default. Dependencies under `node_modules` and declaration files are excluded. It parses syntax with the installed TypeScript dependency; comments and empty statements are harmless.

Supported barrels contain re-exports (including type/namespace exports), imports with bindings, local export lists of imported bindings, and default exports of an imported identifier or a static object of imported bindings. Implementations, local declarations, side-effect-only imports, computed/spread/method object members, calls, and other executable statements fail with file/line evidence. This checks barrel syntax, not imported modules' side effects, module resolution, or semantic cohesion; the existing default-function-export check still owns implementation export spelling.

Projects with different library locations can replace the default scope with repository-relative `roots`. Explicit runtime/package initialization entrypoints need an exact path and nonblank reason:

```json
{
  "barrelOnlyIndexes": {
    "roots": ["web/src/lib", "packages/widgets"],
    "entrypoints": [
      {
        "path": "packages/widgets/runtime/index.ts",
        "reason": "Starts the widget worker rather than bundling its public API."
      }
    ]
  }
}
```

Put this configuration in `.marlens-verifications.json`. Omit `roots` to retain the default `lib` scope; set `barrelOnlyIndexes` to `false` only for an explicit project opt-out. A package export is not automatically exempt because it may itself be a barrel.

Automatic checks inspect matching `OMP_VERIFIER_CHANGED_PATHS`; a configuration-file change checks the complete configured scope. Manual checks inspect the whole scope. Evidence names inspected and explicitly excluded paths, including exception reasons; no matching files is an explicit not-applicable result. Invalid configuration or changed-path context, unreadable source, syntax errors, and paths escaping the repository produce `BLOCKED`, not a guessed pass. Deleted paths are skipped. Automatic execution/discovery belongs to OMP Verifier; this package supplies the policy and deterministic check.

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
