# Authorization Preview Reference

`authorization-preview` shows caller-supplied context in a temporary local browser page before an explicit continuation to an HTTPS destination. Use it for sign-in, approval, document review, or another browser handoff. It explains why the agent is redirecting the user; it does **not** certify the destination's identity, safety, permission scope, or suitability for credentials. Continuing only navigates, not authorizes or completes the described action.

This is a context bridge, not a sign-in instruction page. Lead with the project and work recap: which project this is for, what is changing, and why that work needs the person's help. Keep this explanation visually primary, followed by Continue/Cancel; show the requested step and destination as compact secondary information. A supplied repository stays visible as a Project detail. **Full address and request details** holds the exact URL, what happens after the handoff, and supporting metadata; expanding it does not navigate or approve anything. The concise safety note remains visible beside the actions.

## Writing Useful Task Context

Before sending someone elsewhere, answer “Why am I about to be there?” without assuming they remember the conversation or recognize a project name. Briefly reconnect the step to work they understand: what the affected thing does, what is changing, and why their involvement is needed now. Use a short recap, not a technical inventory, and populate the existing fields:

- `context.task`: the user-facing goal, such as publishing a named product update—not merely a ticket number, unexplained version, or “sign in.”
- `context.whatHappened`: name the project, product, or affected resource in recognizable terms; briefly explain what it does, the meaningful changes or outcome involved, and relevant progress, including what has not happened yet. For a release, summarize the user-visible changes; do not paste a changelog.
- `action`: the specific step needed from the person.
- `reason`: why the task needs this step now, grounded in an actual prerequisite or a decision reserved for the person. Explain the outcome it enables, not routine sign-in mechanics or an expected authentication failure, unless that detail changes what the person needs to do. “Sign in so the CLI can connect” describes a mechanism, not the reason the user's work needs it.
- `target`: the actual affected package, artifact, document, account, or other resource.
- `context.completionEffect`: what the agent can do after successful completion and any remaining boundary. Navigation, authentication, approval, and publication are separate events.

Do not invent task authorization, checks, failures, or a pending release to justify a handoff. If the only purpose is an explicitly requested trial, say that; if the purpose is unknown, establish it before requesting sign-in. The helper can display context but cannot infer its truth or make a circular explanation useful.

### Reusing the Approach on Other Surfaces

The decision context is independent of npm, HTTPS, and the UI toolkit: goal, affected thing and meaningful change, progress, requested action, reason, and intended effect. Keep those concepts as plain data. A future Ubuntu GNOME dialog can present the same short recap before a native permission or confirmation step; it need not reproduce the browser layout or require a repository, package release, or login.

For example, a hypothetical desktop handoff could say: “Snapshot is the backup app you asked me to install. It will let you schedule copies of your files. The package is ready, but installation needs administrator permission. The system prompt will ask you to allow installation; this will not start a backup.” This illustrates the same context questions, not a shipped GNOME feature or verified installation.

Share the explanation contract, not permission handling. `destinationUrl`, loopback serving, browser opening, and navigation-only Continue belong to this browser helper. A future native implementation must identify the actual application or system action, state exactly what confirmation permits, and enforce its own permission, cancellation, and completion boundaries. Do not invent an HTTPS destination for a native action or treat browser continuation as operating-system authorization. No native adapter or generalized permission framework is provided here.

## Try the Demo

```sh
authorization-preview --demo
```

The demo needs no JSON input, credentials, or real provider challenge. It uses this package's 4.0.2 handoff improvements as a concrete example, imagining publication to npm, and is visibly labeled **Demo only**. This repository actually releases through a GitHub merge; no npm login or publication is needed for this change. **Try Continue** completes locally with a `demo-completed` result and never returns an external redirect; Cancel and expiry retain their normal behavior. It ignores stdin rather than turning piped data into a live request. Run it again for another independent preview.

From a source checkout, use `node bin/authorization-preview --demo`. Add `--manual` to obtain the local URL without invoking the OS browser opener, or `--expires-in 120` to shorten its lifetime. Demo mode exercises the same renderer and local lifecycle as a real request, with only the sample input and final navigation replaced.

## Invocation

