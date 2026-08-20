# Test Factory Template

Use for minimal valid backend test data. Adapt to the project’s existing factory helper.

## Template

```ts
let sequence = 0

export function buildProject(overrides: Partial<ProjectFactoryAttrs> = {}) {
  sequence += 1

  return {
    name: `Project ${sequence}`,
    ownerId: `user-${sequence}`,
    ...overrides,
  }
}

type ProjectFactoryAttrs = {
  name: string
  ownerId: string
}
```

## Checklist

- [ ] Uses the project’s real factory/build/create helper when one exists.
- [ ] Produces valid records by default.
- [ ] Keeps unique values sequence-based when the database requires uniqueness.
- [ ] Creates associations through existing association helpers instead of hand-wiring unrelated records.
