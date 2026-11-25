# Route Template

Use for Express router wiring.

For child writes that require a parent, follow the paired create/update routes in [Nested Record Loading](controller-template.md#nested-record-loading).

## Template

```ts
import { Router } from "express"

import { createProject, getProject, listProjects, updateProject } from "./projects.controller"
import { requireAuth } from "../middleware/require-auth"

export const projectsRouter = Router()

projectsRouter.use(requireAuth)
projectsRouter.get("/", listProjects)
projectsRouter.post("/", createProject)
projectsRouter.get("/:projectId", getProject)
projectsRouter.patch("/:projectId", updateProject)
```

## Route-Specific Guards

For an archive list and restore endpoint, keep authentication router-wide and show the flag on each route it protects:

```ts
archivedProjectsRouter.use(requireAuth)
archivedProjectsRouter.get("/", requireFeatureMiddleware("projectArchive"), listArchivedProjects)
archivedProjectsRouter.post(
  "/:projectId/restore",
  requireFeatureMiddleware("projectArchive"),
  restoreProject
)
```

Repeat the short factory call, not its implementation, when separate instances behave identically. Preserve middleware order. Keep a binding when its name explains a policy, construction is nontrivial, or the routes must share state (for example, one rate limiter).

## Checklist

- [ ] Middleware order matches sibling routers.
- [ ] More specific routes come before param routes when they conflict.
- [ ] Route params use the project naming convention.
- [ ] Router is mounted/exported through the existing router tree.
