# Node Express API Workflow

Compatibility workflow for Node.js + Express API work.

For backend projects that use the shared route/controller/service/policy/serializer/model/test rails, follow the first available Express Light Rail workflow:

1. Local project: `docs/workflows/express-light-rail-backend-workflow.md`
2. Legacy local project: `agents/workflows/express-light-rail-backend-workflow.md` <!-- agent-guidance-audit: ignore backtick-path -->
3. Packaged fallback: [../express-light-rail/workflow.md](../express-light-rail/workflow.md) in this plugin (`skill://express-light-rail/workflow.md` in OMP)
Check candidate existence first (for example with glob). Read only the first existing local workflow file; if neither local workflow exists, read `skill://express-light-rail/workflow.md` directly. Do not read missing local paths or batch local candidates.

Use this workflow name when a prompt or installed skill still points at `node-express-api`; it intentionally delegates to the centralized Express Light Rail backend workflow instead of keeping a second pattern.

## Process

1. Read the first available Express Light Rail workflow listed above.
2. If the project has `docs/templates/backend/express-light-rail/`, read its `README.md`; otherwise use the packaged workflow and nearby live code.
3. Use only the focused rails the current backend slice needs.
4. Prefer project-local live code and templates when they are more specific.

## Output Contract

Use the Express Light Rail backend workflow output contract.
