# Code Organization Reference

Use this when a change needs clearer names, files, modules, service boundaries, data handoffs, or dependency direction. This reference is intentionally stack-neutral: project-local architecture and naming conventions still win.

## Core Idea

Code organization is not more folders, more layers, or more pattern names. It is arranging names, files, modules, boundaries, and dependencies so the next maintainer can answer locally and quickly:

1. What domain action or user-visible operation is happening?
2. What invariant, side effect, or external dependency is owned here?
3. What values cross this boundary, and were they parsed or validated once?
4. What changes together, and what should remain isolated?
5. Which dependencies point inward or outward, and are there cycles?
6. Does this abstraction solve a current problem, or only prepare for an imagined future?

Use the smallest structure that makes ownership, change axes, data handoffs, and volatile decisions obvious.

## Organization Tests

Before adding a helper, service, class, repository, value object, adapter, folder, module, interface, factory, or registry, require at least one current reason:

- It protects a domain invariant.
- It names a user-visible or domain action.
- It isolates an external dependency or volatile implementation detail.
- It removes real duplication without hiding behavior.
- It keeps values crossing a boundary explicit and validated.
- It groups code that changes together and separates code that changes independently.
- It keeps domain behavior findable through intention-revealing public APIs and filenames.
- It preserves one-way dependencies and avoids circular imports or cross-calling services.
- It makes review safer by making side effects, transactions, permissions, or platform branches visible.

If none apply, inline it, delete it, or follow the existing local pattern.

## Module Decomposition

A useful module, file, or folder boundary should satisfy at least one of these checks:

- **Changes together:** files in the module usually change for the same product or domain reason. A normal feature change should not require unrelated directories just to follow one concept.
- **Hides volatility:** the module hides a decision likely to change, such as an external API, storage mechanism, parser format, platform branch, or authorization rule, behind the smallest useful public surface.
- **Keeps domain behavior findable:** exported names and filenames reveal ownership, such as `approveTravelAuthorization` or `eligibleRecipientsForDigest`, instead of generic mechanism names such as `manager`, `processor`, `helper`, or `utils`.
- **Preserves one-way dependencies:** outer or infrastructure code may depend on inner domain/application contracts, but domain decisions should not import framework clients, HTTP requests, CLI subprocess wrappers, or database plumbing unless the local architecture explicitly does that.
- **Avoids cycles:** a split that creates circular imports, mutual knowledge, or cross-calling services is worse than keeping the code together.
- **Keeps a small public API:** callers get a few intention-revealing operations; they do not reach through the module to manipulate internals.

Co-locate code until there is a real change axis, invariant boundary, duplicated behavior, or volatile dependency to isolate.

## Project-Root Imports and Paths

Prefer configured project-root imports for dependencies across features or modules when they make the dependency direction clearer than `../../..` traversal. The root must be a project-defined source root or alias that every supported compiler, test runner, bundler, and editor/language server resolves identically.

Keep a short relative import for an immediately co-located sibling when it better expresses that the files form one local unit. Use the package name—not a project-root alias—for public package/library imports. Do not use a root import for external, generated, or vendor code, and do not introduce one where the language/toolchain lacks supported project-root resolution or an established local convention intentionally differs.

For runtime file paths, define one application/source root and derive paths from it instead of traversing from each caller. In Ruby/Rails, use framework-managed autoloaded constants instead of relative `require` traversal, and use `Rails.root.join` for application-root file paths. Do not treat a runtime path constant as module-resolution configuration: each environment still needs its own supported import resolver.

Before converting imports, confirm the existing module-resolution configuration and exercise the affected build and test path. Treat a deep relative path as a review signal, not an automatic rewrite: preserve a relative path when moving the dependency would be clearer than widening module visibility. Do not bulk-rewrite imports solely for style.
When the project adopts this convention, record it in project-local guidance. Configure an already-installed import-style lint rule only when it can enforce the same resolved root; do not add a dependency merely to police import spelling.


## State Names and Dependency-Local Ordering

Name state for the domain fact or lifecycle it represents, not the consuming control or callsite. Prefer `isLoadingNotificationPreferences` over `isLoadingGlobalSwitches` when the state reflects the notification-preferences request.

Keep each query or composable result adjacent to its direct derived state. Put broader coordination state and action handlers after their inputs, and lower-priority shared helpers further down.

This is a review heuristic, not an alphabetical rule. Preserve an existing stronger project convention when one exists.

## UI Navigation Handler Names

Name a UI router-navigation handler after its destination and effect. Prefer `goToTemplateWorkflowsPage` or `goToCategoryWorkflowNewPage`; avoid trigger-oriented (`select...`, `open...`) or imprecise names that hide the route change. An established project convention wins.

## Boundary Vocabulary

Use these terms as review vocabulary, not as mandatory layers:

