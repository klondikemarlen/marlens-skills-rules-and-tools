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

    const serializedProjects = projects.map(serializeProject)

    res.json({ projects: serializedProjects })
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

    const serializedProject = serializeProject(project)

    res.json({ project: serializedProject })
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

    const createdResponse = res.status(201)
    const serializedProject = serializeProject(project)

    createdResponse.json({ project: serializedProject })
  } catch (error) {
    next(error)
  }
}

function pickCreateProjectAttributes(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim()

  return {
    name,
  }
}

function currentUserIdFrom(res: Response) {
  // Replace with the project’s auth context, e.g. res.locals.user.id.
  return String(res.locals.currentUserId)
}
```

## Controller Test Shape

For class-controller suites, retain the outer source-path scope, use the bare class name, and check the action/verb/route against production routing:

```typescript
describe("api/controllers/downloads/flight-reconciliations-controller.ts", () => {
  describe("FlightReconciliationsController", () => {
    describe("#create - POST - /api/downloads/flight-reconciliations", () => {
      // Each test arranges its own inputs and asserts its HTTP result.
    })
  })
})
```

Both hyphen separators, with surrounding spaces, are required. Functional handler tests retain their actual subject naming; do not invent a controller class. Keep status first and complete body assertions direct, with independent persistence outcomes in separate focused tests. Follow [Structured Controller Query Inputs](../../../references/code-organization-reference.md#structured-controller-query-inputs) for nested scenario data and the native-versus-existing-serializer handoff, and [Project-Root Imports and Paths](../../../references/code-organization-reference.md#project-root-imports-and-paths) for actual subject imports. Preserve project-local overrides and genuine raw-wire tests.

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

  const serializedWorkflow = serializeWorkflow(workflow)

  return this.response.json({ workflow: serializedWorkflow })
}

private async loadWorkflow(): Promise<Workflow | null> {
  return Workflow.findByPk(this.request.params.workflowId, {
    include: ["workflowAccessByUsers"],
  })
}
```

Use the existing loader's actual predicates and required preloads, not a broader query copied from this example. A functional handler may use the equivalent named local loader; do not introduce a class, service, repository layer, or base controller just for this shape. Verify missing/forbidden/success cases and association-dependent authorization; ordinary collection reads may remain controller-owned.

