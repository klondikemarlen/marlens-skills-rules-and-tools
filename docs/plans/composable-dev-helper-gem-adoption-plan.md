# Composable Dev-Helper Gem Adoption Plan

## Purpose and Boundaries

This plan records a bounded route from this repository's existing Ruby `dev` command, config, shim, and plugin seams toward a separately versioned reusable gem. It does not assert that a gem, repository, package name, public API, or release exists. Do not add a placeholder dependency or migrate projects before a separately scoped implementation and release decision.

The desired outcome is reduced repeated generic command/adapter code while retaining small readable project entrypoints. The portability reference remains the canonical policy for ownership and review; this plan covers only future adoption and release proof.

## Candidate Reusable Components to Assess

A future implementation decision should assess (not assume) whether the released gem should own:

- generic command dispatch and unchanged argument forwarding for common development-container operations;
- loading ordinary project configuration and composing explicitly enabled extensions;
- reusable adapters with an actual cross-project contract, including their prerequisite checks and complete resource lifecycle;
- narrowly reusable environment or process-boundary behavior, preserving native Ruby values until shell serialization is required.

Keep this repository's `bin/dev` command semantics and existing functionality working until a separately released replacement is installed and proven. Avoid a new universal parser, compatibility framework, mandatory DSL, or second orchestration runtime.

## Project Extension Points and Ownership

Projects retain their thin `bin/dev` entrypoint, config, service/command names, Compose files, ports, credentials, deployment assumptions, local environment, and opt-in integrations. Existing config overrides, plugin registrations, and plugin files are the extension seams to evaluate first; a gem may expose composable components, but must not take ownership of application-specific commands or infrastructure.

Project maintainers own adoption choices and local configuration. The reusable artifact maintainer owns the generic contract, compatibility/release notes, published package, and artifact verification. This repository owns generic policy and instructions about the observed release; it does not become the gem runtime implementation or select its package/repository/version in advance.

## Bounded Adoption Sequence

1. **Select and scope separately:** identify repeated behavior across at least two projects, validate that behavior and extension boundaries, select maintainers/ownership, and approve a separately scoped implementation decision. Reject components whose generic contract is not evidenced.
2. **Implement and release elsewhere:** define and document the smallest real public API in the owning gem repository, preserve project extension points, publish a versioned artifact, and verify package metadata and installation from the released artifact. Do not substitute a local path or unreleased branch for release evidence.
3. **Prove a representative consumer:** in a disposable consumer checkout with normal dependency setup, install the observed release and record package name, repository, version, and artifact source. Run a generic happy-path command, one project-specific extension through the documented seam, and a missing-prerequisite case that fails explicitly. For each resource-owning adapter, exercise teardown/cleanup and confirm no owned process/container/resource remains.
4. **Adopt incrementally:** migrate only an explicitly opted-in project after its owner reviews the API and its own service/port/credential/integration assumptions. Remove superseded local duplicate behavior only after parity evidence. Keep non-adopting projects unchanged.
5. **Update this repository after evidence:** replace conditional language with links to the observed released artifact/version, document verified composition and migration steps, and update the portability reference. Do not publish an unverified package claim or make migration mandatory by documentation alone.

## Migration Boundaries

Migration is per project and separately reviewed. Preserve project-owned names, command choices, deployment assumptions, credentials, and opt-in integrations. Do not move application-specific Docker/editor/gateway implementation into shared code. Keep real integration prerequisites explicit: for example, an integration requiring a mounted Vite module must remain disabled on one-off container paths that do not supply that module. Resource-owning adapters must retain their actual lifecycle and safety contracts.

## Future Release/Install QA Gate

This gate is conditional and applies only once a real gem is selected and released. Record observed artifact identity and version; install that released artifact in a clean/disposable consumer using its documented installation flow; verify its installed version; then exercise (1) representative generic command success, (2) one project-specific extension, (3) explicit prerequisite failure, and (4) cleanup for every resource-owning adapter. Capture commands and observed outcomes. Until all applicable cases pass, keep existing tooling functional and do not claim adoption or release readiness.

## Evidence Basis

Travel Authorization PR #406 review recorded removal of local `--wait` normalization, fallback editor startup, custom `BUNDLE_GEMFILE` discovery, repeated editor bridge configuration, and duplicate environment-building indirection. The same review recorded observed detached startup/teardown, one-off environment values, and explicit missing-editor failure; a mounted Vite plugin on an ordinary one-off container produced an observed missing-module failure. These are evidence for the guidance and lifecycle boundary, not evidence that a generic gem exists. See [the dev-tooling portability reference](../references/dev-tooling-portability-reference.md#thin-entry-points-and-values) and the linked PR comments/discussion in that reference.
