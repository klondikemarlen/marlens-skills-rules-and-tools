# Express Light Rail Backend Templates

Use these for Node.js + Express + TypeScript backend slices that follow a light route/controller/service/policy/serializer/model/test rail.

These templates are centralized starting points. Project-local templates and live sibling code win.

## Templates

- `route-template.md` - Express router wiring and middleware order.
- `controller-template.md` - thin request/response handlers.
- `service-template.md` - domain work and transaction boundary.
- `policy-template.md` - fail-closed authorization shape.
- `serializer-template.md` - explicit response objects.
- `model-template.md` - ORM-neutral model/repository checklist.
- `test-factory-template.md` - minimal valid test data shape.

## Use

1. Read the nearest live backend slice first.
2. Copy only the rails the project already uses or the feature actually needs.
3. Replace placeholders and project hooks: auth context, validation errors, logger, ORM, transaction helper, and test factory helper.
4. Run the smallest backend test that proves the API contract.
