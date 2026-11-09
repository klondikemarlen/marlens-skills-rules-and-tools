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

An agentic verification result is not by itself a hard completion gate. The provider contract and runtime protocol are documented in the [Module Boundary Alignment guidance](module-boundary-reference.md#semantic-module-boundary-review) and the [OMP Verifier scope and manifest contract](https://github.com/klondikemarlen/omp-verifier/blob/main/README.md); final completion-veto behavior depends on OMP's native advisor.

`marlens-rules:documentation-purpose-alignment` selects changed root and nested `.md` and `.mdx` files. Its [governing standard](../workflows/code-review-workflow.md#documentation-purpose-and-placement) requires complete changed passages, applicable project guidance, and material referenced implementation/owner documents captured before a cited whole-scope assessment. Recover missing context through Verifier's supported `review --context` path; unavailable required evidence remains `BLOCKED`. Legitimate source-local patterns, operator procedures, and discovery links are accepted. See the contrasting [documentation-purpose examples](../../examples/documentation-purpose-review.md); formatting/link checks and primary assertions are not semantic evidence.

For cross-project responsibility and promotion of prose into checks, use [`quality-ownership-reference.md#correction-coverage-and-verification-evidence`](quality-ownership-reference.md#correction-coverage-and-verification-evidence). It distinguishes Learner's correction-coverage result from an accepted rule, a supplied supported contract, and Verifier's evidence from applicable current code. This package owns reusable policy and check assets; Verifier owns discovery, execution, and correction; Learner owns eligible feedback and proposal routing.

The default `whitespace-matters` rule selects commit/push and PR creation/readiness/merge commands, not an operation merely named `review`. Request/evidence inspection is not a readiness claim. The rule still requires project formatter/checker use and `git diff --check` at delivery, with existing project/user precedence and explicit overrides.

## Project Linting Verification

Projects need working lint configuration appropriate to their maintained source. Use the project's existing linter and documented non-fixing command: ESLint with suitable language/framework support, or an equivalent native tool. Inspect effective configuration, included files, parsers/plugins, and the configured warning policy; a dependency or a successful command that ignores the changed source does not establish coverage. Formatting, typechecking, tests, and rendered behavior protect different contracts.

The shared [`project-linting`](../../rules/project-linting.md) rule requires applicable lint evidence at readiness. When using OMP Verifier, express the executable check through its existing [project-specific requirements](https://github.com/klondikemarlen/omp-verifier#project-specific-verifier-requirements), not a new command runner, package manifest entry for an unspecified command, or generic model judgment.

For a project whose documented `npm run lint` checks `src/**/*.js` without fixing files, merge this requirement into its existing project `WATCHDOG.yml` verifier entry:

```yaml
advisors:
  - name: verifier
    tools: [bash]
    instructions: |
      @/home/<user>/.omp/agent/verifier/WATCHDOG.md

      - Check id project:lint. When src/**/*.js, eslint.config.js, package.json, or package-lock.json changes, run `npm run lint`. The quality standard is that the configured ESLint rules pass for the maintained JavaScript source, evidenced by actual command exit 0 and its lint output. Report lint violations as FAIL; missing or broken tooling/configuration or an unexecuted check is BLOCKED. Correct violations and execute a fresh check after changes.
```

Use the actual generated Verifier guidance path for the active user/profile, preserving existing verifier model routing and other requirements. Replace the illustrative paths and command with the project's real source/configuration triggers and documented wrapper; for Dockerized projects use their development/test wrapper, not a host command that bypasses it. This example assumes an already configured JavaScript linter, not a universal npm convention or automatic project setup. A new `WATCHDOG.yml` is read by a fresh OMP process.

Separate source languages or independently configured subprojects need their actual commands and coverage named in that entry. For changed CSS or embedded Vue styles, inspect whether the configured linter supports those blocks; use the project's supported style diagnostic provider where the main linter does not. A diagnostic's source and rule id establish its provider, not the word "lint". See [CSS Diagnostics for Style Changes](../workflows/code-review-workflow.md#css-diagnostics-for-style-changes).

Observe execution rather than merely recommending the command. PASS requires a current successful run covering the applicable source and configuration. A real lint violation is FAIL; missing tooling/configuration, unsupported required source, or an unexecuted check is BLOCKED with the missing prerequisite. Preserve the project's warning policy and fix violations without disabling rules or excluding affected files merely to pass. Following a correction, run the command again; an earlier PASS cannot clear later changes.

Fit checks: an unused binding under an enabled error rule must fail, then pass after its correction; a project with no working lint command cannot pass; a Vue script-only configuration cannot clear a changed style block; and a documentation-only change outside the declared trigger is N/A rather than a whole-project lint verdict.

MSSRT supplies this policy and requirement example; the consuming project owns its lint configuration and setup, and Verifier owns execution and result delivery. The requirement does not register a new `/verifier checks` manifest id, install tools, or provide a hard host-level completion veto. Direct lint execution without a working verifier is command evidence, not proof of native advisor delivery.

### Semantic Lint Fixes

A diagnostic is a reason to understand a contract, not proof of a runtime defect or a target to hide. Before accepting helper extraction or a syntactic rewrite as its fix, explain which underlying risk/invariant changes and verify that behavior separately from the fresh lint run. A meaningful helper remains valid when its boundary clarifies or enforces the contract; an accepted intentional policy change is also valid.

For paused tasks, extracting a throwing cleanup block into `await resumeAndWaitForTasks()` inside `finally` may evade `no-unsafe-finally` analysis while still replacing an earlier failure. Reject that as a semantic fix when failure replacement is the warned-about risk. Make failure ownership explicit: resume/settle the required tasks, preserve the original failure and required background diagnostics through the established error/reporting boundary, then report according to the accepted contract. A refactor that actually prevents an unowned cleanup failure from masking the original is a fix; a renamed helper with unchanged behavior is not.

Use controlled failures to observe normal completion, original-operation failure, cleanup/background failure, and both together: verify required cleanup completes and the required original/background diagnostics remain available. Do not assume a test framework lost a diagnostic without inspecting its output, mandate `AggregateError` for every cleanup path, or treat lint PASS as this proof. Preserve accepted reporting semantics and avoid unrelated changes.

For intentional unbounded loops, follow the [readable loop preference](code-organization-reference.md#intentional-unbounded-loops): keep ordinary constant-condition diagnostics and document the breadth of any supported loop exemption rather than rewriting a clear loop solely to appease lint.

## Current Package Classification

| Asset                                             | Layer                        | Why                                                                                                               |
| ------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `whitespace-matters` and `final-newlines`         | Both                         | Formatting needs project context; a final newline has a deterministic byte-level check.                           |
| `project-linting`                                 | Rule and project requirement | Readiness requires applicable lint evidence; the existing Verifier executes each project's explicit lint command. |
| `solve-real-user-needs`                           | Rule                         | User value needs request/product context; use contextual review, not keyword or edge-case counts.                 |
| `no-envrc-example-commits` and `no-envrc-example` | Both                         | The rule prevents staging; the verifier backstops tracked repository state.                                       |
| `omp-not-opencode-target-check`                   | Rule                         | Product identity depends on the user request and target package.                                                  |
| `use-dev-wrapper-for-development-compose`         | Rule                         | Wrapper availability and command intent require repository context.                                               |
| `no-oversized-source-files`                       | Verification                 | Tracked source paths and line ceilings are deterministic.                                                         |
| `default-function-exports`                        | Verification                 | TypeScript paths are checked by default; projects may explicitly opt out.                                         |
| `barrel-only-indexes`                             | Verification                 | Explicit library indexes contain static barrel constructs, with reasoned runtime-entrypoint exclusions.           |
| `typescript-runtime-entrypoints`                  | Verification                 | Finite runtime compiler commands expose lazy declaration-loading mismatches.                                      |
| `test-alignment`                                  | Verification                 | Changed tests follow deterministic naming/structure rules plus explicit local syntax policies.                    |
| `test-assertion-focus`                            | Agentic verification         | Changed tests receive semantic review against shared assertion guidance and ordinary-language local standards.    |
| `module-boundary-alignment`                       | Agentic verification         | Contextual evidence establishes meaningful ownership; size and count metrics are not substitutes.                 |
| `documentation-purpose-alignment`                 | Agentic verification         | Changed Markdown/MDX is assessed for reader purpose, ownership, placement, and material code accuracy.            |

## Default-Enabled Package Policies

Shared package policies and manifest verifications are available by default; a consuming project may explicitly opt out only where documented configuration supports it. Automatic execution still requires OMP Verifier and a matching trigger. Test-alignment's explicit local additions, including assertion-count limits, are structural syntax conventions, not shared quality defaults. `test-assertion-focus` separately reviews semantic focus and honors applicable ordinary-language local policy without imposing a universal count.

For `default-function-exports`, inspect all tracked TypeScript modules by default. Add the following to `.marlens-verifications.json` only to disable that verification:

```json
{
  "defaultFunctionExports": false
}
```

## Final-Newline Verification

`marlens-rules:final-newlines` checks Git-tracked and nonignored untracked files, including dotfiles and configuration files. Automatic runs select `OMP_VERIFIER_CHANGED_PATHS`; manual runs inspect the whole scope. Changing `.marlens-verifications.json` rechecks the whole scope so removing an exception cannot leave an unchecked violation.

Changed paths and exclusions must use canonical repository-relative paths, such as `nested/settings.yaml`, without a leading `./` or repeated separators. Noncanonical input is `BLOCKED` rather than silently selecting no files.

The check reads bytes without rewriting files. Non-empty UTF-8 text without NUL bytes and BOM-marked UTF-16 text must end with LF (including CRLF). Empty files, binary data (NUL-containing or non-UTF-8 bytes without a UTF-16 BOM), deleted files, and symbolic links are excluded. It does not validate other encodings. An unreadable selected file, incomplete UTF-16 code unit, repository escape, or invalid scope/configuration is `BLOCKED`, not `PASS`. A missing terminator is `FAIL` with relative paths and remediation, never file contents.

For a documented format that forbids a final newline, add an exact repository-relative path and explanation to the existing `.marlens-verifications.json`:

```json
{
  "finalNewlines": {
    "exclusions": [
      {
        "path": "fixtures/exact-wire-payload.txt",
        "reason": "The protocol fixture requires exact bytes without a terminator."
      }
    ]
  }
}
```

Exclusions are reported with their reasons; they are not permission to suppress an ordinary formatting defect. Append only the missing terminator using the file's established convention. For verbatim snapshots, follow [Final Newlines](../../rules/whitespace-matters.md#final-newlines): repository normalization must not silently change live configuration or misrepresent bootstrap parity.

Run `omp-verifier verify marlens-rules:final-newlines` through the installed Verifier, or invoke the supplied script with Node from the target Git project. This package supplies the rule/check; Verifier owns automatic selection and advisor delivery. A check result does not itself establish a hard merge or completion veto.

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

Put this configuration in a regular `.marlens-verifications.json` file. Source indexes and configuration must be regular files: symlinks are blocked because edits to their targets would otherwise bypass the matching-path trigger. Omit `roots` to retain the default `lib` scope; set `barrelOnlyIndexes` to `false` only for an explicit project opt-out. A package export is not automatically exempt because it may itself be a barrel.

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
