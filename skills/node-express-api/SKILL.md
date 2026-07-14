---
name: node-express-api
description: Compatibility alias for Node.js + Express API work; delegates to the Express Light Rail backend workflow and templates.
---

# Node Express API

Read the first available workflow:

1. Local project: `docs/workflows/node-express-api-workflow.md`
2. Legacy local project: `agents/workflows/node-express-api-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [workflow.md](workflow.md) in this skill directory (`skill://node-express-api/workflow.md` in OMP)
Check/read candidates sequentially. If a local candidate is missing or a read returns Path not found, continue to the next candidate; do not batch local paths. If neither local workflow path exists, read `skill://node-express-api/workflow.md` directly.

Preferred local `docs/workflows` files win; legacy `agents/workflows` overrides remain supported. This skill is a thin alias; the workflow file is authoritative. <!-- agent-guidance-audit: ignore backtick-path -->
