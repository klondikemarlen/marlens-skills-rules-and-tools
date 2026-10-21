# Factory Trait Workflow

1. Inspect the existing factory API and the project’s test TypeScript check.
2. Arrange persisted scenario records explicitly inside each test, even when multiple tests use identical attributes. Keep each scenario self-contained; do not move persisted scenario creation into shared `beforeEach` hooks. Environment setup and teardown, such as fake timers, may still use hooks.
3. Keep one-off setup literal in the test. For recurring persisted relationship setup, add an opt-in named builder trait to the owning Fishery-style factory. When component tests repeat complete API response entities, reuse or add a factory in the project's established frontend factory location and library, typed to the frontend API contract; keep scenario-specific overrides inline at each build call. Do not import backend model dependencies or mandate a factory library.
4. Keep relationship creation inside the trait; do not use per-test transient flags or `.afterCreate(...)` mutations to simulate a trait.
5. Use fixture-backed tests under their descriptive exported names; do not alias them to generic `test` or `it`. Inspect the active runner configuration before adding mock cleanup, rely on configured cleanup, and add local cleanup only for resources or state it does not cover. Preserve intentional mid-test restoration.
6. For dependency-bundle versus direct-subject imports, including the model-owned constant/enum exception, follow [Project-Root Imports and Paths](../../docs/references/code-organization-reference.md#project-root-imports-and-paths).
7. Run the focused test and the test TypeScript check.
