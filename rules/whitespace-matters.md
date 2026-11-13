---
name: whitespace-matters
description: "Before presenting a change as ready, apply clean-code whitespace defaults and mechanical checks, respecting project-local guidance and explicit user overrides."
condition: "\\bgit\\s+(commit|push)\\b|\\bgh\\s+pr\\s+(create|ready|merge)\\b|\\bready for review\\b"
scope: "tool:bash"
---

Before presenting a changed file as ready:

1. Run the project formatter/checker when one exists, then run `git diff --check` against the relevant change range. Use `--cached` for staged changes and the PR base range for committed review changes.
2. Preserve the positions and order of unchanged imports when changing unrelated behavior; do not reorder them merely to tidy or alphabetize the file. Keep required new imports and intentional import changes. For new or intentionally changed imports, keep groups contiguous and separate each group with exactly one blank line, using documented project order or standard-library, third-party, then project-local order. Explicitly requested import cleanup and required project tooling remain valid exceptions; remove equivalent incidental moves across the reviewed diff.
3. Use exactly one blank line between top-level declarations and unrelated logical sibling blocks. Do not use consecutive blank lines. Keep tightly coupled statements and one logical import group together.
4. Keep whitespace-only edits scoped to the changed area. Apply [Scoped Readability Review](../docs/references/code-organization-reference.md#scoped-readability-review) to ordering/formatting changes against the accepted task and baseline; a touched file alone does not authorize cleanup. Requested normalization and binding conventions remain valid.
5. Keep asynchronous setup in the narrowest behavior-specific nested describe; do not put scenario-only setup in a broad test body or shared hook.

Follow [Guidance Precedence](../docs/references/guidance-precedence-reference.md#precedence): project-local guidance overrides these shared defaults; explicit user direction may override them within its authorized scope.

## Final Newlines

Changed non-empty text files must end with a newline, including YAML, JSON, and other configuration files. Preserve their existing LF or CRLF convention; do not reformat unrelated content or convert line endings. Empty files need no terminator. Respect documented project-specific format requirements through explicit, reasoned exceptions.

Neither formatter availability nor a successful `git diff --check` proves this invariant. Use the non-mutating [`marlens-rules:final-newlines` verification](../docs/references/rules-and-verifications-reference.md#final-newline-verification); unreadable required input is not a pass.

For a verbatim snapshot, distinguish repository normalization from live-state parity. If appending a newline only in Git would introduce bootstrap drift, report the conflict and have the owning workflow deliberately reconcile both sides within its authorization. Do not silently overwrite live configuration, weaken the check, or claim unchanged parity.

## Frontend Import Groups

For new or intentionally corrected frontend application imports, prefer utilities before API clients, API clients before composables, and composables before stores. Keep each group contiguous with exactly one blank line between groups, within the existing broad standard-library, third-party, and project-local ordering. Follow documented project overrides and preserve imported bindings and initialization-sensitive order; this preference does not authorize unrelated import churn.

When this grouping correction is requested during review, inspect every PR-modified file containing store imports within the requested scope, not only the highlighted example. Keep a test's primary subject under test in its own final group, separate from dependency-store imports; follow [Project-Root Imports and Paths](../docs/references/code-organization-reference.md#project-root-imports-and-paths). Do not sweep unrelated files or change state libraries or dependencies.

With these existing supported project-local imports:

```typescript
import { formatDate } from "@/utils/format-date"

import { api } from "@/api"

import { useWorkflow } from "@/composables/use-workflow"

import workflowStore from "@/stores/workflow-store"
```

Use the project's actual supported paths and exports; the example does not require a new alias, module, or import dependency.

## Explanatory Comment Sections

Treat a standalone explanatory comment and the code it introduces as one section: put one blank line before the comment and one after its associated code, while keeping the comment adjacent to the first statement. Separate surrounding sibling sections, not every statement; do not add padding at a block's start or end.

With existing preview and geometry operations:

```javascript
const preview = createInsertionPreview()

// The preview can enlarge the wrapper; measure the card itself.
const cardBounds = card.getBoundingClientRect()
const insertionIndex = findInsertionIndex(cardBounds, pointerY)

movePreview(preview, insertionIndex)
```

Prefer explanatory names over comments that repeat obvious behavior; retain rationale for non-obvious constraints. This layout does not require adding comments, removing useful comments, or sweeping unrelated whitespace. Preserve tooling directives, attached documentation, and language/framework requirements; do not separate them from the statements or declarations they govern.
