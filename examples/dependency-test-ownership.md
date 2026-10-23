# Dependency Test Ownership

## Task

Choose downstream test coverage during dependency adoption, extraction, or upgrades without duplicating upstream API tests or deleting application-owned integration coverage. Use [Scenario-Oriented Verification](../docs/references/code-organization-reference.md#scenario-oriented-verification) through the authoring and code-review workflows.

## Without

A factory-library cutover adds permanent tests for ordinary builds, persistence, association reuse, and sequences. A later correction removes every dependency-related test, including application access rules. Both decisions confuse which contract the application owns.

## With

This is bounded read-only semantic QA, not implementation. Use the installed code-review skill and its selected workflow, then read its Scenario-Oriented Verification reference. Evaluate only these fictional proposals. Do not inspect application repositories, execute fictional tests, write files or GitHub records, delegate, or change models. For each case A–F, give the test-plan decision, contract owner, uncovered risk, and smallest sufficient proof. Do not claim any fictional check was run.

- **A:** A new downstream suite checks the factory package's documented unsaved builds, persistence, existing-association reuse, and sequence increments. It uses application models and a real database, but no application customization or observed compatibility failure.
- **B:** An application-owned post-save role hook and category-scoped access helper have changed. Their access invariant has no existing consumer coverage. The proposed test calls the real dependency while checking the application's role and access result.
- **C:** A reproduced interaction between the application's transaction adapter and the selected dependency release commits a role record after rollback. No existing test protects rollback here. A proposed focused regression asserts the application's persisted state after the failure.
- **D:** A mechanical extraction changes factory imports, not application helper logic. Existing application-consumer tests already exercise the unchanged access helper; a disposable smoke can check the new import path against the selected installed dependency. The author proposes another permanent helper suite solely because imports changed.
- **E:** The selected upstream 1.0.0 release preserves 0.1.0 implementation/API and supplies package-owned TypeScript, SQLite, and CommonJS smoke evidence for 1.0.0. The application uses a different database and has custom access hooks. Its last local tests ran against 0.1.0. The author proposes copying the upstream smoke downstream and declaring the old local run proof of installed 1.0.0 integration.
- **F:** An existing application adapter test imports the dependency and checks an application-specific authorization invariant. A reviewer proposes deleting it solely because the import is external; no duplication or obsolete invariant has been established.

## Why

Ownership follows the asserted invariant, not the fixture shape, real database, or import origin. Existing consumer coverage and version-scoped upstream evidence reduce duplicate work without proving an unexercised application integration.

## Check

Copy only the content between `## With` and `## Why` into a uniquely allocated temporary prompt file. From the checkout under review, run a fresh configured OMP process:

```bash
omp -p --mode json --no-session --no-title --max-time 300 @/path/to/owned-temporary-prompt.md
```

Use the actual temporary filename; remove only that owned file afterward. For installed-artifact QA, run from an owned temporary directory without a local workflow overlay so the installed skill selects its packaged workflow. Keep configured routes and advisor cadence unchanged. Evaluate primary assistant decisions, not wording matches or generic advisor notifications:

- A: do not add a downstream standard-API suite; application fixtures and a real database do not change ownership.
- B: retain focused local coverage of the uncovered application access/post-save invariant.
- C: retain a focused regression for the observed adapter/rollback interaction; do not invent further unusual cases.
- D: reuse existing consumer tests and scoped disposable compatibility smoke rather than automatically adding a second suite.
- E: reuse upstream 1.0.0 evidence without copying it; exercise relevant application consumers/smoke against installed 1.0.0 and the application's actual integration. Preserve the 0.1.0 scope of the old results.
- F: reject blanket deletion; external imports alone do not invalidate meaningful local coverage.

Record the observed route, guidance revision or installed version, decisions, limitations, and PASS/FAIL/BLOCKED in the existing session or permitted evidence location. This scenario is not a new runtime verifier or an instruction to run every upstream suite downstream.
