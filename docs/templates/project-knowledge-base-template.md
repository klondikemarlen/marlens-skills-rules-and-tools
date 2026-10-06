# Project Knowledge Base Template

Use this template when adding the discovery entry point for a project-local knowledge base. Create only the sections the project currently needs.

## Required Inputs

- `<Project>`: project name.
- `<entrypoint>`: `README.md` or `index.md` at the `docs/` root.
- `<sections>`: the knowledge and operating sections with current consumers.
- `<authority>`: project sources that define domain intent, implementation behavior, and observed evidence.
- `<publication-boundary>`: repository visibility and any explicitly published documentation-site content.

## Template

````markdown
# <Project> Documentation

This directory is the discovery entry point for durable project knowledge and operating guidance.
Read the linked document for a subject; this index does not replace it.

## Knowledge

| Section | Purpose | Authority |
| --- | --- | --- |
| [Architecture](architecture/README.md) | System boundaries, data flow, and integration contracts. | Code for current behavior; architecture documents for intended shape. |
| [Domain](domain/README.md) | Glossary terms and business or operator processes. | Project-authoritative domain sources. |
| [Product](product/README.md) | User-visible behavior, roles, and feature semantics. | Product decisions and verified behavior. |
| [Decisions](decisions/README.md) | Durable decisions and consequences. | Decision record owner. |
| [QA scenarios](qa-scenarios/README.md) | Known regression risks and reproducible manual paths. | Observed test or QA evidence. |

Remove rows for sections the project does not use. Add `domain/workflows/` only for product or operator processes; keep developer and agent procedures in `workflows/`.

## Operating Guidance

| Section | Purpose |
| --- | --- |
| [Workflows](workflows/README.md) | Developer and agent task procedures, including local overlays of shared guidance. |
| [Templates](templates/README.md) | Copyable implementation and document shapes. |
| [References](references/README.md) | Durable cross-workflow techniques and policies. |
| [Plans](plans/README.md) | Spec-first planning documents; requirements and design stay separate from branch state. |

Remove rows for sections the project does not use.

## Authority Boundaries

- Documentation explains intended domain and product meaning.
- Code is authoritative for current implementation behavior.
- Tests and QA scenarios record observed, reproducible evidence.
- Record code/document conflicts with both sources; do not resolve them by inference.

## Publication Boundary

Markdown committed to a public repository must be safe for public access. A generated documentation site is separately opt-in and must explicitly select its input through an allowlist or audience metadata. Keep secrets, customer data, operational identifiers, and internal-only procedures in an appropriate access-controlled location.
````

## Verification Checklist

- [ ] Every linked section exists; unused rows were removed.
- [ ] No empty directory was created only to satisfy the template.
- [ ] `domain/workflows/` and `workflows/` have distinct purposes when both exist.
- [ ] Authority boundaries name the sources the project actually uses.
- [ ] Links resolve from the chosen docs entry point.
- [ ] Any future publication policy explicitly restricts its input set.
