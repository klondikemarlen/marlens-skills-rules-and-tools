# TypeScript Runtime Entrypoints Verifier Reference

`marlens-rules:typescript-runtime-entrypoints` runs finite, repository-owned commands that use the project's actual lazy TypeScript compiler mode. It is a verification entrypoint, not a service launcher and never accepts a shell command string.

## Configuration

The verifier discovers `package.json` scripts that use `ts-node`, `ts-node-dev`, `tsx`, `tsimp`, or `swc-node`. If it finds one, configure explicit command arrays in `.marlens-verifications.json`; each must begin with a tracked, executable, project-relative wrapper such as `./bin/dev`, and executes without a shell from the repository root.

```json
{
  "typescriptRuntimeEntrypoints": {
    "tsconfig": "api/tsconfig.json",
    "timeoutMs": 30000,
    "commands": [
      {
        "name": "API runtime compile",
        "command": ["./bin/dev", "api", "npm", "run", "compile:runtime"]
      }
    ],
    "fullTypecheck": ["./bin/dev", "api", "npm", "run", "typecheck"],
    "declarations": [
      {
        "path": "api/@types/request-signal/index.d.ts",
        "kind": "global"
      },
      {
        "path": "api/src/middlewares/request-context.ts",
        "kind": "local"
      }
    ]
  }
}
```

`commands` and `fullTypecheck` must be finite compile or smoke commands that begin with a tracked project wrapper. Do not configure a persistent server, watcher, shell fragment, generated command string, or arbitrary executable.

## Declaration Ownership

A `global` declaration must be package-shaped under the configured `compilerOptions.typeRoots`: `<typeRoot>/<package>/index.d.ts` or `<typeRoot>/@scope/<package>/index.d.ts`. The verifier accepts custom type roots without a `types` whitelist.

A `local` declaration is an imported local or intersection type owned by its module. Do not convert a module-owned lifecycle contract into a global augmentation merely to satisfy this verifier.

When a configured runtime command fails while `fullTypecheck` passes, the verifier reports the package-shaped global declaration as a likely lazy-runtime loading mismatch. A side-effect import that only forces a configured declaration to load fails as a likely workaround.

Use `kind: "ambient"` only to diagnose a legacy declaration included by full-project `tsc` but missed by the lazy runtime. A runtime failure with a passing `fullTypecheck` reports that mismatch; correct it by using one of the global or local ownership forms above.

## Scope and Limits

- The verifier invokes only package-owned `.mjs` code and argv arrays beginning with tracked project wrappers.
- It preserves Docker and service configuration by running the repository's finite wrapper command rather than reassembling compiler flags.
- It bounds each command with `timeoutMs` and does not start persistent services.
- Set `typescriptRuntimeEntrypoints` to `false` only to opt out explicitly.
