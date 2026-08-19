# Rules and Verifications

Rules and verifications are complementary enforcement layers, not interchangeable packaging.

## Choose the Smallest Layer

| Concern | Use | Reason |
| --- | --- | --- |
| An agent must make a contextual decision or follow a procedure | Rule | It needs intent, repository context, or human judgment. |
| A final repository state has a deterministic, bounded pass/fail condition | Verification | A read-only script can produce repeatable evidence without model judgment. |
| Both are true | Rule and verification | The rule prevents the mistake early; the verification is a backstop at the boundary. |
| The signal is subjective, incomplete, or too costly to specify precisely | Advisor or review guidance | A blocking script would create false positives and reward mechanical compliance. |

A verification must declare a concrete input scope, fail condition, evidence, and remediation. Do not add one merely because a rule exists. A rule must explain the decision an agent must make; do not replace that explanation with a script name.

## Current Package Classification

| Asset | Layer | Why |
| --- | --- | --- |
| `whitespace-matters` | Rule | Formatting and sibling grouping require project-local tools and structure judgment. |
| `no-envrc-example-commits` and `no-envrc-example` | Both | The rule prevents secret-pattern exposure; the staged check catches missed tracked files. |
| `omp-not-opencode-target-check` | Rule | Product identity depends on the user request and target package. |
| `use-dev-wrapper-for-development-compose` | Rule | Wrapper availability and command intent require repository context. |
| `no-oversized-source-files` | Verification | Tracked source paths and line ceilings are deterministic. |
| `default-function-exports` | Opt-in verification | Configured TypeScript paths have a bounded declaration contract. |
| `test-alignment` | Verification | Changed tests can be checked against defined baseline and local rules. |

## Code-Style Advice

`source.activity === "unlabelled" ? "" : normalizeNote(source.activity)` is not behaviorally wrong, but it compresses two decisions: a domain sentinel means no activity, and real activity is normalized. Review it when that compression hides why normalization is skipped.

Name the domain policy when it deserves a reusable boundary:

```ts
const sourceActivity = source.activity;

function normalizeActivity(activity: typeof sourceActivity) {
  if (activity === "unlabelled") return "";

  return normalizeNote(activity);
}

const activity = normalizeActivity(sourceActivity);
```

This remains advisor or review guidance unless the project defines an objective policy and transformation contract. A verifier for this pattern would need to prove that `"unlabelled"` returns `""`, ordinary values receive `normalizeNote`, and the normalizer is not called for the sentinel. Without that contract, a syntax-only failure would be a false-positive style gate.
