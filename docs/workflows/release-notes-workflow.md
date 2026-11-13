# Release Notes Workflow

Use when drafting release notes, changelog entries, or release-summary emails.

## Shared Release-History Default

Prefer a dedicated human-readable `CHANGELOG.md` based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), with `Unreleased` first and released versions in newest-first order. Use linkable version headings and observed ISO `YYYY-MM-DD` release dates. Keep the README focused on product, installation, and usage with a link to the history.

The main README describes released capabilities, installation, supported import paths and module formats, and usable examples. Keep source-only capability previews in `Unreleased` history or maintainer documentation, not in the main README even when labeled `Unreleased`. When preparing the corresponding release, reconcile README claims against the actual published artifact or the project's documented merge-based release boundary; a source checkout or local build does not establish registry publication.

Curate reader-visible outcomes, not raw commit dumps, file inventories, or recurring execution reports. Move existing history without losing its prose, breaking-change details, links, or release distinctions. When historical dates cannot be established from the project's release mechanism, mark them unknown rather than borrowing commit-author dates or guessing.

Resolve the actual version/revision and release event before claiming a release. Use existing tags, immutable commit comparisons, or real release/PR links as supported; do not invent tag names or treat moving `main` as an installed artifact identity. At release preparation, verify the chosen date against the actual release event before reporting completion, correcting a crossed-date candidate through the project's normal release process. Package inclusion, publishing, installation, and deployment are separate evidence.

Keep project-local release mechanisms and deliberate compatible format exceptions. A project may publish through a registry, a release page, or merge to its default branch; this default does not replace those mechanisms or require database backing, a history server, another skill, or new release automation.

## Source Priority

1. User-provided release scope, PRs, commits, tickets, or deployed version.
2. Local git history and tags.
3. Remote repository metadata.
4. Status pages or deployment records, when available.

## Reconcile Unreleased Notes

An unreleased draft is editable, not an append-only record of implementation attempts. Whenever release scope changes, and again before publication, reconcile it to the net reader-visible difference between the verified prior published baseline and the final candidate.

1. **Establish the comparison.** Identify the prior published version/revision through the project's release mechanism and the exact candidate revision. Inspect their comparison and supporting behavior evidence; do not infer the shipped outcome from commit titles or the existing draft alone. If either identity or behavior is unverified, name the missing evidence and keep the affected claims provisional.
2. **Remove fully reverted in-range changes.** If a feature, its replacement, and their pre-release revert leave the candidate equivalent to the baseline for that behavior, remove their draft entries. Do not append a restoration entry for behavior that never changed in a published release.
3. **Consolidate superseded outcomes.** Rewrite related entries to describe the surviving candidate behavior, replacing incompatible intermediate API or feature claims. Preserve distinct user outcomes rather than collapsing unrelated changes into one generic entry.
4. **Retain material consequences.** Keep independently meaningful security/safety fixes, breaking changes, deprecations, migrations, and recovery instructions supported by the final candidate or verified effects of the unreleased work. A code revert does not erase a persisted-data migration or a recovery action still required by affected preview users. Remove instructions that no longer apply; explain the affected audience when only preview users need action.
5. **Preserve published history.** Reconciliation edits only the unreleased range, not published version records. A candidate that reverses already-published behavior has a new reader-visible change relative to its baseline and needs an appropriate new-release entry, including any compatibility or migration impact.
6. **Review the resulting draft.** Check each remaining claim against the baseline and candidate, remove empty categories, and ensure no contradictory additions/restorations remain. A shorter draft, or no entry for a fully reverted change, is correct; there is no entry-count target or format change.

## Rules

- Separate user-facing changes from internal-only changes.
- Write concise entries naming the affected user task and the concrete capability or corrected behavior. Omit promotional filler and implementation inventories that do not explain a reader-visible outcome.
- When the user designates another project's notes as a prose reference, inspect representative entries and adopt their meaningful outcome-focused style without copying the reference's storage format or release machinery. Preserve the consuming project's requested changelog format.
- Do not say a version is deployed unless a source confirms it.
- Do not overclaim impact; write what the evidence supports.
- Use only relevant Added, Changed, Deprecated, Removed, Fixed, and Security categories; omit empty category scaffolding. Preserve breaking changes, deprecations, removals, and security information rather than flattening them into generic improvements.
- Treat AI-generated notes as drafts requiring human review before publication.

## Output Shape

Use the target project's deliberate format when required; otherwise use the [changelog template](../templates/changelog-template.md). Keep drafts under `Unreleased` until release preparation; never present an unreleased candidate, local install, or unverified deployment as a released/deployed result.
