# Controller Template

Use for thin Express handlers that delegate auth, domain work, and serialization.

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
    return this.response.status(403).json({ message: "Not authorized" })
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

## Checklist

- [ ] Handler reads auth context from the project-standard location.
- [ ] Missing records return 404.
- [ ] Unauthorized access returns 403 before mutation.
- [ ] Validation/attribute picking happens before service calls.
- [ ] Errors flow through the project error middleware.
