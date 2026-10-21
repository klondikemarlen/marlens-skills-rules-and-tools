# Testing Instructions Workflow

Use when writing or updating pull request testing instructions.

## Process

1. Read the PR body, diff, and any existing testing section.
2. Read project-local setup docs and command wrappers, such as `README.md`, `bin/README.md`, package scripts, or dev-wrapper docs.
3. Identify behavior a reviewer can actually verify.
4. Start from the success condition: name the behavior, invariant, or regression risk each scenario must prove.
5. Verify exact UI labels, routes, commands, and required setup from source or a running app. Do not guess.
6. Write steps in execution order, checking each action is available in the state produced by the previous action. When repairing instructions, preserve the scenario's intended transitions and invariant coverage: restore a required real user action rather than moving setup earlier if that removes the behavior under test. For a completed-record edit scenario, this may mean reopen/revert, reassign/edit, then re-complete; an initial-assignment scenario needs no unnecessary revert.
7. Give each scenario enough tester-facing context to identify where the tester is, the starting state, the action, and the expected result. Use exact labels or values when they matter. Distinguish what should change from what must remain unchanged, and check the named invariant after relevant actions, not only at the end.
8. Separate independent scenarios with numbered test cases when the flow is complex.

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
- Write from the tester's point of view: explain where they are, what state they should start from, what to do, and what should happen next. Use plain user-facing terms; implementation-specific UI terminology is optional.
- Screenshots are optional supporting evidence. Do not require agents to create or annotate screenshots, and do not rely on an image to supply missing action or expected-result context.
- Do not include credentials, secrets, or local-only state values.
- If something was not verified, say so explicitly.
- Use `PASS`, `FAIL`, and `BLOCKED` from `AGENT_RULES.md` when reporting verification outcomes.
- For asynchronous integration tests, use [Real Async Runtime Barriers in Integration Tests](../../docs/references/engineering-techniques-reference.md#real-async-runtime-barriers-in-integration-tests): name the observable condition and unique marker instead of prescribing a delay.

## Output Shape

```markdown
## Testing Instructions

1. Run `<focused check>`.
2. Start the app with `<project command>`.
3. Navigate to `<page>`.
4. Perform `<action>`.
5. Verify `<observable result>`.
```
