# Controller Template

Use for thin Express handlers that delegate auth, domain work, and serialization.

Authorization denials name the attempted action and resource: list/view for reads, create/update/delete for mutations. For example, say "You are not authorized to list invoices for this travel request", not "manage invoices"; an update or delete denial says "update this project" or "delete this project". Include useful parent context only when it is safe to disclose. Keep the established policy checks, status codes, and concealment contract: do not replace a deliberate 404 or generic denial with wording that reveals resource existence, private identifiers, or internal policy details.

## Template

```ts
import type { Request, Response, NextFunction } from "express"

import { canCreateProject, canReadProject } from "./projects.policy"
import { createProjectForUser, findProjectForUser, listProjectsForUser } from "./projects.service"
import { serializeProject } from "./projects.serializer"

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = currentUserIdFrom(res)
    const projects = await listProjectsForUser(currentUserId, req.query)

    res.json({ projects: projects.map(serializeProject) })
  } catch (error) {
    next(error)
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = currentUserIdFrom(res)
    const project = await findProjectForUser(currentUserId, req.params.projectId)

    if (!project) {
      res.status(404).json({ message: "Project not found" })
      return
    }

    if (!canReadProject(currentUserId, project)) {
      res.status(403).json({ message: "You are not authorized to view this project" })
      return
    }

    res.json({ project: serializeProject(project) })
  } catch (error) {
    next(error)
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = currentUserIdFrom(res)

    if (!canCreateProject(currentUserId)) {
      res.status(403).json({ message: "You are not authorized to create projects" })
      return
    }

    const project = await createProjectForUser(currentUserId, pickCreateProjectAttributes(req.body))

    res.status(201).json({ project: serializeProject(project) })
  } catch (error) {
    next(error)
  }
}

function pickCreateProjectAttributes(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? "").trim(),
  }
}

function currentUserIdFrom(res: Response) {
  // Replace with the project’s auth context, e.g. res.locals.user.id.
  return String(res.locals.currentUserId)
}
```

## Controller-Local Record Loading

When the project's controller architecture uses named single-resource loaders, keep the awaited local binding and HTTP decisions in the public action. The following class-controller excerpt assumes the existing `Workflow`, access association, request, auth context, and policy APIs:

```typescript
async show() {
  const workflow = await this.loadWorkflow()
  if (workflow === null) {
    return this.response.status(404).json({ message: "Workflow not found" })
  }
  if (!this.policy.canRead(workflow)) {
    return this.response.status(403).json({ message: "You are not authorized to view this workflow" })
  }

  return this.response.json({ workflow: serializeWorkflow(workflow) })
}

private async loadWorkflow(): Promise<Workflow | null> {
  return Workflow.findByPk(this.request.params.workflowId, {
    include: ["workflowAccessByUsers"],
  })
}
```

Use the existing loader's actual predicates and required preloads, not a broader query copied from this example. A functional handler may use the equivalent named local loader; do not introduce a class, service, repository layer, or base controller just for this shape. Verify missing/forbidden/success cases and association-dependent authorization; ordinary collection reads may remain controller-owned.

### Nested Record Loading

When the action already loads a parent model, pass that model explicitly to the nested child loader and scope the lookup with its identifier. Keep the child identifier, other visibility predicates, and required preloads. Do not load a parent solely to replace a valid ID-taking API.

This class-controller excerpt assumes the project's existing `loadWorkflow`, `Workflow`, `WorkflowStep`, `workflowStepPlayers` association, resource policy, and serializer. The resource policy retains its existing parent-access checks:

```typescript
async show() {
  const workflow = await this.loadWorkflow()
  if (workflow === null) {
    return this.response.status(404).json({ message: "Workflow not found" })
  }

  const workflowStep = await this.loadWorkflowStep(workflow)
  if (workflowStep === null) {
    return this.response.status(404).json({ message: "Workflow step not found" })
  }

  if (!this.policy.canRead(workflowStep)) {
    return this.response.status(403).json({ message: "You are not authorized to view this workflow step in this workflow" })
  }

  return this.response.json({ workflowStep: serializeWorkflowStep(workflowStep) })
}

private async loadWorkflowStep(workflow: Workflow): Promise<WorkflowStep | null> {
  return WorkflowStep.findOne({
    where: {
      id: this.request.params.workflowStepId,
      workflowId: workflow.id,
    },
    include: ["workflowStepPlayers"],
  })
}
```

Keep missing-record and authorization responses in the action. Verify successful access, missing/forbidden responses, and rejection of a child belonging to another parent. Required preloads must still support the actual policy and serializer.

## Resource Imports and Query Guards

For a controller's own services, use direct named imports from the deepest supported matching resource entry point. For example, an invoice controller uses `import { CreateService, UpdateService } from "@/services/travel-desk-invoices"` when those exports exist, rather than importing the root `TravelDeskInvoices` namespace. Other-domain collaborators and service-to-service dependencies retain [Project-Root Imports and Paths](../../../references/code-organization-reference.md#project-root-imports-and-paths); do not add barrels or bypass public exports for this shape.

When the accepted controller contract forwards a request value to an existing service/model boundary, pass it unchanged. Do not add defensive type or locator-grammar checks merely because the value comes from a request, or move the same unnecessary checks into the service. This example assumes `LookupService` is the existing owner, accepts the established request-query type, and already uses safe query bindings; malformed values fail naturally in its downstream operation and reach the existing error middleware:

```typescript
export async function lookupFlight(req: Request, res: Response, next: NextFunction) {
  try {
    const { recordLocator } = req.query
    const flight = await LookupService.perform(recordLocator)

    res.json({ flight: serializeFlight(flight) })
  } catch (error) {
    next(error)
  }
}
```

Retain independently required request validation, domain invariants, authorization, attribute filtering, and parameterized queries with their existing owners. If the actual API contract explicitly rejects non-string values with 400, preserve that contract and its established predicate semantics; predicate selection does not itself require a guard. Do not coerce or assert a request value into compatibility, swallow downstream failures, or add a replacement downstream guard to keep a controller thin.

## Checklist

- [ ] Handler reads auth context from the project-standard location.
- [ ] Missing/forbidden responses preserve the project's status and concealment contracts.
- [ ] Authorization precedes sensitive reads and mutations; denial wording names the action/resource with only safe context.
- [ ] Required validation/attribute filtering retains its existing owner; no unnecessary type/grammar guard is added or relocated.
- [ ] Request values follow the accepted service/model handoff with safe query bindings; failures flow through the project error middleware.
