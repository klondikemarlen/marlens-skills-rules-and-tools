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

### API Surface Ordering

When editing barrel files, index files, or grouped API namespace surfaces, preserve the existing
grouping shape and alphabetize entries within each group:

- namespace imports, such as `import * as Foo from "./foo"`
- named exports, such as `export { Foo } from "./foo"`
- default export object keys, such as `export default { Foo, Bar }`

Do not collapse intentional grouping comments unless the project asks for that cleanup. Apply this
only to API surface files, not ordinary import blocks in every source file.

### Documentation Placement

- Put shared, cross-agent rules here.
- Put project-wide agent conventions in [AGENTS.md](AGENTS.md).
- Put commit guidance in [COMMITTING.md](COMMITTING.md).
- Put detailed or tool-specific guidance in agent-specific or workflow-specific documents under
  `agents/`.

## Agent-Specific Documents

- Codex-specific command approval guidance: [agents/codex-rules-guide.md](agents/codex-rules-guide.md)
