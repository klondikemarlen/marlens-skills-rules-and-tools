# Agent Rules

Shared guidance for AI agents working in this repository.

This file is intentionally agent-agnostic. Keep repo-wide decision rules here, and move
tool-specific guidance into agent-specific documents when needed.

## Scope

Use this file for:

- repo-wide workflow expectations
- cross-agent decision rules
- general guidance about how to work in this codebase

Do not overload this file with tool-specific mechanics. If guidance depends on a specific agent,
CLI, sandbox model, or approval system, keep that in an agent-specific document and link to it
from here.

If this file grows too large, keep it focused on shared rules and add links out to more specific
documents.

## Shared Rules

### Command Approval Rules

When working with command approval systems that support reusable command prefix allowlists, prefer
durable prefix patterns over one-off command strings.

- Prefer reusable prefixes such as `["git", "commit", "-m"]` over a single hard-coded commit
  message.
- When using command wrappers such as `rtk`, remember that wrapped commands are separate command
  trees from the underlying command.
- Do not approve overly broad wrapper prefixes by themselves when a narrower prefix is possible.

### Workflow Guidance

- Prefer small, logically isolated commits.
- Keep pull requests scoped to one story slice or one coherent integration step.
- When a branch contains multiple meaningful slices, explain the current slice clearly in the PR
  context instead of treating the whole branch as one undifferentiated change.

### Evidence-First Verification

Start from Gold before judging implementation quality: name the behavior, invariant, or regression risk that the work must prove.

Report verification outcomes with this vocabulary:

- `PASS`: observed evidence proves the claimed behavior or invariant.
- `FAIL`: observed evidence disproves the claim or shows a concrete regression or bug.
- `BLOCKED`: required evidence is missing, unreachable, or cannot be run.

### Plain Language

Use plain terms in user-facing summaries, PR bodies, and final reports. Define domain terms once when they are useful; otherwise choose clearer phrases so maintainers and reviewers do not need glossary context.

### API Surface Ordering

When editing barrel files, index files, or grouped API namespace surfaces, preserve the existing
grouping shape and alphabetize entries within each group:

- namespace imports, such as `import * as Foo from "./foo"`
- named exports, such as `export { Foo } from "./foo"`
- default export object keys, such as `export default { Foo, Bar }`

Do not collapse intentional grouping comments unless the project asks for that cleanup. Apply this
only to API surface files, not ordinary import blocks in every source file.

### Documentation Placement

Use [docs/references/guidance-precedence-reference.md](docs/references/guidance-precedence-reference.md) for the detailed placement and precedence policy. This file keeps only shared, agent-agnostic rules that apply while working in this repository.

## Agent-Specific Documents

- Codex-specific command approval guidance: [docs/codex-rules-guide.md](docs/codex-rules-guide.md)
