# Test Factory Traits and Service Shape Workflow

Use when TypeScript tests need recurring persisted relationship setup.

1. Read the project’s factory API and test TypeScript command.
2. Keep one-off setup literal in the test. For recurring setup, add a named opt-in builder trait to the owning Fishery-style factory.
3. Keep relationship creation inside the trait; do not use per-test transient flags or `.afterCreate(...)` mutations to simulate a trait.
4. Run the focused test and test TypeScript check.
