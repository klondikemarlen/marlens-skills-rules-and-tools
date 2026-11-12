# OMP Plugin Install Reference

## Routine Install

Use the generic GitHub repository reference for normal installation and reinstall. It follows the repository's default branch and is the correct path for routine development and release verification when the project documents that command:

```bash
omp plugin install github:OWNER/REPOSITORY
```

A generic GitHub reference is not a claim that the plugin manager installed a particular semantic version. Verify the installed version with `omp plugin list` or the project's documented version command.

## Exact Artifact Verification

Use a full commit hash only when reproducing an exact artifact or diagnosing stale plugin-cache state. Keep `--force` on this exceptional path so the requested revision replaces a cached install:

```bash
omp plugin install github:OWNER/REPOSITORY#FULL_COMMIT_HASH --force
```

A release tag may be useful when the project explicitly asks for that release, but it is not the routine install default. Do not describe an unpinned GitHub reference as a versioned release unless the plugin manager documents that guarantee.

## Released-Plugin QA

Within an authorized plugin release/install task, verify the released remote artifact, discover the installed plugin's exact identifier and installed CLI's uninstall syntax, uninstall only that selected package, then install the released artifact through the project's documented route. Record its observed installed version/source. Do not remove unrelated packages or alter model/provider configuration. Installation alone is not identity or behavioral proof.

Start a new OMP process: existing processes retain extension modules loaded at startup. Exercise the changed behavior and real command/argument autocomplete where that surface exists; distinguish successful discovery from completed execution. For guidance-only changes, use bounded contrasting decisions against the installed guidance rather than claim a runtime feature was exercised. Record missing prerequisites or a process that returns no answer as missing evidence, not PASS, and do not repeat unchanged successful checks.

### Disposable Native QA Adapters

Native OMP extension and context objects can contain non-enumerable members. Object spread is not a safe forwarding adapter: an observed OMP 18.12.6 QA adapter lost `setLabel`, `agent`, and `hasUI`, preventing registration or silently suppressing work. Inspect the installed API rather than assume that runtime observation applies to every version.

Prefer explicit forwarding of the small set of used API methods, preserving their original receiver. When transparent context forwarding is necessary, use a target-bound proxy with `Reflect.get(target, key, target)` and bind callable members to the original target; override only the intended isolated field. Apply isolation to both event and command contexts. Confirm the extension's command is registered before invoking it, preserve actual authentication and model routes, and keep probes and generated state disposable. A mock context or successful adapter construction does not establish native behavior.

Wrap the actual context supplied to each callback rather than retaining another handler's context. Keep command and event contexts distinct: command-only session controls must not leak into event handlers. Consult the installed `ExtensionContext`/`ExtensionCommandContext` contract; the [upstream type owner](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/src/extensibility/extensions/types.ts) is a discovery aid, not proof of the installed version.

If native QA launches disposable GUI processes, isolate their display as well as HOME/config/runtime state, using an already-supported headless display such as Xvfb where available. Retain process/window ownership; do not repeat failed starts on the operator's desktop. Discover required session-bus/runtime dependencies rather than assuming an empty replacement runtime directory works. Missing isolation blocks that GUI probe; it does not authorize another runtime installation or interference with ordinary desktop services. Claim restore and cleanup only from observed outcomes.

## Applying Installed Updates to the Current Session

After an authorized local plugin update that needs a new process, prefer arranging a graceful restart of the current eligible managed session over handing the user a generic “restart OMP” step. Finish delivery, fresh-process QA, and required final review first; honor an explicit instruction not to restart. Publication upstream alone is not a reason to restart a local session.

Use the installed [Instance Control interface](https://github.com/klondikemarlen/omp-instance-control#usage). Discover the invoking instance and verify its launcher/session identity and profile/config-root scope against live registration; a matching working directory alone is insufficient. A control-instance ID identifies one running launch, not the persisted conversation, and changes on replacement.

For a shell tool targeting its own verified instance, request acknowledgement without waiting:

```bash
ompi control restart CURRENT_INSTANCE_ID --no-wait
```

Replace the placeholder with the verified control-instance ID. In managed OMP, bare `/ompi restart` selects the invoking instance. Do not use `ompi restart <session-id>` or wait inside the selected session's tool call for its own replacement: that wait can prevent settlement. Preserve the existing model, provider, credentials, and launch scope.

An accepted request means pending restart. Report “Restart requested; this session will resume with the installed update,” not “restarted.” OMP and Instance Control own active/queued-work settlement, transcript persistence, graceful shutdown, and reopening the same conversation. Never replay queued prompts or inject a continuation command.

The replacement waits for input; restart does not automatically start another model turn or run a suggested command such as `/retitle analytics`. Completion evidence is the controller's live replacement confirmation, correlated by operation and previous instance through `lastRestart`, not disappearance of the old PID. An authorized external observer can verify that state; the exiting agent must not promise a later spoken confirmation. Installed version, restart completion, and proof of loaded plugin behavior remain separate claims.

For an unwrapped, ephemeral, unavailable, ambiguous, or unsupported instance, explain the missing prerequisite and give the supported manual fallback. A plain OMP session with the controller installed may use `/ompi take-over` through its explicit manual handoff; do not perform takeover implicitly. Never kill processes, inject terminal input, or select a different session to simulate restart.

Restart-all remains an unresolved policy choice, not a default. Do not request it merely because a plugin was published or installed. Any broader restart needs explicit scope authorization covering affected sessions and profile boundaries, active/queued work, partial failures, and the user's ability to decline; unrelated sessions stay untouched.

## Documentation Rules

- Keep project-specific repository names, versions, and reinstall commands in the project README or release workflow.
- Put the generic-versus-exact policy in shared guidance such as this reference or the feature workflow.
- Follow [Released-Plugin QA](#released-plugin-qa) after a published merge or release; record observed remote and installed identities, fresh-process behavior, and autocomplete rather than equating reinstall with verification.
