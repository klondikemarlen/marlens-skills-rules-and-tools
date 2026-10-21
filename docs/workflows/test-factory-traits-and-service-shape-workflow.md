# Test Factory Traits and Service Shape Workflow

Use when TypeScript tests need reusable persisted relationship setup or repeated non-persisted API entities, including frontend component fixtures.

1. Read the project’s factory API and test TypeScript command.
2. Arrange persisted scenario records explicitly inside each test, even when multiple tests use identical attributes. Keep each scenario self-contained; do not move persisted scenario creation into shared `beforeEach` hooks. Environment setup and teardown, such as fake timers, may still use hooks.
3. Keep one-off setup literal in the test. For recurring persisted relationship setup, add a named opt-in builder trait to the owning Fishery-style factory; the trait must not change ordinary factory creation.
4. When component tests repeat complete API response entities, reuse or add a factory in the project's established frontend factory location and library, typed to the frontend API contract. Keep scenario-specific overrides inline at each build call; keep one-off inputs literal when no reusable entity shape is needed. Do not import backend model dependencies or mandate a factory library.
5. Keep relationship creation inside the trait; do not use per-test transient flags or `.afterCreate(...)` mutations to simulate a trait.
6. Use fixture-backed tests under their descriptive exported names; do not alias them to generic `test` or `it`. Inspect the active runner configuration before adding mock cleanup, rely on configured cleanup, and add local cleanup only for resources or state it does not cover. Preserve intentional mid-test restoration.
7. For dependency-bundle versus direct-subject imports, including the model-owned constant/enum exception, follow [Project-Root Imports and Paths](../references/code-organization-reference.md#project-root-imports-and-paths).
8. Run the focused test and test TypeScript check.
