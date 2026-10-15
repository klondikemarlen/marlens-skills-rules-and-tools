# Project Knowledge Base Workflow

Use when establishing or materially revising a repository-local `docs/` knowledge base for a project with durable domain, product, architecture, decision, or QA knowledge.

## Intent

**WHY this workflow exists:** A project needs one discoverable home for durable knowledge without confusing domain facts with implementation details, duplicating shared agent guidance, or treating a documentation-site boundary as repository confidentiality.

**WHAT this workflow produces:** A project-local docs entry point, only the knowledge sections with current consumers, explicit authority boundaries, and a publication boundary that can later support a documentation site.

**Decision Rules:**

- Read the target project’s local instructions, README, source-adjacent READMEs, existing `docs/`, and contribution/release guidance before moving or creating documentation.
- Reuse the project’s naming and documentation conventions. Do not impose a fixed tree or create empty directories.
- Keep durable human-level project knowledge under `docs/`. Source-directory READMEs own architectural purpose and responsibility boundaries, not feature implementation walkthroughs; non-obvious code-local rationale belongs beside the code.
- Keep `docs/domain/workflows/` for product or operator processes and `docs/workflows/` for developer or agent procedures.
- Treat documentation as intended domain and product meaning, code as current implementation behavior, and tests or QA scenarios as observed evidence. Record conflicts rather than inferring a resolution.
- Local workflow and template overlays supplement shared guidance; they do not copy the generic body.
- Establishing a docs tree does not select a static-site generator or authorize site publication. Repository visibility controls access: confidential material MUST NOT be committed to a public repository.

## Selecting Documentation Content

Before editing repository documentation:

1. Name the durable reader question or architectural contract that changed. Update its existing durable owner only when the current knowledge no longer answers that question or describes the contract.
2. If the knowledge remains correct, record documentation as intentionally unchanged; do not invent a README section to satisfy a generic cleanup request.
3. Keep PR-specific change lists, transient execution state, migration rollout summaries, and verification reports in their owning PR, issue, or release record.
4. Retain historical context when it explains a current decision, invariant, compatibility constraint, or operator procedure, and make that relevance clear.
5. Preserve actual documentation needs and project-local changelog, release-metadata, verification, and publishing requirements. Do not attribute an unverified instruction to this workflow or package; if its actual owner is established, reconcile it there separately. Translate corrective feedback into a positive, durable explanation of product design and reader value. Avoid preserving conversation rebuttals, dismissing legitimate preferences as arbitrary quotas, or framing complementary goals as a false choice; retain concrete tradeoffs that still explain the design.

## Required Inputs

- The project’s local documentation, agent, and contribution guidance.
- Existing documentation roots, source-adjacent READMEs, issue/decision records, and QA material.
- The domain, product, architecture, or QA knowledge that needs durable ownership.
- The intended audiences and any publication or confidentiality constraints.

## Process

1. **Frame the outcome.** State which readers cannot currently find which durable knowledge. Name the success condition, non-goals, audiences, and whether the work is documentation-only or includes a future publication decision.
2. **Inventory before organizing.** Read existing docs and the nearest source-adjacent guidance. Classify each relevant item as domain, product, architecture, decision, QA scenario, task workflow, template, reference, plan, or implementation-local detail. Preserve a project convention that already serves the same role.
3. **Choose only needed sections.** Use the vocabulary in [`project-knowledge-base-reference.md`](../references/project-knowledge-base-reference.md) to select sections with a current reader. Add a root `docs/README.md` or `docs/index.md` discovery entry point using [`project-knowledge-base-template.md`](../templates/project-knowledge-base-template.md); remove template rows for unused sections.
4. **Write authority boundaries.** Identify the source for each class of claim: domain/product documentation for intent, code for current behavior, and tests or QA scenarios for observed evidence. A code/document mismatch becomes a cited finding with an owner and a decision request.
5. **Capture knowledge at the narrowest durable home.** Update an existing owner when possible. Create a new document only for an independently discoverable concept. Keep developer procedures in `docs/workflows/`, and keep domain or operator processes in `docs/domain/workflows/`.
6. **Preserve source adjacency without duplicating code.** Source-directory READMEs explain the folder or layer's architectural purpose, responsibilities, boundaries, and dependency direction. For a service layer, explain when to use it and how to author services there for human and agent readers; do not inventory methods or repeat implementation specifics from code. Keep feature-specific method inventories, algorithm walkthroughs, and SQL mechanics in the code; explain non-obvious implementation rationale beside its owner. Put durable human-level domain concepts and architecture knowledge in the knowledge base and link to it rather than maintaining a second implementation description. Local overlays supplement shared guidance rather than copying it.
7. **Choose repository documentation references.** Prefer repo-root `/docs/...` paths over deep `../` chains for repository documentation links and source-comment `@see` references, including heading fragments. These are documentation references, not TypeScript import aliases or runtime paths; do not alter module resolution. Verify the target file and heading anchor. Clickability depends on the Markdown, JSDoc, editor, or site renderer; check the intended surface before claiming support and preserve an evidenced project-specific renderer constraint. Repository visibility controls access, so keep confidential material out of public repositories. A future site still needs an explicit generator and publication allowlist or audience metadata.
8. **Verify the result.** Check every docs link, verify implementation claims against code, ensure no sensitive material crosses the chosen publication boundary, and confirm the discovery entry point leads readers to the actual authoritative document.

## Output Contract

```text
Purpose: <knowledge gap and intended readers>
Success condition: <what a reader can now find and trust>
Sections: <created or retained docs sections and why>
Authority: <domain/product, code, and QA/test sources>
Publication boundary: <repository visibility and explicit documentation-site policy>
Verification: <links and source claims checked>
Residual risk: <open ownership, source conflict, or none>
```
