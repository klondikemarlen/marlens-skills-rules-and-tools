# Shared Standards Adoption

## Task

Replace copied generic checklists with a verified shared base and thin local deltas. Apply [Adopting Shared Standards](../docs/references/project-knowledge-base-reference.md#adopting-shared-standards); this is a knowledge-base adoption procedure, not a new standards registry or runtime.

## Without

A local workflow shadows the packaged skill, sends readers back to that same skill, or owns a copied checklist that no longer follows its shared source. A link audit can pass even when the consumer never reads or applies the actual standard.

## With

This is bounded read-only semantic QA for MSSRT shared-standards adoption. Read the installed project-knowledge-base skill's selected workflow and its shared-adoption reference. Evaluate the supplied fictional root guidance and proposals only. Do not edit files or GitHub records, install anything, execute fictional application commands, inspect downstream repositories, delegate, or change models. No application behavior has been verified by this exercise.

### Root Guidance for the Fixture Project

The project explicitly adopts the installed MSSRT release for generic authoring and review standards. For a relevant task, load the direct shared base document before the local workflow's deltas; local domain/security/command constraints and deliberate exceptions retain precedence. The selected release is available except where a case says otherwise. Resolve shared files using supported entrypoints rather than a personal installation path. Review uses the direct packaged `skill://code-review/workflow.md` document. Backend authoring uses `skill://express-light-rail/workflow.md` and the referenced shared standard. Relevant test authoring/review uses Scenario-Oriented Verification in the shared code-organization reference. Keep project commands in `bin/README.md`: the supplied API-test command is `bin/dev test api -- path/to/test`; this is a fixture command, not one to execute here.

Local constraints: financial entries must remain in their owning tenant; an isolated rollback invariant may legitimately use two direct balance assertions. The application currently has a supported backend service lifecycle; documentation adoption does not authorize changing its dependencies or base classes.

### Proposals to Assess

For each case, give the adoption/task decision, authoritative source you applied, local knowledge to retain, and smallest missing proof. Load the shared review/backend/test sources needed to make concrete decisions for B and C; merely saying that links exist is insufficient.

- **A — Circular routing:** The shared review skill selects `docs/workflows/code-review-workflow.md`; that local file says only, "Use the shared code-review skill first," then lists tenant access checks. Decide how to resolve the base and what belongs in the overlay.
- **B — Review and tests:** A proposed downstream test calls an external factory package with application models and checks only its documented unsaved builds and ordinary persistence. No local customization or compatibility failure is identified. Another test checks the application's tenant-isolation invariant through the real save lifecycle. Decide whether each belongs locally. Retain the supplied local test command and the rollback exception; do not turn the shared standard into a universal numeric assertion quota.
- **C — Backend authoring:** A generic controller checklist is copied locally. Its proposed replacement links the shared backend workflow, but the author also wants to move tenant authorization into an unverified new library base class solely because names look similar. Decide what may be replaced, who owns tenant authorization, and whether documentation adoption proves executable-library compatibility.
- **D — Conflicting local override:** An existing explicit local policy requires every test to have exactly one expectation and encourages constructing synthetic summary objects. The adopted shared standard rejects that workaround; no maintainer decision has reconciled the conflict. Decide the safe next action before deleting or silently overriding that policy.
- **E — Unavailable base:** A required base document in the selected shared release cannot be resolved. The author proposes deleting the copied generic rules anyway and reconstructing them from memory. Decide what is blocked, whether automatic installation is justified, and whether an unrelated read-only domain lookup must stop too.
- **F — Already-thin overlay:** A local review workflow directly references the resolved shared base and contains only tenant rules and the canonical local command link. The author proposes copying the full shared body into it, renaming every docs directory, and recording installed versions in a permanent duplicate standards ledger. Decide whether any of that is needed.
- **G — Version evidence:** A newer selected release is available, but the only recorded consumer exercise used the prior release. A moving source link resolves successfully. Decide what the existing evidence proves and what must be exercised before claiming the new adoption verified.

## Why

A project keeps its actual knowledge while the shared owner maintains generic standards. Direct-base references avoid circular skill selection; applied consumer decisions establish more than a resolvable URL. Local policy conflicts, missing prerequisites, and executable-library adoption remain explicit boundaries.

## Check

Copy only the content between `## With` and `## Why` into a uniquely allocated temporary prompt file. From the checkout under review, run a fresh configured OMP process:

```bash
omp -p --mode json --no-session --no-title --max-time 300 @/path/to/owned-adoption-prompt.md
```

For installed-artifact QA, run from an owned temporary directory without local workflow overlays, and use the example from the installed package. Keep configured routes and advisor cadence unchanged. Inspect primary assistant decisions against these outcomes, not phrase matches or generic advisor notices:

- A resolves the direct shared workflow document without routing back through the selecting skill and retains tenant checks locally.
- B rejects redundant downstream standard-API tests, preserves tenant-isolation integration coverage, the local command, and the legitimate coupled rollback exception.
- C replaces only verified generic guidance; tenant policy remains application-owned. Library APIs, compatible versions, and installed behavior require their own proof.
- D names the real conflict and requests the maintainer's policy decision; it neither silently drops local precedence nor recommends an assertion-hiding workaround.
- E blocks the affected replacement/task until the required source is available, without automatic installation, invented standards, or blocking unrelated lookup work.
- F retains the existing thin overlay without copying, directory migration, or a second ledger.
- G keeps prior-release results historical and requires selected-version source identity and a fresh applicable consumer exercise before claiming verification.

Record the actual consumer route, source/release identity, decisions, and PASS/FAIL/BLOCKED in the existing session or permitted release evidence. Link/literal audit results and these semantic decisions are separate proof; neither certifies the fictional application. Remove only owned temporary prompt files after QA.