- **Controller/request boundary:** parses request context, status codes, UI route events, or command-line input and delegates domain work.
- **Application service/use case:** names one user-visible or operator-visible action and coordinates authorization, transactions, persistence, external calls, and return values for that action.
- **Domain invariant:** a rule that must stay true for the domain, regardless of UI, transport, database, or external API shape.
- **Value object/schema/parser:** a small identity-free value or boundary parser used when values carry invariants, repeated validation, equality semantics, or cross-boundary meaning.
- **Repository/model/query helper:** persistence access through the project’s existing ORM, query builder, model, or repository convention. Add a repository only when it removes real duplicate query construction or isolates a real mapping boundary.
- **Adapter/gateway:** a small boundary around an external system, platform branch, CLI, HTTP client, SDK, filesystem, or clock.
- **Aggregate/transaction boundary:** the domain cluster whose invariant must be protected together. Do not hide transaction ownership in a generic helper name.
- **Module public API:** the exported names a caller can use. They should reveal what the module owns.

## Service Orchestration Readability

A service or use-case top-level method should read like orchestration: guard, derive domain-relevant values, perform side effects, and return the result. Extraction helps only when a named helper makes one step more visible.

Prefer this shape:

```text
perform():
  return if notification disabled
  recipients = recipientsEligibleForDelivery()
  notification = createInAppNotification(recipients)
  enqueueEmailDelivery(recipients)
  return notification
```

This is useful because each helper names a domain step and the service action remains visible.

Avoid this shape:

```text
perform():
  data = loadEverything()
  processList(data)
  finish(data)
```

This is worse because the helper names hide queries, decisions, side effects, and ownership.

Extraction is warranted when the helper name captures a cohesive domain decision or side-effect step, such as `recipientsEligibleForEmailDelivery`, `deliverInAppNotifications`, or `shouldNotifyRecipient`.

Extraction is not warranted for a trivial one-line transform, direct delegation, a short branch that is clearer inline, or a helper that hides unrelated database queries, aggregate boundaries, transactions, or permissions.

## Private Helper Inputs

Prefer a private functional helper that accepts every value it uses as an explicit parameter when practical. A helper that accepts one model but reaches through `this` for another hidden dependency obscures its real inputs and makes the behavior harder to reason about or test.

Pass values explicitly when the caller already has them or the helper's result can be described from its arguments. Keep reads through `this` when the helper is inherently bound to object state, such as coordinating the instance lifecycle, mutating owned state, or using a cache whose identity belongs to the object. Do not add artificial parameters that merely restate that bound identity.

## Pattern Selection

Use patterns only when they earn their keep:

- **Value object:** use when values have invariants, behavior, identity-free equality, repeated cross-boundary use, or enough fields that positional order is error-prone. Do not wrap one primitive just to look like DDD.
- **Direct locals / tuple-style handoff:** use when a small, ordered, immediately consumed handoff has clear call-site names.
- **Repository:** use when query construction is duplicated, heavy, or intentionally isolated by the local architecture. Do not add a repository around a clear existing ORM/model convention just because a pattern list says so.
- **Adapter/gateway:** use when external details would otherwise leak into domain/application code or when a volatile platform/API branch needs one owner.
- **Interface/factory/registry:** use when there are multiple real implementations or one volatile external boundary. Delete one-implementation abstractions that only prepare for imagined future variation.
- **Folder/module split:** use when it groups code that changes together or hides volatility. Do not split files by technical phase if every feature change crosses all of those folders.

## Review Smells and Fixes

- Context/request object passed everywhere -> pass the minimum named values each lower operation needs.
- Primitive values repeatedly parsed or validated -> introduce a schema, parser, or value object at the boundary.
- Service method hides the action sequence behind collection plumbing -> extract named domain helpers only for cohesive decisions.
- Controller performs multi-step domain mutation -> extract a service/use case when reuse, risk, transaction ownership, or sibling conventions justify it.
- Persistence query logic is duplicated across services -> use the existing model/query/repository convention; add a repository only when duplication or mapping boundaries are real.
- Adapter/client details leak into domain or application logic -> hide them behind a small function/client that accepts domain-shaped values.
- Generic `manager`, `processor`, `helper`, or `utils` names -> rename or split by domain action.
- One-implementation interface, factory, or registry -> delete unless it isolates a real external dependency or current second target.
- Folder split mirrors technical phases but every change crosses all folders -> co-locate by feature/domain or follow the local convention.
- New folders/services/repositories leave request/context bags, cycles, or cross-module side effects intact -> simplify the dependency graph before adding more pattern names.

## Non-Goals

Do not prescribe full Clean Architecture, DDD, hexagonal, onion, Rails, or Express layering for every repo. Do not add framework or dependency recommendations. Do not copy downstream project conventions into shared guidance. Do not cargo-cult service, repository, or value-object names while leaving tangled dependencies intact.

## Sources

- Fowler, Service Layer: https://martinfowler.com/eaaCatalog/serviceLayer.html
- Fowler, Value Object: https://martinfowler.com/eaaCatalog/valueObject.html
- Fowler, Repository: https://martinfowler.com/eaaCatalog/repository.html
- Fowler, DDD Aggregate: https://martinfowler.com/bliki/DDD_Aggregate.html
- Parnas, modular decomposition: https://dl.acm.org/doi/10.1145/361598.361623
