<!-- Derived from agents/workflows/node-express-api-workflow.md. Edit that file, then run npm run sync:skill-workflows. -->

# Node Express API Workflow

Compatibility workflow for Node.js + Express API work.

For backend projects that use the shared route/controller/service/policy/serializer/model/test rails, follow `express-light-rail-backend-workflow.md` and the templates under `agents/templates/backend/express-light-rail/`.

Use this workflow name when a prompt or installed skill still points at `node-express-api`; it intentionally delegates to the centralized Express Light Rail backend workflow instead of keeping a second pattern.

## Process

1. Read `express-light-rail-backend-workflow.md` from the same workflow directory. When invoked through `skill://node-express-api`, read `skill://node-express-api/agents/workflows/express-light-rail-backend-workflow.md`.
2. Read `agents/templates/backend/express-light-rail/README.md`.
3. Use only the focused templates needed for the current backend slice.
4. Prefer project-local live code and templates when they are more specific.

## Output Contract

Use the Express Light Rail backend workflow output contract.
