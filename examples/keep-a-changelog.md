# Curated Release Histories

## Task

Apply the [release-notes workflow](../docs/workflows/release-notes-workflow.md) without replacing project-local publishing rules or inventing release evidence.

## Contrasting Consumers

| Consumer                   | Evidence and Decision                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This package               | [CHANGELOG.md](../CHANGELOG.md) preserves the 43 former README entries through 3.28.0. Dates come from observed GitHub merges to main, which is this package's release mechanism. Historical headings link real immutable commit comparisons (the oldest retained entry links its release commit). The README links the history instead of embedding it. No registry publish or deployment is implied.                                        |
| Fictional registry package | Supplied facts: tags v1.3.0 and v1.4.0 exist; the registry records 1.4.0 publication on 2026-10-25; local install is 1.3.0; deployment is unknown. Use a dedicated changelog with Unreleased first and 1.4.0 dated 2026-10-25 above 1.3.0. Link the verified v1.3.0...v1.4.0 comparison, not invented tags or URLs. State publication separately from installation and unknown deployment. The project's registry procedure remains required. |
| Deliberate local exception | Supplied facts: a project maintains release notes in a reviewed YAML manifest consumed by its publishing pipeline. Keep that format and pipeline; apply curated outcomes, relevant categories, verified identities/dates, and breaking/security notices within its supported schema. Do not add a competing Markdown ledger, database, or server merely to enforce the shared default.                                                        |
| Pending source capability  | Supplied facts: the registry's current release is 1.1.0 with CommonJS imports; source-only 1.2.0 adds ESM and unified imports. Keep the main README's 1.1.0 usage intact. Put the pending capability in `Unreleased` or maintainer documentation; an explicitly labeled README preview is still inappropriate. Update README usage only with the corresponding verified release.                                                              |
| Merge-based release        | Supplied facts: merging to main is the documented release event, and the reviewed merge includes the capability. Verify that merge and reconcile README claims to it; do not invent an npm publication requirement or confuse a local build with the release.                                                                                                                                                                                 |

## Unreleased Reconciliation

The following fictional identities and behavior checks are supplied facts, not release claims about this repository. The verified published baseline is `v2.0.0`: steps reorder individually through `moveStep(id, beforeId)`, and CSV export drops the final row. None of the following candidates has been published.

### Feature, Replacement, and Pre-Release Revert

Reconcile after each scope change, using the same published baseline:

| Candidate | Verified Behavior                                                                                                                                  | Reconciled Draft                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A         | Adds parallel groups through `moveGroup(groupId, beforeGroupId)`; fixes CSV export.                                                                | Added: “Reorder parallel groups together.” Fixed: “Include the final row in CSV exports.”                                                              |
| B         | Replaces the group API with `reorderGroups(groupIds)`; fixes CSV export.                                                                           | Replace A's group entry with “Set the order of all parallel groups in one operation.” Keep the CSV fix; do not claim both group APIs remain available. |
| C (final) | Reverts all group work, restoring baseline individual-step behavior; keeps the CSV fix. No persisted-data or preview recovery consequences remain. | Remove the group entry entirely. Keep only “Include the final row in CSV exports” under Fixed.                                                         |

Before reconciliation, an accumulated draft might incorrectly read:

```markdown
## [Unreleased]

### Added

- Reorder parallel groups with moveGroup(groupId, beforeGroupId).

### Changed

- Replace moveGroup with reorderGroups(groupIds).

### Fixed

- Restore individual-step reordering with moveStep(id, beforeId).
- Include the final row in CSV exports.
```

After comparing `v2.0.0` with final candidate C:

```markdown
## [Unreleased]

### Fixed

- Include the final row in CSV exports.
```

There is no restoration entry: individual-step reordering is unchanged from the published baseline. If the CSV fix were also reverted without remaining consequences, no entry for this work would remain. Empty categories disappear; published `v2.0.0` notes stay untouched.

### Material Consequences Survive a Revert

In a separate candidate, supplied evidence establishes that the group preview persisted grouped step records, the final candidate requires converting them to individual records before opening, and a separate authorization fix remains. Reconciliation removes the withdrawn group capability claims but retains both distinct outcomes:

```markdown
## [Unreleased]

### Changed

- Users of the parallel-group preview must run the documented group-to-step conversion before opening saved preview projects. Projects from published 2.0.0 need no conversion.

### Security

- Prevent users without project access from exporting its steps.
```

The preview recovery instruction remains because saved data still needs action, not because every reverted implementation deserves a historical note. If the final candidate also has a verified breaking API change or deprecation, retain its affected interface and migration instructions rather than hiding them in the consolidation.

### Reversing Published Behavior

Contrast a separate release line where verified published `v2.1.0` already shipped `reorderGroups(groupIds)` and removed `moveStep`. A final candidate for 2.2.0 removes group reordering and restores `moveStep`. This is a new change relative to the published baseline, not a fully reverted unreleased feature:

```markdown
## [Unreleased]

### Removed

- Breaking: remove reorderGroups(groupIds). Integrations must replace group-order calls with individual moveStep(id, beforeId) calls.

### Added

- Restore individual-step reordering through moveStep(id, beforeId).
```

Keep the published 2.1.0 capability and removal entries unchanged. The new notes explain the candidate's compatibility impact; they do not rewrite the release that users already received.

## Check

Run a bounded read-only OMP consumer using the canonical workflow and then the installed packaged fallback. Ask for each consumer's document shape, release/date/link evidence, publish/install/deploy distinction, and scope of the local exception. Add a case with unknown historical dates and a pending version without a release event: neither may become a guessed dated release. Exercise candidates A, B, and C in sequence: the draft must replace superseded claims, then shrink to the surviving CSV fix without editing published history. Also check the no-surviving-change variant, the preview recovery/security variant, and the already-published reversal: distinguish removable intermediate claims from meaningful remaining consequences and new compatibility changes. Withhold the baseline or candidate behavior evidence in another run: the affected claims must remain provisional, not be confidently deleted or announced. Verify decisions, not matching phrases. These fictional scenarios do not authorize publishing or changing external repositories.
