<!-- Derived from agents/workflows/express-light-rail-backend-workflow.md. Edit that file, then run npm run sync:skill-workflows. -->

# Express Light Rail Backend Workflow

Use when adding or changing a backend feature in a Node.js + Express + TypeScript project that follows the light-rail shape: route, controller/handler, policy/auth check, service/use case, serializer, model/data access, and focused tests.

## Intent

**WHY this workflow exists:** Several projects use the same backend feature rails. Centralizing the shape avoids re-copying WRAP-specific docs while keeping the workflow generic enough for Express projects with different ORMs, auth middleware, and test factories.

**WHAT this workflow produces:** A scoped backend slice wired through existing project rails, with explicit auth, validation, response shape, persistence, and verification.

**Decision Rules:**

- Project-local docs, wrappers, model conventions, auth context, error middleware, and factory helpers win.
- Use `agents/templates/backend/express-light-rail/` as the starting point when the project has no closer local template.
- Keep controllers thin: request parsing, status codes, and response shape only.
- Put reusable or multi-step domain work in a service/use-case. Do not create a service for a trivial read if sibling endpoints keep that inline.
- Authorize and validate before mutation. Fail closed when a policy is unclear.
- Serialize explicit fields. Do not leak raw ORM/model objects unless that is already the project contract.
- Use existing dependencies: ORM/query builder, transaction helper, logger, validation, and test factories. Do not add a new framework for the template.

## Process

1. Read the nearest live backend slice for the same area: route, controller/handler, service/use-case, policy/auth, serializer, model, and tests.
2. Pick only the templates needed from `agents/templates/backend/express-light-rail/`.
3. Define the API contract: method, path, params, query/body fields, status codes, response JSON, and error JSON.
4. Add validation at the request boundary using the project’s existing validation style.
5. Add authorization before sensitive reads and all writes.
6. Implement persistence through the project’s existing model/repository/ORM shape.
7. Serialize the response through the project’s response-shaping pattern.
8. Add the smallest runnable test that proves the changed success path and the highest-risk edge.

## Output Contract

```text
Backend slice: <METHOD path or feature name>
Templates used: <express-light-rail files used>
Contract: <request/response/status summary>
Verification: <targeted test or QA command>
Residual risk: <missing external dependency, migration, or none>
```
