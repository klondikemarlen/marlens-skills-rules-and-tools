# Testing Instructions Workflow

Use when writing or updating pull request testing instructions.

## Process

1. Read the PR body, diff, and any existing testing section.
2. Read project-local setup docs and command wrappers, such as `README.md`, `bin/README.md`, package scripts, or dev-wrapper docs.
3. Identify behavior a reviewer can actually verify. Before selecting scenarios, establish the target environment, required deployment, reviewer roles, available data, and permitted setup actions under [Reviewer and Data Feasibility](#reviewer-and-data-feasibility).
4. Start from the success condition: name the behavior, invariant, or regression risk each scenario must prove.
5. Verify exact UI labels, routes, commands, and required setup from source or a running app. Do not guess.
6. Write steps in execution order, checking each action is available in the state produced by the previous action. When repairing instructions, preserve the scenario's intended transitions and invariant coverage: restore a required real user action rather than moving setup earlier if that removes the behavior under test. For a completed-record edit scenario, this may mean reopen/revert, reassign/edit, then re-complete; an initial-assignment scenario needs no unnecessary revert.
7. Write the user-visible end-user/QA checks first, in the order a reviewer can perform them. Keep any local developer setup or developer-only checks in a separate section afterward when needed; the project's existing PR template chooses section labels and structure, so do not impose a new heading or skeleton.
8. State real prerequisites before the first action that needs them, even when developer setup is presented afterward. Keep end-user scenario prerequisites distinct from optional or developer-only checks; do not move a prerequisite later if doing so makes an earlier action unavailable or changes the behavior under test.
9. Give each scenario enough tester-facing context to identify where the tester is, the starting state, the action, and the expected result. Use exact labels or values when they matter. Distinguish what should change from what must remain unchanged, and check the named invariant after relevant actions, not only at the end.
10. Separate independent scenarios with numbered test cases when the flow is complex.

## Reviewer and Data Feasibility

Choose scenarios for the reviewer's actual environment and permissions, not the agent's local proof. For deployed/shared environments, explain how to find suitable existing records through verified normal UI filters, search, or navigation, and state the observable properties that make them suitable. Expect mixed unrelated data and unknown personal history; do not require local fixture names, IDs, fixed counters, or a pristine dataset.

Keep manual setup small and practical. Do not require database access, counter resets, bulk generation, or repeated actions solely to manufacture usage thresholds. Separate observable manual checks from exact algorithm, ranking-weight, threshold, and edge-case proof in controlled developer tests; preserve that precise coverage rather than describing a plausible displayed order as mathematical proof.

When a scenario needs unavailable data, deployment, role, or setup permission, name the exact missing prerequisite and the owner who can supply it, mark that coverage `BLOCKED`, and continue independent checks. Do not invent access, claim an unrun result, or ask reviewers to manufacture large datasets. Keep legitimate isolated fixtures and seeding under developer-only setup, never as implicit prerequisites for deployed-app QA. Preserve the scenario's intended transitions and behavior assertions when adapting its data requirements.

## Real-Authentication E2E Preflight

This applies only when a suite claims real-authenticated coverage; it does not require every suite to use real credentials.

Before expanding a suite that claims real-authenticated coverage:

1. **Identify the path and account.** Read the app configuration and project setup to identify the configured provider/client, the intended authorized test account, and the app-level result that proves authentication (such as reaching a protected route or completing a protected action). Use a non-secret test-account alias in published instructions; never publish credentials. Check the actual provider/client protection policy, including CAPTCHA, from its configuration or an authorized owner. Do not infer automation policy from a tenant or domain name.
2. **Run one minimal executable scenario first.** Use the project's documented command and its actual configured client/SDK to sign in with the intended account, return to the application, and verify the named app-level result—not just successful identity-provider sign-in. Record the exact command and observable result. Limit provider-specific claims to the client/path actually exercised.
3. **Separate environments.** Document local setup and credential sourcing separately from CI secret configuration. Run the preflight in every environment for which authenticated acceptance is claimed; secret presence alone does not prove that CI login works. An unrun preflight for a claimed authenticated target is `BLOCKED`. A deliberately smoke/mock-only target remains labeled as such, with authenticated acceptance `N/A`, not passing.
4. **Report the result truthfully.** Report smoke/mock and real-auth coverage separately for each environment. A successful preflight proves only its exercised path, not unrun acceptance scenarios. Use `PASS` for an executed successful check, `FAIL` when the attempted check returns an error or misses its app-level result, and `BLOCKED` when a required authenticated check is not run or an external prerequisite, provider protection, or missing authorization prevents completion. State the exact blocker and the authorized owner who can resolve it. Skipped or unrun authenticated checks never count as passing.
5. **Preserve safeguards.** Do not bypass CAPTCHA or weaken authentication. Account provisioning, provider-policy changes, and administrative access require explicit approval from the authorized account/provider owner; do not make those changes without it. If current protections prevent automation, leave authenticated acceptance blocked.

Mocks and smoke checks remain useful, but they prove only the behavior they exercise and must not be labeled authenticated acceptance.

When validating an authenticated browser flow, follow this preflight before adding many scenarios; the [Browser QA Workflow](../browser-qa/workflow.md) covers user-visible execution and reporting.

## Evidence Ownership

Choose the smallest owning evidence layer that can prove the success condition. Move outward only when the changed behavior crosses a boundary.

Choose focused evidence or a relevant affordable full suite under [Full-Suite Cost](../hands-off-agentic-coding/workflow.md#full-suite-cost). Ordinary suites need no separate permission check. Avoid known expensive full-suite launches during local iteration; request direction only when that expensive run is actually needed, and report any independently required unrun gate truthfully.

| Change surface                                | Primary evidence                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Unit, parser, schema, or pure state logic     | Owning unit/module test                                                                                                     |
| Cross-module workflow or business behavior    | Deterministic business/integration test                                                                                     |
| Process, shell, PATH, installer, or OS policy | OS/install wrapper or scenario                                                                                              |
| Packaged or released command behavior         | Build/package/install smoke check                                                                                           |
| UI, media, or interaction behavior            | Source-level observable check by default; browser/UI scenario when explicitly requested or required by the project workflow |
| Live provider behavior                        | Protocol fixture; opt-in live check with limitations                                                                        |
| Documentation or guidance                     | Owning-source/link/readability check and relevant verifier                                                                  |
| Performance or resource claim                 | Controlled end-to-end comparison with baseline, workload, environment, sample count, and correctness                        |

Report only affected dimensions. Do not require an unrelated full matrix by default.

## External CLI and API Doubles

When a test double stands in for a CLI or API used by a changed adapter, derive the consumed options, field names, response shape, and semantics from the supported public interface: authoritative documentation, installed dependency help/schema, or a safely observed response. Keep fixtures focused; omit irrelevant fields, but do not invent consumed fields or unsupported options merely to make the adapter pass.

For example, if an adapter runs `gh issue view --json url,state,number`, a synthetic response with those documented fields is a valid focused fixture. Adding an invented `repository` field to the request and stub is not fidelity: the [supported `gh issue view` JSON fields](https://cli.github.com/manual/gh_issue_view#json-fields) include `url`, `state`, and `number`, not `repository`. Keep such command-specific detail in the test/example, not as a global field list.

When practical and authorized, complement the deterministic double with the smallest read-only smoke check against the actual boundary and exercised dependency version. Do not mutate external state for a compatibility probe. If the boundary cannot be reached safely or is not authorized, say that compatibility remains unverified; do not broaden the stub or call it live acceptance. Preserve deterministic isolation and the distinction between mock/smoke and authenticated acceptance; do not require network access for every test or adapter. Keep synthetic fixtures and published evidence free of credentials, account data, raw private payloads, and workstation-specific paths.

For one-off tooling checks and suite selection, follow the [hands-off verification guidance](../hands-off-agentic-coding/workflow.md#intent).

This evidence-ownership guidance is adapted from Tura's [contribution guide](https://github.com/Tura-AI/tura/blob/main/docs/contributing-guide.md). Tura-inspired process guidance is not evidence that any isolated Tura feature caused a benchmark result.

## Rules

- Test behavior, not implementation details.
- Prefer user-visible verification over internal plumbing.
- Include setup commands only when they are needed for the scenario.
- Use exact labels for buttons, fields, tabs, pages, and messages.
- Write from the tester's point of view: explain where they are, the starting state, one primary action per numbered step, and its nearby visible result. Use plain user-facing terms and exact product labels; briefly explain unfamiliar product terms needed to follow the scenario instead of substituting implementation jargon.
- Screenshots are optional supporting evidence. Do not require agents to create or annotate screenshots, and do not rely on an image to supply missing action or expected-result context.
- Do not include credentials, secrets, or local-only state values.
- If something was not verified, say so explicitly.
- Use `PASS`, `FAIL`, and `BLOCKED` from `AGENT_RULES.md` when reporting verification outcomes.
- For asynchronous integration tests, use [Real Async Runtime Barriers in Integration Tests](../../docs/references/engineering-techniques-reference.md#real-async-runtime-barriers-in-integration-tests): name the observable condition and unique marker instead of prescribing a delay.

## Output Shape

```markdown
## Testing Instructions

### <project template's end-user/QA section>

Prerequisite: <required app/account/data state, established before the first action that needs it>.

1. Open `<page>` and confirm its visible heading.
2. Perform `<one primary action>`; confirm `<visible result>`.

### <project template's developer setup/checks section, when needed>

Prerequisite: <local developer environment or credentials, when required by these checks>.

1. Run `<focused developer check>` and confirm `<check result>`.

Use the project's existing template headings and structure; these labels illustrate ordering, not required new headings.
```
