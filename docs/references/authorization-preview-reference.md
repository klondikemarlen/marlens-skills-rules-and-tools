# Authorization Preview Reference

`authorization-preview` shows caller-supplied context in a temporary local browser page before an explicit continuation to an HTTPS destination. Use it for sign-in, approval, document review, or another browser handoff. It explains why the agent is redirecting the user; it does **not** certify the destination's identity, safety, permission scope, or suitability for credentials. Continuing only navigates, not authorizes or completes the described action.

Read the action, reason, target, next step, and website first. Use **Full address and request details** to inspect the exact URL and background context before continuing; expanding it does not navigate or approve anything. The concise safety note remains visible beside the actions. When preparing a request, use short, concrete language about the person's task rather than repeating explanations of how the helper works.

## Try the Demo

```sh
authorization-preview --demo
```

The demo needs no JSON input, credentials, or real provider challenge. It uses built-in sample context and is visibly labeled **Demo only**. **Try Continue** completes locally with a `demo-completed` result and never returns an external redirect; Cancel and expiry retain their normal behavior. It ignores stdin rather than turning piped data into a live request. Run it again for another independent preview.

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

The request has exactly these top-level fields; unknown fields are rejected:

```json
{
  "action": "Review a prepared publication in npm",
  "target": [
    { "label": "Package", "value": "@example/package" },
    { "label": "Version", "value": "1.2.3" },
    { "label": "Registry", "value": "https://registry.npmjs.org/" },
    { "label": "Dist-tag", "value": "latest" },
    { "label": "Prepared artifact", "value": "prepared artifact identity" }
  ],
  "reason": "Why this manual step is required.",
  "context": {
    "agent": "release agent",
    "repository": "example/project",
    "task": "release issue #42",
    "whatHappened": "The package was staged after the prepared checks passed.",
    "completionEffect": "npm will publish the staged artifact if its own approval succeeds.",
    "issueUrl": "https://github.com/example/project/issues/42",
    "pullRequestUrl": "https://github.com/example/project/pull/43"
  },
  "destinationUrl": "https://www.npmjs.com/package/@example/package?challenge=..."
}
```

- `action`: required plain-language description, up to 200 characters. There is no fixed operation list or provider-specific behavior.
- `target`: 1–20 ordered objects with exactly `label` (up to 100 characters) and `value` (up to 2,000 characters). Describe the actual document, account, artifact, or other target. Mark unknown material details explicitly, such as `Not supplied`; do not invent account identities, requested permissions, or artifact metadata.
- `reason`: required explanation of why this step is needed, up to 2,000 characters.
- `context`: requires `agent` (500), `task` (1,000), `whatHappened` (2,000), and `completionEffect` (2,000 characters). `repository` is optional (500 characters) for handoffs not associated with a repository. `issueUrl` and `pullRequestUrl` are optional absolute HTTPS links without embedded credentials, up to 2,000 characters. Provided context is shown as plain text or an explicitly clicked link.
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
