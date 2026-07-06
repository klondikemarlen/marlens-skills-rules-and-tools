# Dev Config Template

Use this when a project wants to customize the shared `marlens-dev` wrapper without forking the wrapper itself.

Create `dev.config.mjs` in the project root:

```javascript
export default {
  compose: ["docker", "compose"],
  services: {
    api: "api",
    web: "web",
    db: "db",
  },
  commands: {
    apiShell: ["sh"],
    webShell: ["sh"],
    apiTest: ["npm", "run", "test"],
    webTest: ["npm", "run", "test"],
    apiCheckTypes: ["npm", "run", "check-types"],
    webCheckTypes: ["npm", "run", "check-types"],
  },
}
```

## Common Overrides

### Different Service Names

```javascript
export default {
  services: {
    api: "backend",
    web: "frontend",
    db: "postgres",
  },
}
```

### Test Runner Flags

```javascript
export default {
  commands: {
    apiTest: ["npm", "run", "test", "--"],
    webTest: ["npm", "run", "test", "--"],
  },
}
```

### Alternate Compose Command

```javascript
export default {
  compose: ["docker", "compose", "--profile", "dev"],
}
```

## Rule

Keep project-specific ports, cloud targets, database names, credentials, and issue tracker IDs in local config or local wrappers. Do not add them to the shared wrapper.
