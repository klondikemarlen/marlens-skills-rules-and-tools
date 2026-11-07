# UI Prototyping Workflow

Use for a UI wireframe or interactive design preview, not ordinary application implementation.

## Intent

**WHY this workflow exists:** A useful design preview must reflect the intended application and remain reviewable after the conversation ends, without pretending to be the shipped feature.

**WHAT this workflow produces:** The smallest coherent review surface, grounded design decisions, observed interaction evidence, and—only when saving is authorized—a recoverable artifact with startup instructions.

**Decision Rules:**

- Preserve project-local guidance, the selected checkout, artifact location, and the user's save/publication boundaries. A prototype request does not authorize application changes, ticket transitions, a commit, publication, or merge.
- Use [Shape](../../skills/shape/SKILL.md) for unclear product behavior and [Outcome-First Planning](../../skills/plan/SKILL.md) for a material design choice. Reuse established requirements; do not repeat their interviews or invent domain policy.
- Use [Worktree Creation](../../skills/worktree/SKILL.md) only for authorized checkout preparation. Its implementation-ticket lifecycle does not turn a design-only request into application delivery.
- Use [Browser QA](../../skills/browser-qa/SKILL.md) for browser selection, control discovery, visual evidence, and owned-resource cleanup. Use [Project Knowledge Base](../../skills/project-docs/SKILL.md) for the saved artifact's existing documentation owner. Compose these procedures rather than recreating them.
- Prefer an inline SVG for a quick chat sketch; a browsable preview can be standalone HTML, native controls, small local JavaScript, and scoped CSS. Reuse installed tools and design conventions. Do not impose a framework, single-file format, or new browser/server runtime.

## Ground the Design

1. Read the supplied ticket/design source and relevant application fields, control labels, terminology, theme, and layout. Inspect only the source needed to ground the preview. Distinguish observed UI from source-derived reconstruction; a reconstruction is not a screenshot.
2. Establish the intended comparison baseline. The newest implementation may be the rejected design, not the baseline. When the user corrects the baseline, update the comparison, captions, and affected states together; preserve unrelated accepted decisions.
3. Name the review question and requested states. Include applicable before/after, configuration, progress, action, cancellation, and correction/reset states in their application context—not an unrelated component gallery. Keep confirmed requirements, proposed behavior, and unresolved decisions beside the relevant state.
4. Mark fictional data, independent examples, local-only state, and unsupported actions visibly. Leave unsettled permissions or aggregate acceptance/rejection rules unresolved instead of inventing a working rule. No production endpoints, credentials, or real writes belong in the preview.

## Build One Review Surface

1. Default to one coherent page, with same-page sections for related examples and consistent header, typography, spacing, and navigation. Honor a requested multi-page structure when it serves the review.
2. Reuse familiar controls when they fit: labeled radios, range/number inputs, progress indicators, and dialogs. Keep unique DOM IDs, accessible names, keyboard operation, and appropriately scoped styles/scripts when combining sections. Independent examples must not alter one another's state.
3. Make the requested interactions observable. Cancellation must preserve or stop the appropriate local state; reset/correction must return the demonstrated state to its stated baseline. Keep unsupported behavior explicitly inert rather than giving a misleading success message.
4. Replace obsolete drafts and links only within authorized ownership/removal scope; do not retain a competing archive by default. Never remove unrelated or user-owned designs merely to simplify the page.

## Verify the Real Preview

For a chat-only sketch, inspect the rendered sketch and state its static limits; do not create files or start a browser/server just to complete this workflow.

For a browsable artifact:

1. Reuse a documented loopback-only static server, or direct file opening when the page supports it. Serve only the intended artifact directory; do not expose the repository or bind all interfaces. An independent preview should not require the application's database or services. Do not silently install tooling.
2. Follow Browser QA's distinction between ordinary user-led Firefox opening and owned isolated automation. Honor the requested browser and visibility. Opening a URL alone is not interaction or authentication proof.
3. Exercise the actual native controls and same-page navigation. Observe action, cancellation, reset, and independent example state where applicable. Inspect desktop and narrow layouts for readable content, accessible controls, and overflow; inspect screenshots and browser console/page errors. Report an unavailable interaction or engine as unverified.
4. Run applicable existing formatter, whitespace, and lint checks. Browser QA does not establish HTML/CSS lint coverage; report absent or unrun coverage separately. Do not add a runtime or permanent test suite solely to validate a disposable design.

## Save and Reopen

Saving and publication are separate decisions. Keep a chat-only request in chat; save only to the authorized location. If a branch/commit/publication is requested, follow the project's existing Git workflow for the scoped design artifacts and verify the pushed ref when pushing is authorized. Do not silently publish a local-only design.

For an authorized saved preview, link from the project's existing discoverable documentation entrypoint to the artifact and its short startup instructions. Record actual, worktree-relative values for:

- Artifact path, saved branch/revision when applicable, and the intended baseline/source references.
- Prerequisites and the exact launch command, working directory, loopback URL, and port.
- How to refresh after edits; what to do if that port is occupied without killing an unrelated server.
- How to stop the owned server and the requested retention/disposal boundary.
- Fictional/local-only behavior, unresolved decisions, and remaining verification limits.

Keep project-specific paths and ports in that project's instructions, not this generic workflow. Reopen the saved artifact from those instructions in a fresh process or a separate agent context without relying on conversation memory. Confirm that no application stack is required. Verify a published branch from the authorized remote when publication was requested; a local commit is not publication proof.

## Completion and Handoff

Give the preview or its authorized link, what can be reviewed, remaining product questions, and the browser/checks actually exercised. For saved work, include the reproducible startup entrypoint and retention disposition. Clearly separate prototype acceptance from implementation authorization; transition to [Feature](../../skills/feature/SKILL.md) only when application delivery is explicitly requested.
