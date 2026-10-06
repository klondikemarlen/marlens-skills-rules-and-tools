# Project Knowledge Base Workflow

Use when establishing or materially revising a repository-local `docs/` knowledge base for durable domain, product, architecture, decision, or QA knowledge.

## Intent

A project knowledge base gives readers one discoverable home for durable knowledge without confusing domain facts with implementation detail, duplicating shared agent guidance, or treating a documentation-site boundary as repository confidentiality.

It produces a project-local docs entry point, only the knowledge sections with current consumers, explicit authority boundaries, and a publication boundary that can later support a documentation site.

## Required Inputs

- Project-local instructions, README, source-adjacent READMEs, existing docs, and contribution guidance.
- Existing domain, product, architecture, decision, and QA material.
- Intended audiences and publication or confidentiality constraints.

## Process

1. State the reader problem, Gold, non-goals, audiences, and whether publication is in scope.
2. Read existing docs and nearby code guidance. Classify relevant information as domain, product, architecture, decision, QA scenario, task workflow, template, reference, plan, or implementation-local detail.
3. Add a root `docs/README.md` or `docs/index.md` discovery entry point and only the sections with current readers. Do not create empty directories or impose a fixed tree.
4. Keep durable project knowledge in sections such as `docs/domain/`, `docs/product/`, `docs/architecture/`, `docs/decisions/`, and `docs/qa-scenarios/`. Keep task procedures, reusable shapes, background guidance, and plans in `docs/workflows/`, `docs/templates/`, `docs/references/`, and `docs/plans/`.
5. Keep `docs/domain/workflows/` for product or operator processes and `docs/workflows/` for developer or agent procedures.
6. Treat documentation as intended domain and product meaning, code as current implementation behavior, and tests or QA scenarios as observed evidence. Record conflicts with their sources instead of inferring a resolution.
7. Keep component-specific implementation detail beside the owning code. Local overlays supplement shared workflows and templates rather than copying their generic body.
8. Keep Markdown portable. Repository visibility controls access, so confidential material MUST NOT be committed to a public repository. A future VitePress, VuePress, or comparable site must explicitly select its public input through an allowlist or audience metadata.
9. Verify links, implementation claims, authority boundaries, and the selected publication boundary.

## Output Contract

```text
Purpose: <knowledge gap and intended readers>
Gold: <what a reader can now find and trust>
Sections: <created or retained docs sections and why>
Authority: <domain/product, code, and QA/test sources>
Publication boundary: <repository visibility and explicit documentation-site policy>
Verification: <links and source claims checked>
Residual risk: <open ownership, source conflict, or none>
```
