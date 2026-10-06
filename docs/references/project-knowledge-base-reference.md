# Project Knowledge Base Reference

Use this reference when a project keeps durable domain, product, architecture, decision, and QA knowledge in its repository `docs/` tree.

## Purpose

A project knowledge base makes the facts needed to change a product discoverable without turning an agent workflow, a dated planning note, or source-adjacent implementation README into a competing source of truth.

It is a project-local documentation model. This package provides the vocabulary and procedure; each project owns its names, source material, and publication policy.

## Documentation Layers

| Layer | Home | Owns |
| --- | --- | --- |
| Knowledge | `docs/domain/`, `docs/product/`, `docs/architecture/`, `docs/decisions/`, `docs/qa-scenarios/` | Meaning, user-visible behavior, system shape, decisions, and known risks. |
| Operating guidance | `docs/workflows/`, `docs/templates/`, `docs/references/`, `docs/plans/` | How people and agents perform work, reusable shapes, background techniques, and time-bounded planning. |
| Source-adjacent guidance | Nearest code README | Implementation details whose ownership is one component or directory. |

Use a root `docs/README.md` or `docs/index.md` as the discovery entry point. Section READMEs are indexes; the document they link to is authoritative for its subject.

## Optional Knowledge Sections

Create only sections with a current consumer. Do not scaffold empty directories.

| Section | Use for | Do not use for |
| --- | --- | --- |
| `docs/domain/` | Glossary terms, business rules, domain workflows, sourced regulations. | Developer task procedures. |
| `docs/product/` | Feature behavior, user roles, permissions, and operator-facing semantics. | Code-level implementation notes. |
| `docs/architecture/` | System boundaries, data flow, integration contracts, and current system shape. | A replacement for source code. |
| `docs/decisions/` | Durable decisions, context, alternatives, and consequences. | A work-in-progress checklist. |
| `docs/qa-scenarios/` | Known regression risks and reproducible manual pathways. | Vague testing aspirations. |

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

Update the narrowest existing document when it already owns the concept. Create a document only for a durable, independently discoverable concept. Keep implementation-local explanations beside their source when moving them to `docs/` would widen ownership without adding discovery value.

## Publication Boundary

Repository visibility and documentation-site publication are separate. Markdown committed to a public repository is already public, so confidential material belongs in a private repository or other access-controlled system.

If a project later renders Markdown with VitePress, VuePress, or another generator:

1. retain portable Markdown, relative links, stable headings, and clear indexes;
2. choose site input explicitly through an allowlist, audience metadata, or separate public build input;
3. verify the generated site contains only the intended audience material.

Do not select a generator or add publication infrastructure solely to establish a knowledge base.

## Maintenance Signals

Review a knowledge document when its authoritative source changes, a code/document conflict is found, a QA scenario exposes an undocumented rule, or a reader cannot find required information. Document age alone is not evidence that it is stale.
