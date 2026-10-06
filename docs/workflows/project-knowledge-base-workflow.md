# Project Knowledge Base Workflow

Use when establishing or materially revising a repository-local `docs/` knowledge base for a project with durable domain, product, architecture, decision, or QA knowledge.

## Intent

**WHY this workflow exists:** A project needs one discoverable home for durable knowledge without confusing domain facts with implementation details, duplicating shared agent guidance, or treating a documentation-site boundary as repository confidentiality.

**WHAT this workflow produces:** A project-local docs entry point, only the knowledge sections with current consumers, explicit authority boundaries, and a publication boundary that can later support a documentation site.

**Decision Rules:**

- Read the target project’s local instructions, README, source-adjacent READMEs, existing `docs/`, and contribution/release guidance before moving or creating documentation.
- Reuse the project’s naming and documentation conventions. Do not impose a fixed tree or create empty directories.
- Keep durable project knowledge under `docs/`; keep implementation-local detail beside the owning code.
- Keep `docs/domain/workflows/` for product or operator processes and `docs/workflows/` for developer or agent procedures.
- Treat documentation as intended domain and product meaning, code as current implementation behavior, and tests or QA scenarios as observed evidence. Record conflicts rather than inferring a resolution.
- Local workflow and template overlays supplement shared guidance; they do not copy the generic body.
- Establishing a docs tree does not select a static-site generator or authorize site publication. Repository visibility controls access: confidential material MUST NOT be committed to a public repository.

## Required Inputs

- The project’s local documentation, agent, and contribution guidance.
- Existing documentation roots, source-adjacent READMEs, issue/decision records, and QA material.
- The domain, product, architecture, or QA knowledge that needs durable ownership.
- The intended audiences and any publication or confidentiality constraints.

## Process

1. **Frame the outcome.** State which readers cannot currently find which durable knowledge. Name the Gold, non-goals, audiences, and whether the work is documentation-only or includes a future publication decision.
2. **Inventory before organizing.** Read existing docs and the nearest source-adjacent guidance. Classify each relevant item as domain, product, architecture, decision, QA scenario, task workflow, template, reference, plan, or implementation-local detail. Preserve a project convention that already serves the same role.
3. **Choose only needed sections.** Use the vocabulary in [`project-knowledge-base-reference.md`](../references/project-knowledge-base-reference.md) to select sections with a current reader. Add a root `docs/README.md` or `docs/index.md` discovery entry point using [`project-knowledge-base-template.md`](../templates/project-knowledge-base-template.md); remove template rows for unused sections.
4. **Write authority boundaries.** Identify the source for each class of claim: domain/product documentation for intent, code for current behavior, and tests or QA scenarios for observed evidence. A code/document mismatch becomes a cited finding with an owner and a decision request.
5. **Capture knowledge at the narrowest durable home.** Update an existing owner when possible. Create a new document only for an independently discoverable concept. Keep developer procedures in `docs/workflows/`, and keep domain or operator processes in `docs/domain/workflows/`.
6. **Preserve source adjacency.** Keep component-specific implementation guidance near the code. Link it from the docs entry point only when cross-project discovery needs it.
7. **Set the publication boundary.** Keep Markdown portable: stable headings, relative links, and readable indexes. Repository visibility controls access, so keep confidential material out of public repositories. If a site is later introduced, choose its generator and public input separately; allowlist site content or use audience metadata before publishing.
8. **Verify the result.** Check every docs link, verify implementation claims against code, ensure no sensitive material crosses the chosen publication boundary, and confirm the discovery entry point leads readers to the actual authoritative document.

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
