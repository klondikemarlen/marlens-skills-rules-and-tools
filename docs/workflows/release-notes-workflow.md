# Release Notes Workflow

Use when drafting release notes, changelog entries, or release-summary emails.

## Source Priority

1. User-provided release scope, PRs, commits, tickets, or deployed version.
2. Local git history and tags.
3. Remote repository metadata.
4. Status pages or deployment records, when available.

## Rules

- Separate user-facing changes from internal-only changes.
- Do not say a version is deployed unless a source confirms it.
- Do not overclaim impact; write what the evidence supports.
- Group entries by common changelog categories when useful: Added, Changed, Deprecated, Removed, Fixed, Security.
- Treat AI-generated notes as drafts requiring human review before publication.

## Output Shape

```markdown
# <Version or Release Name>

## Added

- <user-facing addition>

## Changed

- <user-facing change>

## Fixed

- <user-facing fix>
```
