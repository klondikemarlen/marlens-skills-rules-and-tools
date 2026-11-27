# Controller Template

Use for thin Express handlers that delegate auth, domain work, and serialization.

Authorization denials name the attempted action and resource: list/view for reads, create/update/delete for mutations. For example, say "You are not authorized to list invoices for this travel request", not "manage invoices"; an update or delete denial says "update this project" or "delete this project". Include useful parent context only when it is safe to disclose. Keep the established policy checks, status codes, and concealment contract: do not replace a deliberate 404 or generic denial with wording that reveals resource existence, private identifiers, or internal policy details.

## Template

```ts
import type { Request, Response, NextFunction } from "express"

import { resolvePagination } from "./pagination"
import { canCreateProject, canReadProject } from "./projects.policy"
import { createProjectForUser, findProjectForUser, listProjectsForUser } from "./projects.service"
import { serializeProject } from "./projects.serializer"

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = currentUserIdFrom(res)
    const { limit, offset } = resolvePagination(req.query)
    const projects = await listProjectsForUser(currentUserId, limit, offset)

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

### Destroy Service Handoff

When a resource already has a destroy service, load and authorize the target in the controller, then pass that same record to the service. Keep the loader's scope and required preloads, any existing parent checks, and the established HTTP responses. Do not unpack the child into an ID and parent just to call a parent-level operation from the controller. The destroy service owns traversal of loaded associations, the deletion and any resulting parent changes, and the concurrency checks needed to make those writes safe.

This excerpt assumes an existing scoped attachment loader, an attachment policy, and a route adapter that forwards service errors:

```typescript
async destroy() {
  const attachment = await this.loadAttachment()
  if (attachment === null) {
    return this.response.status(404).json({ message: "Attachment not found" })
  }

  const attachmentPolicy = this.buildAttachmentPolicy(attachment)
  if (!attachmentPolicy.destroy()) {
    return this.response.status(403).json({ message: "You are not authorized to delete this attachment" })
  }

  await DestroyService.perform(attachment, this.currentUser)

  return this.response.status(204).end()
}
```

Pass the acting user when the deletion depends on the actor or records attribution. If the service needs neither, keep the same controller authorization and call `await DestroyService.perform(attachment)` instead. This handoff does not require adding a service to a delete action that does not already use one.

### Nested Record Loading

When a parent is required context for a child write, keep create and update under the same parent route: `POST /parents/:parentId/children` and `PATCH /parents/:parentId/children/:childId`. Take parent identity from the route, not the writable body. For a member write, match both the child ID and route parent ID; shared access scope does not prove that the child belongs to that parent. This does not require nesting independent reads or unrelated actions.

When the action already loads the parent model for a policy or service, pass it explicitly to the child loader and use its ID in the lookup. Keep existing visibility predicates and required preloads. If the lookup and policy can use the route ID, do not load a parent model just to pass that model around.

In a class controller that already builds policies for distinct records, keep construction in private builders named for the record each authorizes. Keep the permission checks visible in the actions, with the same policy classes, user, and records. An unambiguous `buildPolicy` is fine for a single-policy controller; functional handlers do not need this abstraction. Do not add a separate parent check when the resource policy already owns it.

For example, bind `POST /projects/:projectId/members` to `create` and `PATCH /projects/:projectId/members/:projectMemberId` to `update`. This excerpt assumes an existing authenticated controller base whose route adapter forwards thrown errors to middleware. `ProjectMembershipPolicy` governs membership operations on a `Project`; `ProjectMemberPolicy` governs an individual member. The existing action-specific allowlists accept `role`, not `projectId`.

```typescript
class ProjectMembersController extends BaseController<ProjectMember> {
  async create() {
    const project = await this.loadProject()
    if (project === null) {
      return this.response.status(404).json({
        message: "Project not found",
      })
    }

    const projectPolicy = this.buildProjectPolicy(project)
    if (!projectPolicy.create()) {
      return this.response.status(403).json({
        message: "You are not authorized to create project members",
      })
    }

    const permittedAttributes = projectPolicy.permitAttributesForCreate(this.request.body)
    const projectMember = await CreateService.perform(project, permittedAttributes)
    const serializedProjectMember = ShowSerializer.perform(projectMember)

    return this.response.status(201).json({
      projectMember: serializedProjectMember,
    })
  }

