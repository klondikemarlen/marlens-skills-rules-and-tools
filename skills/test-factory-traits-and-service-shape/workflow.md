# Factory Trait Workflow

1. Inspect the existing factory API and the project’s test TypeScript check.
2. Keep a one-off setup literal in the test; when persisted relationship setup recurs, add an opt-in named builder trait to the owning Fishery-style factory.
3. Keep the trait self-contained, preserving ordinary factory creation.
4. Run the focused test and the test TypeScript check.
