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
- Use browsable HTML for an interactive design comparison; a chat SVG can illustrate a static sketch but cannot substitute for the comparison. Reuse installed tools and design conventions. Native controls, small local JavaScript, and scoped CSS can suffice; do not impose a framework, single-file format, or new browser/server runtime.

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

### Compare Alternatives Side by Side

When comparing interactive alternatives, default to labeled columns (for example, A | B | C) on the same HTML page. When those columns no longer fit at readable widths, keep them in a visibly scrollable horizontal rail confined to the comparison. Keep every alternative reachable by keyboard and touch. Do not hide alternatives behind a dropdown, tabs, or another one-at-a-time switcher.

Use the same scenario, example data, and comparable starting states in each column so the design differences are what reviewers compare. Give each example its own controls and state; interacting with or resetting one must leave its neighbors unchanged. Label a current favorite as provisional, not accepted.

## Verify the Real Preview

For a chat-only sketch, inspect the rendered sketch and state its static limits; do not create files or start a browser/server just to complete this workflow.

For a browsable artifact:

1. Prefer direct browser opening of the local HTML when that entrypoint supports the required interactions. Keep the needed assets available to the reviewer and verify without a running server; this does not require a single file. If browser restrictions or a real dependency prevent direct opening, reuse a documented loopback-only static server. Serve only the intended artifact directory; do not expose the repository or bind all interfaces. An independent preview should not require the application's database or services. Do not silently install tooling.
2. Follow Browser QA's distinction between ordinary user-led Firefox opening and owned isolated automation. Honor the requested browser and visibility. Opening a URL alone is not interaction or authentication proof.
3. Exercise the actual native controls and same-page navigation. Observe action, cancellation, reset, and independent example state where applicable. Inspect desktop and narrow layouts for readable content, accessible controls, and overflow; inspect screenshots and browser console/page errors. Report an unavailable interaction or engine as unverified.
   For a side-by-side comparison, verify that the alternatives appear together at a suitable wide viewport, then use the narrow rail to reach and operate every column without page-wide horizontal overflow. Exercise a state-changing action and any supplied reset in one column and observe that a neighboring column stays unchanged.
4. Run applicable existing formatter, whitespace, and lint checks. Browser QA does not establish HTML/CSS lint coverage; report absent or unrun coverage separately. Do not add a runtime or permanent test suite solely to validate a disposable design.

## Save and Reopen

Saving and publication are separate decisions. Keep a chat-only request in chat; save only to the authorized location. If a branch/commit/publication is requested, follow the project's existing Git workflow for the scoped design artifacts and verify the pushed ref when pushing is authorized. Do not silently publish a local-only design.

For an authorized saved preview, link from the project's existing discoverable documentation entrypoint to the artifact and its short startup instructions. Record actual, worktree-relative values for:

- Artifact path, saved branch/revision when applicable, and the intended baseline/source references.
- For direct opening, the exact HTML entrypoint and any sibling assets that must stay with it. For a server-backed preview, the prerequisites, working directory, exact launch command, loopback URL and port, refresh instructions, and a safe alternative if the port is occupied.
- How to stop an owned server, if used, and the requested retention/disposal boundary.
- Fictional/local-only behavior, unresolved decisions, and remaining verification limits.

Keep project-specific paths and ports in that project's instructions, not this generic workflow. Reopen the saved artifact from those instructions in a fresh process or a separate agent context without relying on conversation memory. Confirm that no application stack is required. Verify a published branch from the authorized remote when publication was requested; a local commit is not publication proof.

## Completion and Handoff

Give the intended reviewer the preview and, for a browsable artifact, its verified entrypoint and the concrete controls and states to exercise. Explain the recommended option and why it fits the task when a recommendation was requested or a material choice is open. Distinguish the recommendation from an accepted decision. Include the browser/checks actually exercised, open questions, and verification limits.

For a browsable artifact, verify the handoff using the same entrypoint the reviewer will use, not just an agent-only preview URL. A workstation path works only for reviewers with access to that file; `localhost` on the agent's machine does not reach another reviewer. When the reviewer is elsewhere, use an authorized transfer or shared location they can access and provide local opening instructions. If access cannot be established, state the missing access and do not report the preview delivered. Preserve the authorized artifact through review and record its retention disposition.

Clearly separate prototype acceptance from implementation authorization; transition to [Feature](../../skills/feature/SKILL.md) only when application delivery is explicitly requested. Carry the chosen behavior and the states that establish it into that delivery; prototype observations do not prove application behavior.
