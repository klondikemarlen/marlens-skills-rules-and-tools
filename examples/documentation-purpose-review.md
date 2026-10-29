# Documentation-Purpose Review

## Task

Review a models README for authors deciding when to publish a persistence event and which layer owns the work. The project's ordinary-language rule says source READMEs teach a layer's purpose, authoring patterns, and boundaries; code owns implementation details, and existing documentation owners should be linked rather than duplicated.

## Without Purpose Review

The original **Lifecycle Publications** passage in [WRAP PR #736](https://github.com/icefoganalytics/wrap/pull/736) explains omitted, explicit, and null transaction options, committed and rolled-back contexts, and a listener's transaction override. Compare the [original passage](https://github.com/icefoganalytics/wrap/blob/27b7ca44c9213fd3e89e7d336356ffc206316154/api/src/models/README.md#L27-L36) with the [helper's adjacent documentation](https://github.com/icefoganalytics/wrap/blob/27b7ca44c9213fd3e89e7d336356ffc206316154/api/src/models/base-model.ts#L140-L149) and [channel listener owner](https://github.com/icefoganalytics/wrap/blob/27b7ca44c9213fd3e89e7d336356ffc206316154/api/src/channels/README.md#L21-L37).

Those facts may accurately describe the implementation, but the passage does not explain when an author should use the model-event pattern or distinguish model, service, and channel responsibilities. A valid README path, working links, and passing behavioral tests do not establish that purpose.

## With Purpose Review

A corrected teaching passage can remain in the same models README. This illustrative replacement explains the decision and links the existing owner; it is not a claim that this exact wording shipped in WRAP:

```markdown
## Publishing Model Events

Use a model lifecycle event when a persisted change should notify interested consumers regardless of which service initiated it. Keep user-action orchestration in services and subscription authorization and socket broadcasting in channels. Check the inherited BaseModel lifecycle hooks before adding another publisher, so the same change is not published twice.

For example, when adding a live workflow-history view, start with the existing model update event and its payload. Let the channel consume that event instead of making the model call a socket broadcaster. Follow the [channels guide](/api/src/channels/README.md) for listener registration and removal. Consult the publication helper beside BaseModel for transaction-option and lifecycle edge semantics rather than copying that state machine here.
```

The local example teaches where to begin and what not to couple. It does not enumerate every method, repeat the channel's listener instructions, or create a new architecture page merely to relocate implementation prose.

## Check the Difference

Apply [Documentation Purpose and Placement](../docs/workflows/code-review-workflow.md#documentation-purpose-and-placement) and the supplied project rule to each case. These are bounded semantic consumer evaluations, not a filename or substring verifier. Do not modify WRAP during evaluation.

| Case                                                                     | Expected Review Decision                                                                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Original lifecycle-state inventory in the models README                  | `FAIL` documentation purpose. Cite the passage and source-README rule; replace the inventory with when/how/boundaries guidance and link the channel owner. Keep detailed helper semantics beside code. |
| Illustrative corrected passage at the same path                          | `PASS` documentation purpose: authoring decision, layer boundaries, source-local example, and existing-owner link. Validate factual claims and links separately.                                       |
| Existing owner already answers the reader question; no changed contract  | Leave documentation intentionally unchanged rather than inventing another README section or `/docs` page.                                                                                              |
| A developer workflow legitimately documents commands and execution order | Assess against that procedural reader task; do not apply a source-README implementation-inventory prohibition to every document.                                                                       |
| Required project rule or referenced source is unavailable                | `BLOCKED` for the affected purpose assessment; name the missing source and continue independent checks. Do not infer project policy from a pathname.                                                   |

The supplied `marlens-rules:documentation-purpose-alignment` contract applies these distinctions to changed Markdown/MDX through OMP Verifier. Report semantic purpose and material code alignment separately from formatting, links, behavioral tests, and module verification. Discovery and automatic selection require the installed provider and supported Verifier runtime; a supplied contract does not itself prove a current assessment or hard completion gate.

## A Mixed Channel README Passage

[WRAP PR #750](https://github.com/icefoganalytics/wrap/pull/750) exposed a later recurrence: the [channel README paragraph](https://github.com/icefoganalytics/wrap/blob/725fe3e5a4e42e1902b1818841b1f4c344773230/api/src/channels/README.md#L13) describes workflow, step, and assignee event metadata, workflow status, and the client's saved-state comparison and refresh decision. Its accurate implementation facts do not establish the source README's purpose. The same paragraph also says to keep full resource representations behind the authorized API; that can teach a legitimate layer boundary.

During authoring and review, compare the actual proposed paragraph with the project's source-README rule and the existing event-contract or implementation owner. Retain the useful boundary, replace the field catalog and client-reconciliation detail with a concise link to their existing owner, and leave unrelated channel guidance alone. Do not create a new domain page merely to relocate prose, infer notification-design requirements from this placement correction, or claim that a verifier previously ran and passed. This example records the reported passage, not a WRAP edit or a historical automation result.

| Case                                                                                                                                 | Expected Authoring and Review Decision                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Channel README mixes authorized-API boundary advice with concrete event metadata and client refresh decisions                        | Keep the useful layer boundary, but flag the catalog and cross-layer consumer detail under the project rule; cite the passage and link its existing owner. Accurate code descriptions and green tests do not settle placement. |
| Channel README explains when to use live updates, listener lifecycle, authorization boundaries, and where to find the event contract | Keep valid source-local guidance and a concise owner link; a README path is not itself a defect.                                                                                                                               |
| Existing owner or project rule is unavailable                                                                                        | Name the missing source and leave the affected assessment `BLOCKED`, rather than approving from generic advice or moving details to a guessed destination.                                                                     |

## Material Code-Alignment Cases

Consider an operator guide whose current implementation pushes an artifact, confirms access, then applies it once. A failed apply propagates its error; an `applied: false` result does not mean deployment succeeded. These are illustrative source facts, not claims about WRAP or another consuming project.

| Changed Passage                                                                                          | Expected Semantic Decision                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Source README enumerates internal helper state without an authoring decision                             | `FAIL` under the stated source-README rule; replace the inventory with local when/why/how/boundary guidance. |
| Models README copies listener registration/removal instructions from the channel guide                   | `FAIL` competing ownership; retain a local usage decision and link the existing channel owner.               |
| Operator guide says access is confirmed before the push                                                  | `FAIL` code alignment; cite the actual push-before-access sequence and correct the procedure.                |
| Operator guide promises automatic retry or equates a fresh invocation with retrying only the failed step | `FAIL` code alignment when the source makes one attempt and a fresh invocation repeats preparation.          |
| Operator guide claims successful artifact preparation proves deployment, including partial failure       | `FAIL` code alignment; distinguish preparation from the apply result and preserve failure semantics.         |
| Source-local pattern guidance, an accurate operator procedure, and a discovery link to an existing owner | `PASS` when the complete captured scope and material current source support those purposes and claims.       |
| Referenced deployment implementation or governing owner cannot be captured                               | `BLOCKED`; name the missing dependency rather than inferring behavior from the guide.                        |

Sources: [Project Documentation Selection](../docs/workflows/project-knowledge-base-workflow.md#selecting-documentation-content), [WRAP Documentation Philosophy](https://github.com/icefoganalytics/wrap/blob/4e170b491a72ba011c045f073021cd8475748585/AGENTS.md#L7-L21).
