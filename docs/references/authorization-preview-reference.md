# Authorization Preview Reference

`authorization-preview` shows caller-supplied context in a temporary local browser page before an explicit continuation to an HTTPS destination. Use it for sign-in, approval, document review, or another browser handoff. It explains why the agent is redirecting the user; it does **not** certify the destination's identity, safety, permission scope, or suitability for credentials. Continuing only navigates, not authorizes or completes the described action.

This is a context bridge, not a sign-in instruction page. Use the affected resource's identity as the title, then explain what is changing and why that work needs the person's help. Keep the requested step and destination compact, with Continue/Cancel directly below. Additional targets and a supplied repository remain visible labeled details; the title is not repeated as a detail row. **Details** holds the exact URL, task, subsequent work, and supporting metadata. The standalone helper retains that context rather than assuming another OMP surface supplies it. Show a compact **Demo** indicator for a trial; reserve status text for pending or unavailable actions instead of repeating successful-state notices.

## Writing Useful Task Context

Before sending someone elsewhere, answer “Why am I about to be there?” with a recognizable resource and one concrete outcome sentence. Lead with the user's work, not the agent's process. The normal preview needs that sentence, relevant project/account details, the requested action and destination, and Continue/Cancel. Add context only when it helps the person choose, then populate the existing fields:

- `context.task`: the user-facing goal, such as publishing a named product update—not merely a ticket number, unexplained version, or “sign in.”
- `context.whatHappened`: optional extra context for this browser helper. Include it only when a meaningful change, blocker, or consequence alters the person's decision and is not already explained by `reason`. Omit it rather than filling a required-looking slot with a progress report, negative-status disclaimer, or repeated goal.
- `action`: the specific step needed from the person.
- `reason`: why the task needs this step now, grounded in an actual prerequisite or a decision reserved for the person. Explain the outcome it enables, not routine sign-in mechanics or an expected authentication failure, unless that detail changes what the person needs to do. “Sign in so the CLI can connect” describes a mechanism, not the reason the user's work needs it.
- `target`: the actual affected package, artifact, document, account, or other resource. Put its recognizable identity first; that value is the title, not a repeated detail row.
- `context.completionEffect`: what the agent can do after successful completion and any remaining boundary. Navigation, authentication, approval, and publication are separate events.

Keep agent execution notes out of the main copy: routine check preparation, “nothing has been published,” expected CLI-authentication expiry, and generic credential-storage/scope disclaimers do not explain the next action. Keep supporting status and remaining steps under **Details** through `context.completionEffect`, or in the task's existing evidence record. Surface a fact before Continue only when it changes the requested action, account/destination choice, or permission decision. This is a relevance test, not a blanket ban on warnings.

| Situation                                              | Useful Handoff                                                                                                                                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in for an already-authorized release              | “Publish the authorized createList update for applications installing FactoryShark from npm.” Show the project, intended account, “Sign in to npm,” destination, and Continue/Cancel. No extra recap is needed. |
| Release checks are still pending                       | Keep the goal accurate without claiming readiness or success; put remaining checks in `completionEffect`, not a leading status report.                                                                          |
| A new grant would allow desktop-wide continuing writes | Explain that consequence and offer the narrower website action before seeking grant acceptance. Do not present it as approval of one upload.                                                                    |

Do not invent task authorization, checks, failures, or a pending release to justify a handoff. If the only purpose is an explicitly requested trial, say that; if the purpose is unknown, establish it before requesting sign-in. The helper can display context but cannot infer its truth or make a circular explanation useful.

## Least Privilege and Continuing Authority

Task permission to perform one operation is not permission to issue reusable account authority. Start with the minimum effective authority needed: anonymous/read-only inspection, resource-scoped access where supported, only required writes, and the shortest practical lifetime. Avoid private-data access, account-wide writes, desktop-wide sharing, administrative privilege, and persistent credentials unless the requested outcome requires them. Prefer action-specific provider website submissions or signed artifacts when they accomplish a bounded task without a reusable grant; do not acquire continuing access merely for automation convenience.

