# npm Authorization Preview Reference

`npm-authorization-preview` shows caller-supplied release context in a temporary local browser page before an explicit continuation to an npm page. It is a small handoff helper, not an authorization service. The preview is not an independently verified statement of npm's identity, challenge, account, or permission scope. npm remains responsible for sign-in and any final approval.

## Invocation

```sh
npm-authorization-preview < request.json
npm-authorization-preview --manual --expires-in 120 < request.json
npm-authorization-preview --help
```

The command reads one JSON object from stdin, with a 64 KiB input limit. It writes no request file. The default mode opens the loopback preview using the operating system's normal-browser opener (`xdg-open`, `open`, or Windows URL handling); it does not launch browser automation or a selected browser profile. An opener failure closes the local server, leaves continuation unavailable, and does not fall back to opening the supplied npm URL.

`--manual` is the bounded no-open option for an operator who will visit the local preview URL themselves, including controlled headless/browser QA. The command does not invoke any browser opener in this mode. It prints one `preview-ready` JSON line containing the private loopback URL and expiry, then waits for Continue, Cancel, page close, or expiry. The URL contains a random capability; keep it local and do not publish or retain it. `--expires-in` accepts 30–900 seconds and defaults to 300 seconds.

For a user-facing Firefox handoff, do not assume the system opener selects Firefox. Use `--manual`, read the private `preview-ready` URL, and open that loopback preview through ordinary Firefox without a profile override, following [Browser Opening Modes](../workflows/browser-qa-workflow.md#browser-opening-modes). Keep the helper running until the user acts or it expires; a failed Firefox launch must end that invocation without opening the npm destination. Do not change OS associations or automate the personal profile.

## Request Schema

The request has exactly these top-level fields; unknown fields are rejected:

```json
{
  "operation": "staged-publication-approval",
  "target": {
    "package": "@example/package",
    "version": "1.2.3",
    "registry": "https://registry.npmjs.org/",
    "tag": "latest",
    "artifact": "prepared artifact identity"
  },
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
  "authorizationUrl": "https://www.npmjs.com/package/@example/package?challenge=..."
}
```

Required fields:

- `operation`: exactly `login`, `publish`, or `staged-publication-approval`. The page labels these separately as sign-in, submitting a publication, or approving an already-staged publication.
- `target`: an object. For `login`, use `account`, `permissions`, or `description` (at least one is required); any omitted account or permission detail is displayed as **Not supplied**. For `publish` and `staged-publication-approval`, `package` and `version` are required; `registry`, `tag`, and `artifact` are optional and omitted values display as **Not supplied**. Do not invent unknown registry, tag, account, permission, or artifact details.
- `reason`: concise plain-language reason this step is needed.
- `context`: requires `agent`, `repository`, `task`, `whatHappened`, and `completionEffect`. `issueUrl` and `pullRequestUrl` are optional absolute HTTPS links without embedded credentials. All provided context is shown as text or an explicitly clicked link.
- `authorizationUrl`: the exact current HTTPS URL supplied by the npm/provider flow. Its authority must be exactly `www.npmjs.com`, with no credentials or port, and the URL must be printable ASCII (non-ASCII path/query characters must already be percent-encoded). The helper rejects HTTP, lookalike hosts, other npm hosts, and backslashes. It retains the original string and sends its path, query, and fragment unchanged after Continue; it does not rebuild challenge parameters.

Each invocation validates and deep-freezes its own request in memory, then binds that context and its continuation URL to a fresh unpredictable capability. A changed request or replacement URL requires a new invocation and a new preview. The presentation renderer escapes caller text and the displayed destination; provider URL validation is separate from presentation. Unknown fields are rejected rather than silently hidden or ignored.

## Privacy and Lifecycle

- The server binds only to `127.0.0.1` on an ephemeral port. Its random capability and request data exist only in process memory; the helper does not write them to disk, cookies, or logs. The command's ordinary result output omits the npm URL and context. The local page intentionally displays the exact URL, including private challenge parameters; do not copy it into public logs, issue/PR comments, or screenshots. Manual mode necessarily prints the local capability URL, which should also remain private. Loopback and the capability reduce exposure but are not an authorization boundary against another process or person with local access.
- The page displays the destination origin and exact supplied URL as escaped text but does not fetch it, auto-redirect, or collect passwords, one-time codes, cookies, or npm credentials. It says the context is agent-provided and directs the user to rely on npm for its actual sign-in/approval decision.
- Continue is an explicit same-origin POST. Only after that action does the local server respond with a redirect to the original supplied npm URL. Cross-origin state changes, GET-based continuation, premature Continue while the normal-browser opener is pending, and stale requests are rejected.
- Cancel and a best-effort same-origin page-unload beacon terminate without opening npm. A missed unload signal is covered by the local expiry timer. Closing the preview tab, Cancel, opener failure, and local expiry do not automatically retry, navigate to npm, or trigger a provider action.
- Responses prevent browser caching and referrer leakage. No external page or asset is loaded by the preview itself. Only the helper-owned loopback server and its OS-opener child are cleaned up; it does not kill an existing browser or process by name.

The helper's local expiry is separate from npm's challenge/link expiry. Local expiry closes the server and releases its in-process request context and capability; it cannot erase content already rendered in an open browser tab or browser history. Response cache controls reduce persistence but do not make the browser an authorization boundary. Local expiry does not extend, refresh, inspect, or invalidate npm's challenge. A challenge can expire earlier according to npm, and the helper never retries it.

## Results and Completion Boundary

After the interaction, stdout contains a JSON result:

| `result`        | Meaning                                                                                                                                      | `providerCompletion` |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `continued`     | The local Continue POST succeeded and the helper returned the supplied URL to the browser. Delivery to or completion by npm is not verified. | `unverified`         |
| `cancelled`     | The user cancelled or the preview was closed. No npm destination was opened by the helper.                                                   | `not-attempted`      |
| `expired`       | The local preview expired without a completed action.                                                                                        | `not-attempted`      |
| `launch-failed` | The normal-browser opener failed; continuation stayed disabled and the local server closed.                                                  | `not-attempted`      |

Manual mode prints a preceding `preview-ready` line with the private local URL and expiry. Exit code `0` means the helper completed its local flow, including cancellation or expiry; it does **not** mean npm approved anything. Validation, internal, and browser-launch failures exit nonzero; SIGINT exits `130` and SIGTERM exits `143`. A `continued` result is never evidence of npm sign-in, approval, or publication. Verify each provider/native command result separately and verify the published artifact independently when relevant.

## Supported Boundary

Callers must obtain the current npm URL from the native provider flow and provide enough truthful context to explain the exact target, reason, prior work, and effect. This helper neither acquires a challenge nor proves that the URL was issued by npm, implements a general authorization framework, changes release authority, or performs live npm approval/publication. It must not be used to bypass the existing safeguard against automatically repeating a prompt the user has reported as opaque.
