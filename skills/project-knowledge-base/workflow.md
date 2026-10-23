# Project Knowledge Base Workflow

Use when establishing or materially revising a repository-local `docs/` knowledge base for durable domain, product, architecture, decision, or QA knowledge.

## Intent

A project knowledge base gives readers one discoverable home for durable knowledge without confusing domain facts with implementation detail, duplicating shared agent guidance, or treating a documentation-site boundary as repository confidentiality.

It produces a project-local docs entry point, only the knowledge sections with current consumers, explicit authority boundaries, and a publication boundary that can later support a documentation site.

## Selecting Documentation Content

Before editing repository documentation:

1. Name the durable reader question or architectural contract that changed. Update its existing durable owner only when the current knowledge no longer answers that question or describes the contract.
2. If the knowledge remains correct, record documentation as intentionally unchanged; do not invent a README section to satisfy a generic cleanup request.
3. Keep PR-specific change lists, transient execution state, migration rollout summaries, and verification reports in their owning PR, issue, or release record.
4. Retain historical context when it explains a current decision, invariant, compatibility constraint, or operator procedure, and make that relevance clear.
5. Preserve actual documentation needs and project-local changelog, release-metadata, verification, and publishing requirements. Do not attribute an unverified instruction to this workflow or package; if its actual owner is established, reconcile it there separately. Translate corrective feedback into a positive, durable explanation of product design and reader value. Avoid preserving conversation rebuttals, dismissing legitimate preferences as arbitrary quotas, or framing complementary goals as a false choice; retain concrete tradeoffs that still explain the design.

Write complete logical paragraphs without fixed-column manual line breaks; let the editor or renderer wrap prose naturally. Preserve paragraph boundaries, lists, tables, code blocks, and intentional hard breaks. Follow explicit repository formatting requirements; do not change global formatter settings to reflow one document.

## Adopting Shared Standards

When a project adopts a packaged shared standard, declare that base in existing project-root guidance: its owner, supported direct source, local overlay, and any genuine compatibility requirement. Keep those references stable rather than maintaining copied rule lists or an installed-version inventory. This makes adoption discoverable without changing skill selectors, overriding local precedence, or copying a shared workflow into root instructions. See [Adopting Shared Standards](../../docs/references/project-knowledge-base-reference.md#adopting-shared-standards) for authority and evidence boundaries.

1. **Resolve the source first.** In OMP, point directly to the relevant packaged workflow document, such as `skill://code-review/workflow.md`; do not route back through the selecting skill, which can re-enter local workflow selection. In other clients, identify and verify the corresponding workflow file in the installed or otherwise resolved release. Do not substitute a copied checklist or a personal machine-specific path. Record observed release/version and source identity in the adoption PR or existing verification evidence; keep prior-version results historical when the selected release changes.
2. **Load only task-relevant shared bases.** For each task, read the directly relevant shared workflow before its local overlay, then apply only the local deltas. Do not load unrelated shared standards merely because they are adopted.
3. **Inventory and decide rule by rule.** Compare local guidance with the shared base. Replace duplicated generic rules with a concise reference to the direct shared source. Keep a local rule when it expresses a project domain, security, cultural, command, tool, or other genuine constraint, or a compatible deliberate exception. For a real conflict, retain current project-local precedence, report the competing rules, and obtain an explicit project-owner decision before removing coverage or claiming alignment.
4. **Do not delete before proving replacement.** Before removing local coverage, verify that the exact adopted version/source is available to the intended consumer and that the root declaration and overlay lead to it. If the release/version or required source cannot be resolved, preserve the local coverage and block only the affected adoption or task until the prerequisite is restored; unrelated work may continue.
5. **Prove consumption, not just links.** From the project root, exercise a representative authoring, review, backend, or test decision as applicable: load the relevant shared source and overlay, apply their standards to the decision, retain local commands and one valid local exception, and confirm the source/version can be identified. Also check that the source is available and that no reference routes back into skill selection. Link checks and literal source presence prove discoverability only, not semantic compliance.

Keep the overlay small; [the shared-standards overlay template](../../docs/templates/shared-standards-overlay-template.md) provides a compact form. This documentation adoption procedure does not install tools or change runtime/executable behavior; handle executable adoption separately. Do not maintain a second, permanent ledger of duplicated guidance.

## Required Inputs

- Project-local instructions, README, source-adjacent READMEs, existing docs, and contribution guidance.
- Existing domain, product, architecture, decision, and QA material.
- Intended audiences and publication or confidentiality constraints.

## Process

1. State the reader problem, success condition, non-goals, audiences, and whether publication is in scope.
2. Read existing docs and nearby code guidance. Classify relevant information as domain, product, architecture, decision, QA scenario, task workflow, template, reference, plan, or implementation-local detail.
3. Add a root `docs/README.md` or `docs/index.md` discovery entry point and only the sections with current readers. Do not create empty directories or impose a fixed tree.
4. Keep durable project knowledge in sections such as `docs/domain/`, `docs/product/`, `docs/architecture/`, `docs/decisions/`, and `docs/qa-scenarios/`. Keep task procedures, reusable shapes, background guidance, and plans in `docs/workflows/`, `docs/templates/`, `docs/references/`, and `docs/plans/`.
5. Keep `docs/domain/workflows/` for product or operator processes and `docs/workflows/` for developer or agent procedures.
6. Treat documentation as intended domain and product meaning, code as current implementation behavior, and tests or QA scenarios as observed evidence. Record conflicts with their sources instead of inferring a resolution.
7. Keep source-directory READMEs architectural: explain the folder or layer's purpose, responsibilities, boundaries, and dependency direction. Service READMEs should help humans and agents know when to use the service layer and how to author services at that boundary, without duplicating code specifics or listing methods. Put durable human-level domain and architecture knowledge in the knowledge base and link to it. Local overlays supplement shared workflows and templates rather than copying their generic body.
8. Prefer repo-root `/docs/...` paths over deep `../` chains for repository documentation links and source-comment `@see` references. Verify files and heading anchors. These references are not TypeScript import aliases or runtime paths; clickability depends on the renderer, so check the intended surface and preserve evidenced project-specific constraints. Repository visibility controls access: confidential material MUST NOT be committed to a public repository. A future site must explicitly select its public input through an allowlist or audience metadata.
9. Verify links, implementation claims, authority boundaries, and the selected publication boundary.

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