Before opening a new consent prompt, inspect the effective provider/library authorization flow: requested arguments are not proof of the actual grant. Establish the target action, effective scope, lifetime, who can use the authority, credential storage, and authority remaining afterward. Explain these facts before approval; important unknowns must remain explicit, not be presented as narrow permissions. A named application or public-only reusable token is not action-scoped authorization. If the provider cannot limit the grant to the action, explain that limit and offer the narrower viable workflow. Obtain explicit acceptance before acquiring genuinely necessary broader or reusable authority as a separate decision.

Apply that disclosure to the actual grant decision, not as a stock preamble to every navigation preview. For routine sign-in within already accepted access, keep the preview focused on the outcome, intended account, and destination. When a flow would acquire new broader or continuing authority, explain the concrete consequence and narrower alternative concisely before that grant is accepted; do not bury it in **Details** or imply that Continue grants consent. Inspect unresolved material scope rather than replacing the investigation with a list of “not yet verified” disclaimers.

For Launchpad PPA setup, prefer the specific website submission where viable, with separately reviewed signing/upload, rather than replacing revoked tokens. A browser helper that discards `allow_access_levels` and forces desktop-wide integration fails the pre-prompt check even if the caller requested narrow access. Inspect the real helper/provider path before opening consent; if it grants every application continuing read-write authority, do not describe it as approval of one PPA action.

Preserve deliberately authorized ongoing integrations and reuse of already approved access within scope; this is not another prompt for every routine tool call and does not change existing workflow write authority. Never reacquire revoked access without new explicit authorization. For this Launchpad incident the maintainer revoked existing application authorizations: continue through the website and separately reviewed signing/upload without silently substituting a new token.

Review scenarios: read-only inspection must not request writes; a bounded submission must not silently acquire a reusable grant; a library widening requested scope must be caught before consent; accepted ongoing access may be reused without duplicate prompts; revoked access must not be reacquired from prior task approval. This is selection/handoff guidance, not an OAuth implementation, automatic revoker, credential migration, or new approval framework.

## Reusing the Approach on Other Surfaces

The decision context is independent of npm, HTTPS, and the UI toolkit: goal, affected thing, requested action, reason, and intended effect. Include progress only when it changes the person's decision. Keep those concepts as plain data. A native dialog can present the same outcome-led explanation before a permission or confirmation step; it need not reproduce the browser layout or require a repository, package release, or login.

For example, a hypothetical installation handoff could say: “Install Snapshot so you can schedule backups of your files.” The requested step is “Approve installation”; the native prompt identifies the exact command and system changes. This illustrates the context questions, not a verified installation. Follow each surface's own required-field contract.

Share the explanation contract, not permission handling. `destinationUrl`, loopback serving, browser opening, and navigation-only Continue belong to this browser helper. The separate [Privilege Preview](privilege-preview-reference.md) identifies one explicit system command and enforces native confirmation, cancellation, and execution boundaries. Do not invent an HTTPS destination for a native action or treat browser continuation as operating-system authorization.

## Try the Demo

```sh
authorization-preview --demo
```

The demo needs no JSON input, credentials, or real provider challenge. It uses this package's 4.0.3 handoff improvements as a concrete example, imagining publication to npm, and is visibly labeled **Demo**. This repository actually releases through a GitHub merge; no npm login or publication is needed for this change. **Try Continue** completes locally with a `demo-completed` result and never returns an external redirect; Cancel and expiry retain their normal behavior. It ignores stdin rather than turning piped data into a live request. Run it again for another independent preview.

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

### Supervising Human-Length Handoffs

Run the provider command and preview as separately supervised processes whose output and exit status remain observable while the person acts. Do not keep their only handles in an Eval cell that waits synchronously for human input: a cell deadline can destroy the caller's handles without stopping its children. Losing tracking proves neither that the preview stopped nor that the provider failed.

