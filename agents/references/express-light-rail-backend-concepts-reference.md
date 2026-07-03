# Express Light Rail Backend Concepts Reference

Use with `agents/workflows/express-light-rail-backend-workflow.md` when centralizing Node.js + Express + TypeScript backend feature patterns.

## Rails

- **Route:** URL shape and middleware order.
- **Controller/handler:** request parsing, response status, response JSON, and `next(error)` handoff.
- **Policy/auth check:** access decision; default deny when unclear.
- **Service/use case:** reusable business rule, transaction, or multi-step mutation.
- **Serializer/presenter:** explicit response object.
- **Model/repository:** data access through the project’s existing ORM/query builder.
- **Factory/fixture:** minimal valid test data with unique values where required.

## Rules

Skip rails that the target project does not use. Centralized templates are starting points, not a mandate to add layers.

Controllers should not own business rules. Services should not own HTTP status codes. Serializers should not query the database. Policies should not mutate data.

## Safety Defaults

Validate input before persistence. Authorize before sensitive reads and all writes. Use the project transaction helper for multi-write changes. Keep response fields explicit so private columns, lazy associations, and ORM metadata do not become API surface.