  async update() {
    const project = await this.loadProject()
    if (project === null) {
      return this.response.status(404).json({
        message: "Project not found",
      })
    }

    const projectPolicy = this.buildProjectPolicy(project)
    if (!projectPolicy.update()) {
      return this.response.status(403).json({
        message: "You are not authorized to update this project member",
      })
    }

    const projectMember = await this.loadProjectMember(project)
    if (projectMember === null) {
      return this.response.status(404).json({
        message: "Project member not found",
      })
    }

    const projectMemberPolicy = this.buildProjectMemberPolicy(projectMember)
    if (!projectMemberPolicy.update()) {
      return this.response.status(403).json({
        message: "You are not authorized to update this project member",
      })
    }

    const permittedAttributes = projectMemberPolicy.permitAttributesForUpdate(this.request.body)
    const updatedProjectMember = await UpdateService.perform(projectMember, permittedAttributes)
    const serializedProjectMember = ShowSerializer.perform(updatedProjectMember)

    return this.response.status(200).json({
      projectMember: serializedProjectMember,
    })
  }

  private loadProject(): Promise<Project | null> {
    return Project.findByPk(this.request.params.projectId)
  }

  private loadProjectMember(project: Project): Promise<ProjectMember | null> {
    return ProjectMember.findOne({
      where: {
        id: this.request.params.projectMemberId,
        projectId: project.id,
      },
      include: ["project"],
    })
  }

  private buildProjectPolicy(project: Project): ProjectMembershipPolicy {
    return new ProjectMembershipPolicy(this.currentUser, project)
  }

  private buildProjectMemberPolicy(projectMember: ProjectMember): ProjectMemberPolicy {
    return new ProjectMemberPolicy(this.currentUser, projectMember)
  }
}
```

Test the nested PATCH through the actual router. In this example, department membership grants permission to update roles in that department. Arrange the caller, both projects, and the member in the same department so neither policy would independently deny the update. A member of the other project must produce the same response as an absent member under the route project:

```typescript
describe("api/src/controllers/project-members-controller.ts", () => {
  describe("ProjectMembersController", () => {
    describe("#update - PATCH - /projects/:projectId/members/:projectMemberId", () => {
      test("when the member belongs to another project in the same department, it returns not found", async () => {
        // Arrange
        const user = await userFactory.create({
          department: "Finance",
        })
        const projectInRoute = await projectFactory.create({
          department: "Finance",
        })
        const otherProject = await projectFactory.create({
          department: "Finance",
        })
        const memberOfOtherProject = await projectMemberFactory.create({
          projectId: otherProject.id,
          department: "Finance",
          role: "viewer",
        })

        // Act
        const response = await requestAs(user)
          .patch(`/projects/${projectInRoute.id}/members/${memberOfOtherProject.id}`)
          .send({
            role: "editor",
          })

        // Assert
        expect(response.status).toEqual(404)
        expect(response.body).toEqual({
          message: "Project member not found",
        })
      })
    })
  })
})
```

Use the project's existing authenticated HTTP helper and factories. Also verify that authorized POST and PATCH succeed under the correct parent and that a body-supplied parent cannot override route context, using the existing strip-or-reject contract. Retain independent missing-record and forbidden cases, including a child-policy denial after the parent check succeeds. Keep required preloads for the actual policy and serializer.

## Protected Request Admission

Successful credential verification does not prove that the verified claims contain the identity your application requires. Reject a missing or unusable identity with the existing authentication denial before any account lookup. A fallback such as `""` is a lookup value that might select an account, not a denial. Pass a usable identifier unchanged. This applies to required identity, not to optional non-identity defaults or explicitly public routes.

In this example, the existing `verifyCredential` middleware verifies the token and supplies a verified claims object, but does not require `sub`. The verified JSON transport cannot produce boxed strings, and this project already uses the named Lodash predicates. `trim()` only checks for blankness; it does not alter the account identifier. Adapt the [predicate choice](../../../references/code-organization-reference.md#guard-clauses-and-exceptional-responses), request context, responses, and async error handling to the project.

Resolve feature availability from the authenticated account before looking up the workflow. The archive-only route denies disabled requests. The ordinary listing uses the same flag only for response metadata, never to skip regular data or grant access. This example uses a policy-scoped workflow lookup and distinct permissions for the two folder collections; it preserves a generic 404 when the workflow is missing or the action is not allowed.

```typescript
import type { NextFunction, Request, Response } from "express"
import { isEmpty, isString } from "lodash"

