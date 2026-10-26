# Changelog Template

Use with the [release-notes workflow](../workflows/release-notes-workflow.md). Prefer the target project's deliberate format exception when present. Replace placeholders only with supported outcomes, observed version/revision and release-date evidence, and existing URLs. Do not copy illustrative categories or invent tags to fill a template.

```markdown
# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Changed

- <curated pending outcome; omit this category when no changes are pending>

## [<released version>](<existing release or immutable comparison URL>) - <observed YYYY-MM-DD>

### Fixed

- <user-visible correction; choose only categories relevant to this release>
```

Use Added, Changed, Deprecated, Removed, Fixed, or Security as needed and omit empty categories. Keep `Unreleased` even when empty. Put the newest released version first; preserve breaking changes, removal/deprecation notices, security details, and existing history. If a historical release date or revision is unavailable, mark it unknown rather than guessing.

Before publication, verify links against real tags/revisions/release records and the project's release mechanism. After publication, reconcile the actual release event/date before reporting completion. Neither a changelog entry nor a local install proves deployment; database storage and new release automation are not required.