1. Start the authorized provider command under the available process supervisor and capture its exact current challenge privately. Keep the provider's process identity separate from the preview's.
2. Start `authorization-preview --manual --expires-in 900` as a uniquely named supervised process, send one complete JSON request on stdin, and close stdin. In OMP, use a named Bash service with a `preview-ready` log readiness condition, not an Eval-owned child. Its supervisor must allow the full interaction lifetime; a short readiness deadline only bounds startup. The 900-second local lifetime does not extend the provider challenge.
3. Observe `preview-ready`, then open only its private loopback URL with the normal desktop opener or the explicitly selected browser path above. Retain the supervisor identifier for completion and cleanup, not the capability URL in durable records. If opening fails, stop only this preview invocation; never open the destination directly as a fallback.
4. Let the supervisor deliver completion without holding an Eval cell across the interaction. Inspect the final JSON result and exit status. Cancellation, expiry, and loss of tracking are not consent to start another challenge.
5. Check the original provider command independently. `continued` with `providerCompletion: "unverified"` proves only local navigation; publication still requires the native command result and remote artifact evidence.

If tracking is interrupted, recover the exact owned process and its available output through the supervisor before starting anything else. An alive preview is not proof that the provider challenge remains usable. If completion cannot be recovered, report it as unknown and stop only identified task-owned processes before a replacement; do not kill browsers or processes by name.

After a provider challenge has expired or failed, do not replay its URL or extend the local timer to revive it. Within the task's existing retry authority and opaque-prompt safeguards, obtain a fresh challenge from a new provider attempt, then create a fresh request and preview. Preserve the old failure separately from the replacement result. A provider error such as npm's completion-endpoint `E404` does not, by itself, establish that the local preview caused it.

## Request Schema

The request has exactly these top-level fields; unknown fields are rejected. This example uses the same package and changes as the demo, with hypothetical npm publication and a placeholder challenge. It is not a real login request or evidence that publication is needed. For real handoffs, supply current task facts and the exact current provider-issued URL.

```json
{
  "action": "Sign in to npm",
  "target": [
    { "label": "Package", "value": "marlens-skills-rules-and-tools · 4.0.3" },
    {
      "label": "Account",
      "value": "Intended npm maintainer; identity will be verified after sign-in"
    }
  ],
  "reason": "Publish the clearer handoff previews for people installing this package from npm.",
  "context": {
    "agent": "Example release assistant",
    "repository": "klondikemarlen/marlens-skills-rules-and-tools",
    "task": "Release the clearer handoff previews",
    "completionEffect": "After sign-in and the remaining release checks, I could publish this version.",
    "issueUrl": "https://github.com/klondikemarlen/marlens-skills-rules-and-tools/issues/1120",
    "pullRequestUrl": "https://github.com/klondikemarlen/marlens-skills-rules-and-tools/pull/1121"
  },
  "destinationUrl": "https://www.npmjs.com/login?next=/login/cli/example-challenge"
}
```

- `action`: required plain-language description, up to 200 characters. There is no fixed operation list or provider-specific behavior.
- `target`: 1–20 ordered objects with exactly `label` (up to 100 characters) and `value` (up to 2,000 characters). The first value becomes the page and browser-tab title; subsequent entries remain labeled details. Put the recognizable resource identity first, combining its name and version when those identify the subject together. Mark unknown material details explicitly, such as `Not supplied`; do not invent account identities, requested permissions, or artifact metadata.
- `reason`: required causal explanation of why this manual step is needed for the requested task, up to 2,000 characters. State the actual prerequisite or decision and the outcome it enables; restating the action is not enough.
- `context`: requires `agent` (500), `task` (1,000), and `completionEffect` (2,000 characters). Optional `whatHappened` (2,000) supplies additional decision-relevant context after the visible reason; omit it when the reason is sufficient. `task` names the user's goal; it appears with `completionEffect`, `agent`, and the exact address under **Details**, without claiming subsequent work has happened. `repository` is optional (500 characters) and, when supplied, appears as a visible Project detail. `issueUrl` and `pullRequestUrl` are optional absolute HTTPS links without embedded credentials, up to 2,000 characters. Provided context is shown as plain text or an explicitly clicked link.
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