For Sequelize response preloads, apply [Contextual Association Loading](../../../references/express-light-rail-backend-concepts-reference.md#sequelize-contextual-association-loading): a primary-key detail lookup normally uses a joined include with any deterministic child ordering at the query top level, without ordering the sole parent. A paginated has-many list may instead use `separate: true`, with child order inside the include and independent parent sorting/pagination. Use the [copyable single-record and list query shapes](../express-sequelize-crud/resource-rail-template.md#optional-has-many-response-loading) only when the response needs that association; retain the loader's policy/parent constraints, transaction context, and existing association/response contracts. Do not invent ordering fields for the access preloads shown here.

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

  const serializedWorkflowStep = serializeWorkflowStep(workflowStep)

  return this.response.json({ workflowStep: serializedWorkflowStep })
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

    const serializedFlight = serializeFlight(flight)

    res.json({ flight: serializedFlight })
  } catch (error) {
    next(error)
  }
}
```

Retain independently required request validation, domain invariants, authorization, attribute filtering, and parameterized queries with their existing owners. If the actual API contract explicitly rejects non-string values with 400, preserve that contract and its established predicate semantics; predicate selection does not itself require a guard. Do not coerce or assert a request value into compatibility, swallow downstream failures, or add a replacement downstream guard to keep a controller thin.

If the maintainer explicitly assigns formatting to the caller and rejects both backend normalization and a replacement guard, remove that guard and its obsolete contract test rather than adding fallback checks. Retain authorization, resource ownership, genuine validation, and existing service errors; see [Text Validation Ownership](../../../references/code-organization-reference.md#text-validation-ownership).

Where this controller's query helpers own request sorting, resolve defaults and necessary stable tie-breakers in `buildOrder()`, preserving client precedence, and pass the resulting order to services unchanged. See the [controller-ordering example](../../../references/express-light-rail-backend-concepts-reference.md#controller-owned-request-ordering); do not add a helper to architectures that do not use one.

## Quick-Start Download Responses

Use this opt-in shape only when the consumer requests early download handoff and accepts a UTF-8 BOM in CSV output. Authorization, request validation, and policy filtering finish before this excerpt. `generateBuffer` closes over those authorized inputs; its expensive work does not start at the controller call site. The filename must already follow the application's safe attachment convention.

```typescript
import type { Response } from "express"
import type { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

type GenerateCsvBuffer = (signal: AbortSignal) => Promise<Buffer>

async function respondWithDownload(
  response: Response,
  format: string,
  filename: string,
  generateBuffer: GenerateCsvBuffer
) {
  if (format === "csv") {
    return respondWithCsv(response, filename, generateBuffer)
  }

  throw new Error("Unsupported download format")
}

async function respondWithCsv(
  response: Response,
  filename: string,
  generateBuffer: GenerateCsvBuffer
) {
  response.attachment(filename)
  response.setHeader("Content-Type", "text/csv; charset=utf-8")
  return CreateCsvService.perform(response, generateBuffer)
}

class CreateCsvService {
  constructor(
    private output: Writable,
    private generateBuffer: GenerateCsvBuffer
  ) {}

  static perform(output: Writable, generateBuffer: GenerateCsvBuffer) {
    const service = new CreateCsvService(output, generateBuffer)
    return service.perform()
  }

  perform() {
    return quickStartCsvBufferStream(this.output, this.generateBuffer)
  }
}

async function quickStartCsvBufferStream(output: Writable, generateBuffer: GenerateCsvBuffer) {
  const controller = new AbortController()
  const abortOnClose = () => {
    if (!output.writableFinished) controller.abort()
  }

  output.once("close", abortOnClose)

  try {
    await pipeline(
      async function* ({ signal }) {
        yield CSV_PREFIX
        signal.throwIfAborted()

        const buffer = await generateBuffer(signal)
        signal.throwIfAborted()

        if (buffer.subarray(0, CSV_PREFIX.length).equals(CSV_PREFIX)) {
          yield buffer.subarray(CSV_PREFIX.length)
          return
        }

        yield buffer
      },
      output,
      { signal: controller.signal }
    )
  } finally {
    output.off("close", abortOnClose)
  }
}

const CSV_PREFIX = Buffer.from([0xef, 0xbb, 0xbf])
```

The class illustrates an existing service rail, not a requirement to wrap a shared stream helper in a new class. Reuse the application's service base and CSV generator where present. All output-taking calls and the constructor keep output first; pure buffer generators need no output parameter.

`pipeline` owns backpressure, completion, and destruction on errors. It writes the prefix before awaiting generation, removes only one exact leading prefix from the completed buffer, and leaves every other byte untouched. Do not trim whitespace, decode/re-encode the buffer, or assign a guessed `Content-Length`. Compression and reverse-proxy buffering can delay delivery: prove the browser handoff through the actual deployment path before promising it.

After headers are sent, let pipeline failures reach the existing error boundary for reporting, but do not send a JSON error, retry generation automatically, or call `end()` in a catch/finally block. The transfer must be interrupted, not marked successfully complete. The premature-close listener explicitly aborts the pipeline's generator signal, including while buffer generation is awaiting a result; do not rely on pipeline destruction alone to interrupt that pending work. The buffer generator must observe the signal to stop its own database/CPU work promptly. Preserve errors and observe cancellation through the application's existing owner.

This is an intentionally CSV-only contract, not an exact copy of WRAP's historical multi-format helper. It does not prescribe synthetic prefixes for ZIP-based DOCX or PDF and does not replace true row-by-row CSV streams. See [Download Delivery](../../../workflows/express-light-rail-backend-workflow.md#download-delivery) for verification and the package-versus-example decision.

## Checklist

- [ ] Handler reads auth context from the project-standard location.
- [ ] Missing/forbidden responses preserve the project's status and concealment contracts.
- [ ] Authorization precedes sensitive reads and mutations; denial wording names the action/resource with only safe context.
- [ ] Required validation/attribute filtering retains its existing owner; no unnecessary type/grammar guard is added or relocated.
- [ ] Request values follow the accepted service/model handoff with safe query bindings; failures flow through the project error middleware.
