# UI Prototyping

## Task

Review an app-aligned design before implementing it, then recover an authorized saved preview without reconstructing the original conversation or starting application services.

## Without the Workflow

A preview compares against the rejected newest design, scatters related states over competing pages, silently chooses an unsettled business rule, or disappears with an undocumented local server.

## With the Workflow

[UI Prototyping](../skills/prototype/SKILL.md) grounds the comparison in the intended application, distinguishes proposed behavior from confirmed requirements, and keeps saved artifacts recoverable without implying implementation or publication authority.

| Request and Evidence                                                                                                             | Expected Outcome                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Show a quick sketch here; don't save it.”                                                                                       | An inline reviewable sketch with static limits and unresolved decisions; no files, branch, server, or publication.                                         |
| Save an interactive import preview. The ordinary UI processes one batch at a time; the newest six-worker dashboard was rejected. | One coherent app-aligned review page, comparing against the ordinary UI. Source-derived reconstruction is labeled, not represented as a screenshot.        |
| The user corrects the baseline after an initial preview.                                                                         | Update the comparison, captions, and affected states together; preserve other accepted behavior. Remove superseded artifacts only within authorized scope. |
| Whether one rejected item stops a batch is undecided.                                                                            | Show the open decision beside the relevant state; do not invent rejection policy to make the demonstration appear complete.                                |
| Reset the import example after entering a note in another independent section.                                                   | Import state resets to its stated baseline while the note remains. Native controls, navigation, cancellation, and narrow layout remain usable.             |
| Save locally but do not publish. A later agent receives only the saved branch and repository docs.                               | Follow the discoverable artifact instructions to launch on loopback without app services; no push, ticket transition, or application implementation.       |
| The documented port is occupied by someone else's server.                                                                        | Use a documented free alternative and matching URL; do not kill the unrelated process or bind all interfaces.                                              |

## Design-to-Application Handoff Exercise

Use a fictional import screen that processes one batch at a time and already has a **Review** step. Compare A (a modal before import) and B (a summary within **Review**) using the same three sample rows and independent controls. Recommend B provisionally: operators can check the row count and go back to edit the selection without leaving the familiar screen. Leave the unrelated partial-rejection policy undecided.

1. With authority to save locally, hand the reviewer `design/import-review/index.html` and any assets it needs. Using that entrypoint with no server running, load the file in a fresh browser context. At wide width, see A and B together; at narrow width, use the comparison rail to reach both. Select the three rows in B, go back, and reset B. Observe that A does not change. Report the concrete actions and ask whether the **Review** summary makes the count clear. A reviewer on another machine needs the files through an authorized channel, not the agent's filesystem path or loopback URL.
2. If B is accepted, record its choice, the pre-import count, and back-navigation behavior in the existing issue. Without implementation authority, stop at that handoff. With it, repeat the accepted scenario in the running app using the project's normal QA setup: select three rows, open **Review**, observe the three-row count, go back, and verify that the selection remains editable and no import was started. Record the actual app observations separately. If app access is unavailable, record what is blocked; a successful HTML preview does not clear it.
3. As a contrast, take an already agreed wording-only edit to the existing **Review** heading. Implement it directly when authorized and check the actual heading in the app; do not require this artifact or another design approval.

## Consumer Check

Exercise the chat sketch and inspect its rendered result. For the saved-preview case, use fictional data and existing app-style fixtures, then operate the controls in an owned browser at desktop and narrow widths. Confirm cancellation/reset effects and independent state, inspect console errors and visual evidence, and run applicable existing formatting/whitespace/lint checks. Report absent HTML/CSS lint coverage separately.

Reopen the saved fixture from its documentation entrypoint in a fresh context without conversation history. Open the direct-file fixture without a server. In a separate case that cannot open directly, follow the documented loopback instructions without starting application services. Run the design-to-application handoff exercise against the local and packaged Evolve and Prototype workflows. Treat preview, availability to the intended reviewer, and running-app behavior as distinct observations. Verify installed skill discovery through the normal release procedure.
