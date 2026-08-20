# Downstream Guidance Audit

## Task

“Check a downstream repository for stale agent guidance and broken local links.”

## Without

Open every workflow and reference by hand, compare old install commands, and hope each relative Markdown link was followed.

## With `agent-guidance-audit`

```sh
agent-guidance-audit --strict ../downstream-project
```

```text
FAIL /path/to/repo/docs/workflows/example.md:42 markdown-link missing target ./missing-template.md
```

## Why

One read-only command checks every documented path consistently and reports a file, line, check, and remediation target suitable for an issue.

## Check

Exit `0` means no findings; exit `1` means findings were reported. Use `--json` only when another program consumes the results.

Source: [`downstream-agent-guidance-audit-reference.md`](../docs/references/downstream-agent-guidance-audit-reference.md).
