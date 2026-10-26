# Release Notes Workflow

Use when drafting release notes, changelog entries, or release-summary emails.

## Shared Release-History Default

Prefer a dedicated human-readable `CHANGELOG.md` based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), with `Unreleased` first and released versions in newest-first order. Use linkable version headings and observed ISO `YYYY-MM-DD` release dates. Keep the README focused on product, installation, and usage with a link to the history.

Curate reader-visible outcomes, not raw commit dumps, file inventories, or recurring execution reports. Move existing history without losing its prose, breaking-change details, links, or release distinctions. When historical dates cannot be established from the project's release mechanism, mark them unknown rather than borrowing commit-author dates or guessing.

Resolve the actual version/revision and release event before claiming a release. Use existing tags, immutable commit comparisons, or real release/PR links as supported; do not invent tag names or treat moving `main` as an installed artifact identity. At release preparation, verify the chosen date against the actual release event before reporting completion, correcting a crossed-date candidate through the project's normal release process. Package inclusion, publishing, installation, and deployment are separate evidence.

Keep project-local release mechanisms and deliberate compatible format exceptions. A project may publish through a registry, a release page, or merge to its default branch; this default does not replace those mechanisms or require database backing, a history server, another skill, or new release automation.

## Source Priority

1. User-provided release scope, PRs, commits, tickets, or deployed version.
2. Local git history and tags.
3. Remote repository metadata.
4. Status pages or deployment records, when available.

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
