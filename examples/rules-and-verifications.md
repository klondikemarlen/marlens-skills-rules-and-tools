# Contextual Rule With Deterministic Backstop

## Task

“Keep `.envrc.example` out of the repository.”

## Without

A reviewer remembers a prose rule at the end of a change, after the file may already be staged or committed.

## With `no-envrc-example-commits` and `no-envrc-example`

```text
Rule: stop before staging .envrc.example.
Verification: fail when the active Git project tracks .envrc.example.
```

## Why

The rule handles the contextual decision early; the verification supplies repeatable release evidence. Neither replaces the other.

## Check

Invoke `marlens-rules:no-envrc-example` through OMP from the target Git repository. A clean repository passes; a tracked `.envrc.example` fails.

Source: [`rules-and-verifications-reference.md`](../docs/references/rules-and-verifications-reference.md).