async function resolveCurrentAccount(_req: Request, res: Response, next: NextFunction) {
  const subject: unknown = res.locals.verifiedClaims.sub
  if (!isString(subject) || isEmpty(subject.trim())) {
    res.sendStatus(401)
    return
  }

  const account = await findAccountBySubject(subject)
  if (!account) {
    res.sendStatus(401)
    return
  }

  res.locals.currentAccount = account
  next()
}

async function listArchivedFolders(req: Request, res: Response) {
  const { currentAccount } = res.locals
  const { isFolderArchiveEnabled } = currentAccount.preferences
  if (!isFolderArchiveEnabled) {
    res.sendStatus(403)
    return
  }

  const workflow = await findWorkflowVisibleTo(currentAccount, req.params.workflowId)
  if (!workflow || !canListArchivedFolders(currentAccount, workflow)) {
    res.sendStatus(404)
    return
  }

  const folders = await listArchivedFoldersForWorkflow(currentAccount, workflow)
  const serializedFolders = folders.map(serializeFolder)

  res.json({
    folders: serializedFolders,
  })
}

async function listFolders(req: Request, res: Response) {
  const { currentAccount } = res.locals
  const { isFolderArchiveEnabled } = currentAccount.preferences
  const workflow = await findWorkflowVisibleTo(currentAccount, req.params.workflowId)
  if (!workflow || !canListFolders(currentAccount, workflow)) {
    res.sendStatus(404)
    return
  }

  const folders = await listFoldersForWorkflow(currentAccount, workflow)
  const serializedFolders = folders.map(serializeFolder)

  if (isFolderArchiveEnabled) {
    res.json({
      folders: serializedFolders,
      isFolderArchiveEnabled,
    })
    return
  }

  res.json({
    folders: serializedFolders,
  })
}

router.get("/workflows/:workflowId/folders", verifyCredential, resolveCurrentAccount, listFolders)
router.get(
  "/workflows/:workflowId/archived-folders",
  verifyCredential,
  resolveCurrentAccount,
  listArchivedFolders
)
```

The flag can live in the controller as shown or in the project's established admission middleware. Evaluate it only after authentication and after any data it actually depends on is available. Keep record-level authorization in either design.

Focused regression scenarios:

- A rejected credential never reaches account resolution. A verified token with an absent, non-string, empty, or whitespace-only subject gets the existing authentication denial with no account lookup. A usable subject reaches account resolution unchanged (for example, `" account-7 "` if accepted by the application); a failed account resolution still denies.
- A caller who otherwise has archive permission gets the disabled-feature response with the flag off, without a workflow or folder read. With the flag on, the route still checks the archive permission before reading and returning archived folders.
- On the ordinary route, an authorized caller gets the same regular folders with the flag off or on. The workflow lookup follows flag evaluation in both cases; only the enabled response advertises the archive feature.
- An enabled caller without the relevant resource permission still gets the established resource denial and no protected folder read on either route.

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
