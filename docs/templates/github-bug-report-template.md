# GitHub Bug Report Template

Use after [version and ownership investigation](../workflows/github-bug-reporting-workflow.md); prefer the target project's existing issue template. Replace fields with observed facts or explicit `unknown`/`unavailable`, never guessed evidence. Omit irrelevant optional details rather than filling them with speculation.

```markdown
## Problem and Impact

<observable defect and affected user task>

## Expected and Actual Behavior

Expected: <supported contract>
Actual: <observed behavior and bounded diagnostics>

## Affected Versions

- Artifact/plugin installed: <observed version; revision/build identity or unavailable>
- Host/runtime: <relevant observed versions or unknown>
- Standard provider/model: <relevant provider version and selector or unavailable>
- Running process: <loaded version/revision or unknown; possible retained older modules>
- Latest relevant upstream release: <version/revision and canonical source; separate from installed>

## Bounded Reproduction

1. <safe exact setup/input/command>
2. <actual observed result>

## Ownership and Existing Fixes

<focused reproduction/source trace attributing the defect; searched issues/releases/fixes and links; why this is new evidence rather than a duplicate>

## Evidence

Original failure: <versioned diagnostics and sanitized evidence>
Separate newer-version/recovery result: <identity and result, if exercised; otherwise not run>
Unknowns: <material missing context, if any>

## Acceptance Criteria

- <smallest observable correction and preservation requirement>
```

Before filing: confirm exact-target write authority, appropriate existing labels, title case, redaction, version evidence, and duplicate decision. After filing/update: verify live remote fields and return the actual link. No automatic upgrade or fix implementation is authorized by this template.
