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

Report semantic purpose, formatting, links, behavioral tests, and module verification as separate evidence. This guidance does not declare an automatic documentation verifier or imply that another check covers Markdown meaning.

Sources: [Project Documentation Selection](../docs/workflows/project-knowledge-base-workflow.md#selecting-documentation-content), [WRAP Documentation Philosophy](https://github.com/icefoganalytics/wrap/blob/4e170b491a72ba011c045f073021cd8475748585/AGENTS.md#L7-L21).