```sh
authorization-preview < request.json
authorization-preview --manual --expires-in 120 < request.json
authorization-preview --help
```

Real mode reads one JSON object from stdin, with a 64 KiB input limit. It writes no request file. The default mode opens the loopback preview using the operating system's normal-browser opener (`xdg-open`, `open`, or Windows URL handling); it does not launch browser automation or a selected browser profile. An opener failure closes the local server, leaves continuation unavailable, and does not fall back to opening the supplied destination.

`--manual` prints one `preview-ready` JSON line containing the private loopback URL and expiry, then waits for Continue, Cancel, page close, or expiry. The URL contains a random capability; keep it local and do not publish or retain it. `--expires-in` accepts 30–900 seconds and defaults to 300 seconds.

For a user-facing Firefox handoff, do not assume the system opener selects Firefox. Use `--manual`, read the private `preview-ready` URL, and open that loopback preview through ordinary Firefox without a profile override, following [Browser Opening Modes](../workflows/browser-qa-workflow.md#browser-opening-modes). Keep the helper running until the user acts or it expires; a failed Firefox launch must end that invocation without opening the destination. Do not change OS associations or automate the personal profile.

## Request Schema

The request has exactly these top-level fields; unknown fields are rejected. This example uses the same package and changes as the demo, with hypothetical npm publication and a placeholder challenge. It is not a real login request or evidence that publication is needed. For real handoffs, supply current task facts and the exact current provider-issued URL.

```json
{
  "action": "Sign in to npm",
  "target": [
    { "label": "Package", "value": "marlens-skills-rules-and-tools" },
    { "label": "Version", "value": "4.0.2" }
  ],
  "reason": "Sign in so I can publish this update for people installing the package from npm.",
  "context": {
    "agent": "Example release assistant",
    "repository": "klondikemarlen/marlens-skills-rules-and-tools",
    "task": "Release the clearer handoff previews",
    "whatHappened": "Marlen's Skills, Rules, and Tools supplies the skills and workflows your coding agents use. This update makes handoffs explain the work and changes involved, with guidance reusable for future GNOME prompts. The changes are prepared.",
    "completionEffect": "After sign-in and the remaining release checks, I could publish this version. Signing in alone does not publish anything.",
    "issueUrl": "https://github.com/klondikemarlen/marlens-skills-rules-and-tools/issues/1114",
    "pullRequestUrl": "https://github.com/klondikemarlen/marlens-skills-rules-and-tools/pull/1115"
  },
  "destinationUrl": "https://www.npmjs.com/login?next=/login/cli/example-challenge"
}
```

- `action`: required plain-language description, up to 200 characters. There is no fixed operation list or provider-specific behavior.
- `target`: 1–20 ordered objects with exactly `label` (up to 100 characters) and `value` (up to 2,000 characters). Describe the actual document, account, artifact, or other target. Mark unknown material details explicitly, such as `Not supplied`; do not invent account identities, requested permissions, or artifact metadata.
- `reason`: required causal explanation of why this manual step is needed for the requested task, up to 2,000 characters. State the actual prerequisite or decision and the outcome it enables; restating the action is not enough.
- `context`: requires `agent` (500), `task` (1,000), `whatHappened` (2,000), and `completionEffect` (2,000 characters). `task` names the user's goal and becomes the page heading; `whatHappened` briefly identifies the project or affected thing, meaningful changes, and observed progress. The goal, recap, and reason remain visible before Continue; `completionEffect` explains the subsequent work and boundaries under **Full address and request details**, without claiming they have happened. `repository` is optional (500 characters) and, when supplied, appears as a visible Project detail. `issueUrl` and `pullRequestUrl` are optional absolute HTTPS links without embedded credentials, up to 2,000 characters. Provided context is shown as plain text or an explicitly clicked link.
- `destinationUrl`: required exact absolute HTTPS URL, up to 8,192 characters, without credentials, whitespace, controls, or backslashes. Supply printable ASCII; non-ASCII path/query characters must already be percent-encoded. Any HTTPS host and valid port are accepted, including a host that resembles another provider. This is deliberately **not** a provider allowlist or trust decision. The preview displays the parsed origin separately from the exact supplied URL. Continue sends the original path, query, and fragment without rebuilding challenge parameters.

All supplied text must be non-empty and cannot contain control characters other than tabs and line breaks. Each invocation validates and deep-freezes its own request in memory, binding the displayed context and destination to a fresh unpredictable capability. A changed request or replacement URL requires a new invocation and preview. The renderer uses the established `escape-html` library for HTML text and quoted attributes, not a custom encoder or rich-HTML sanitizer. URL validation is a separate boundary; escaping a URL does not make it trustworthy.

## Privacy and Lifecycle

- The server binds only to `127.0.0.1` on an ephemeral port. Its random capability and request data exist only in process memory; the helper does not write them to disk, cookies, or logs. Ordinary result output omits the destination URL and context. The local page intentionally displays the exact URL, which may contain private challenge parameters; do not copy real requests into public logs, issue/PR comments, or screenshots. Manual mode necessarily prints the private local capability URL. Loopback and the capability reduce exposure but do not protect against another process or person with local access.
- The page does not fetch the destination, auto-redirect, or collect passwords, one-time codes, cookies, or provider credentials. All context is agent-provided, not independently verified. A plausible explanation is not evidence that a destination is safe.
- Continue is an explicit same-origin POST. Only after that action does a real session respond with a redirect to the original destination. Cross-origin state changes, GET-based continuation, premature Continue while the normal-browser opener is pending, and stale requests are rejected. Demo Continue ends locally instead.
- Cancel and a best-effort same-origin page-unload beacon terminate without opening the destination. A missed unload signal is covered by the local expiry timer. Closing the preview tab, Cancel, opener failure, and local expiry never retry or trigger a provider action.
- Responses prevent browser caching and external referrer leakage. No external page or asset is loaded by the preview itself. Only the helper-owned loopback server and its OS-opener child are cleaned up; it does not kill an existing browser or process by name.

Local expiry is separate from a provider's link expiry. It closes the server and releases its in-process context and capability; it cannot erase content already rendered in an open browser tab or browser history. Cache controls reduce persistence but do not make the browser an authorization boundary. The helper does not extend, refresh, inspect, invalidate, or retry provider challenges.

## Results and Completion Boundary

After the interaction, stdout contains a JSON result:

| `result`         | Meaning                                                                                                             | `providerCompletion` |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `continued`      | A real Continue POST returned the supplied URL to the browser. Arrival or any subsequent operation is not verified. | `unverified`         |
| `demo-completed` | Demo Continue finished locally without an external redirect.                                                        | `not-attempted`      |
| `cancelled`      | The user cancelled or the preview was closed. No destination was opened by the helper.                              | `not-attempted`      |
| `expired`        | The local preview expired without a completed action.                                                               | `not-attempted`      |
| `launch-failed`  | The normal-browser opener failed; continuation stayed disabled and the local server closed.                         | `not-attempted`      |

Manual mode prints a preceding `preview-ready` line with the private local URL and expiry. Exit code `0` means the local flow completed, including cancellation or expiry, not that a provider approved anything. Validation, internal, and browser-launch failures exit nonzero; SIGINT exits `130` and SIGTERM exits `143`. Verify provider/native command results separately and published artifacts independently when relevant.

## Migrating from the npm-Specific Command

Version 4 replaces `npm-authorization-preview` with `authorization-preview`; there is no legacy alias. Replace `operation` with a descriptive `action`, `authorizationUrl` with `destinationUrl`, and the npm-shaped `target` object with an ordered array of labeled values. The example above preserves npm publication context, but npm is now just a caller. Login callers should include known account and permission details, explicitly marking important unknowns. `context.repository` is no longer required. Update scripts that assumed an npm-only destination or interpreted Continue as approval; the generic helper promises neither.

## Supported Boundary

Callers supply the current destination and truthful context explaining the exact target, reason, prior work, and intended effect. The helper neither acquires a challenge nor proves where a URL came from. It is not an OAuth client, general authorization framework, credential collector, or approval/publication mechanism. It does not change release authority or bypass the safeguard against automatically repeating a prompt the user has reported as opaque.
