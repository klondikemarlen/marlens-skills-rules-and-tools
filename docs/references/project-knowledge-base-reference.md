# Project Knowledge Base Reference

Use this reference when a project keeps durable domain, product, architecture, decision, and QA knowledge in its repository `docs/` tree.

## Purpose

A project knowledge base makes the facts needed to change a product discoverable without turning an agent workflow, a dated planning note, or source-adjacent implementation README into a competing source of truth.

It is a project-local documentation model. This package provides the vocabulary and procedure; each project owns its names, source material, and publication policy.

## Documentation Layers

| Layer                    | Home                                                                                           | Owns                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Knowledge                | `docs/domain/`, `docs/product/`, `docs/architecture/`, `docs/decisions/`, `docs/qa-scenarios/` | Meaning, user-visible behavior, system shape, decisions, and known risks.                              |
| Operating guidance       | `docs/workflows/`, `docs/templates/`, `docs/references/`, `docs/plans/`                        | How people and agents perform work, reusable shapes, background techniques, and time-bounded planning. |
| Source-adjacent guidance | Nearest code README                                                                            | Folder/layer purpose, boundaries, service-authoring guidance, and links to durable knowledge.          |

Use a root `docs/README.md` or `docs/index.md` as the discovery entry point. Section READMEs are indexes; the document they link to is authoritative for its subject.

## Optional Knowledge Sections

Create only sections with a current consumer. Do not scaffold empty directories.

| Section              | Use for                                                                        | Do not use for                   |
| -------------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| `docs/domain/`       | Glossary terms, business rules, domain workflows, sourced regulations.         | Developer task procedures.       |
| `docs/product/`      | Feature behavior, user roles, permissions, and operator-facing semantics.      | Code-level implementation notes. |
| `docs/architecture/` | System boundaries, data flow, integration contracts, and current system shape. | A replacement for source code.   |
| `docs/decisions/`    | Durable decisions, context, alternatives, and consequences.                    | A work-in-progress checklist.    |
| `docs/qa-scenarios/` | Known regression risks and reproducible manual pathways.                       | Vague testing aspirations.       |

`docs/domain/workflows/` describes an operator or product process. `docs/workflows/` describes a developer or agent procedure. Keep them separate even when both use the word "workflow".

Use the project naming convention. Stable slugs work well for durable knowledge. A project may retain dated notes or plans where time is part of the record; do not make them compete with a durable knowledge document.

## Authority Boundaries

- Domain and product documentation own intended meaning, terminology, and product decisions.
- Code owns current implementation behavior, file paths, API shapes, and schema details.
- Tests and QA scenarios own observed evidence and reproducible behavior.
- A disagreement between those sources is a finding. Cite both sides, identify the owner, and ask for a decision; never invent reconciliation.
- Do not state a regulated, safety-sensitive, financial, security, or privacy fact without its project-authoritative source.

## Knowledge Capture

Before adding material, read the nearest relevant existing document and classify the information:

- domain term or domain workflow;
- product behavior;
- architecture fact;
- decision;
- QA scenario;
- operating workflow, template, reference, or plan.

Update the narrowest existing document when it already owns the concept. Create a document only for a durable, independently discoverable concept. Keep non-obvious implementation rationale beside its source; do not duplicate method inventories, algorithm walkthroughs, or SQL mechanics in a source-directory README. That README explains the folder or layer's architectural purpose, responsibilities, boundaries, and dependency direction. For service layers, help humans and agents understand when to use the service and how to author services at that boundary, without repeating implementation specifics from code. Durable human-level domain concepts and architecture knowledge belong in the knowledge base, linked from source-adjacent guidance when useful.

## Repository Documentation References

Prefer repo-root `/docs/...` references over deep `../` chains in repository Markdown and source-comment `@see` references. For example, `/docs/references/code-organization-reference.md#service-orchestration-readability` names one stable repository target without encoding the referring file's depth.

These are documentation references, not TypeScript import aliases or runtime filesystem paths. Validate the referenced file and heading fragment. Markdown, JSDoc, editors, and documentation-site renderers may interpret a leading slash differently; verify the intended surface before claiming clickability, and retain an evidenced project-specific constraint where needed. This preference does not authorize changing module-resolution configuration or bulk-rewriting unrelated references.

## Publication Boundary

Repository visibility and documentation-site publication are separate. Markdown committed to a public repository is already public, so confidential material belongs in a private repository or other access-controlled system.

If a project later renders Markdown with VitePress, VuePress, or another generator:

1. retain stable headings and clear indexes; verify repo-root documentation references on the intended site renderer;
2. choose site input explicitly through an allowlist, audience metadata, or separate public build input;
3. verify the generated site contains only the intended audience material.

Do not select a generator or add publication infrastructure solely to establish a knowledge base.

## Maintenance Signals

Review a knowledge document when its authoritative source changes, a code/document conflict is found, a QA scenario exposes an undocumented rule, or a reader cannot find required information. Document age alone is not evidence that it is stale.

## Adopting Shared Standards

Declare the adopted shared base in existing project-root guidance: its owner, supported direct source, local overlay, and any genuine compatibility requirement. Keep observed installed/released version evidence in the adoption PR or existing verification record, not a second permanent version inventory. The declaration records where generic standards come from; it does not change skill selection or project-local precedence.

Load the task-relevant shared workflow first, then the project overlay. In OMP, use a direct packaged workflow URI such as `skill://code-review/workflow.md`, not a selector that can route back into local workflow selection. Other clients should use the verified workflow file in the resolved release and identify that release/source without personal machine paths.

Inventory local material before replacing it. Remove only duplicated generic guidance, retaining domain, security, cultural, command, tool, and other project constraints, plus compatible deliberate exceptions. Conflicting local rules require an explicit owner decision. If the exact source or version is missing or unavailable, preserve existing local coverage and block only the affected adoption/task until resolved; do not infer that a link or package identity proves replacement.

Semantic consumer proof starts at the project root and applies the loaded base and overlay to a representative authoring, review, backend, or test decision. Preserve project commands and demonstrate one valid local exception; verify source/version availability and absence of circular routing. Link/literal checks establish only that references exist, not that a consumer follows the standard. Runtime or executable adoption is separate, and no permanent duplicate-guidance ledger is needed.

Keep the root declaration and overlay as stable references rather than copied rule lists. When the selected shared release changes, resolve its actual identity and repeat the applicable consumer proof before claiming that release verified; prior-version results remain historical. Do not automatically install or upgrade a tool to satisfy adoption.
