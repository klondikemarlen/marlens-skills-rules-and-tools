# Development Tooling Portability Reference

Use when deciding whether a project-local executable helper belongs in this shared package.

## Default

Keep binaries project-local unless the same command contract is already useful across multiple repositories.

## Good Shared-Tool Candidates

- Dependency-light scripts that use standard CLIs or package dependencies already declared by this repo.
- Commands with stable inputs and outputs across projects.
- Helpers that do not know project service names, ports, cloud targets, database names, or issue tracker project keys.
- Read-only inspection helpers, formatters, or text transformations with low operational risk.

## Keep Project-Local

- `bin/dev` wrappers that choose Docker Compose files, service names, profiles, ports, databases, or local environment variables.
- Deploy, restart, release, or cloud-operation helpers tied to a specific infrastructure account or role.
- Jira/GitHub helpers that embed project keys, labels, boards, milestones, or team conventions.
- Editor bridges or API waiters that assume a particular app server, route shape, or authentication setup.
- Scripts whose failure could mutate production or non-test data.

## Import Checklist

Before moving a binary into this package:

1. Identify at least two repositories that can call it with the same documented contract.
2. Remove project names, service names, secret names, cloud targets, ports, and issue tracker IDs.
3. Define safety boundaries: read-only vs write, local vs remote, production blocked by default.
4. Add focused verification for the command's contract.
5. Document when a project should keep its own wrapper instead.

## Better First Step

When a helper is not portable yet, import the reusable workflow or reference pattern instead of the executable. Shared guidance is cheaper to maintain than a binary with hidden environment assumptions.
