# Route Template

Use for Express router wiring.

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

## Checklist

- [ ] Middleware order matches sibling routers.
- [ ] More specific routes come before param routes when they conflict.
- [ ] Route params use the project naming convention.
- [ ] Router is mounted/exported through the existing router tree.
