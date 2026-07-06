# Node Express API Workflow

Compatibility workflow for Node.js + Express API work.

For backend projects that use the shared route/controller/service/policy/serializer/model/test rails, follow the first available Express Light Rail workflow:

1. Local project: `agents/workflows/express-light-rail-backend-workflow.md`
2. Packaged fallback: `skill://express-light-rail/workflow.md`

Use this workflow name when a prompt or installed skill still points at `node-express-api`; it intentionally delegates to the centralized Express Light Rail backend workflow instead of keeping a second pattern.

## Process

1. Read the first available Express Light Rail workflow listed above.
2. If the project has `agents/templates/backend/express-light-rail/`, read its `README.md`; otherwise use the packaged workflow and nearby live code.
3. Use only the focused rails the current backend slice needs.
4. Prefer project-local live code and templates when they are more specific.

## Output Contract

Use the Express Light Rail backend workflow output contract.
