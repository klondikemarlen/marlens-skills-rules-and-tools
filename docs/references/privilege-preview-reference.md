# Privilege Preview Reference

`privilege-preview` explains one privileged operation in a native GNOME window before handing its exact executable and arguments to `pkexec`. Use it explicitly when an authorized task needs administrator access and the person needs context to decide. It does not intercept existing sudo calls, change system policy, install a root daemon, or make an arbitrary command safe.

The window leads with the affected resource, meaningful progress, and why administrator access is needed. **Details** exposes the exact command, working directory, user goal, intended effect, and requesting agent. **Continue** permits that command to proceed through system authorization; GNOME's polkit agent alone handles credentials. The explanation stays open while authentication and execution are pending. Existing polkit authorization may allow execution without a new password prompt.

## Prerequisites

Run from a non-root Linux desktop session with Node.js supported by this package, `/usr/bin/python3` with PyGObject, GTK 4 and libadwaita supporting `Adw.ToolbarView`, and `/usr/bin/pkexec` supporting `--keep-cwd` and `--disable-internal-agent`. A working system polkit authentication agent is required for interactive authorization. Missing prerequisites fail without a terminal password fallback. The package does not install system libraries or alter polkit policy.

## Try the Safe Demo

Inside OMP, type:

```text
/privilege-preview demo
```

Command and `demo` argument autocomplete are available. This slash command accepts only the demo; it cannot submit a privileged request or forward arbitrary CLI arguments. Restart OMP after installing an update to load the command.

For the standard OMP plugin installation, an external terminal can run:

```sh
node "$HOME/.omp/plugins/node_modules/marlens-skills-rules-and-tools/bin/privilege-preview" --demo
```

Use the package's actual installed directory if it differs. The adapter adds package commands to **OMP's process PATH**, not the parent terminal's PATH. A bare `privilege-preview --demo` works in OMP shell tools or when you have separately added the command to your shell.

The demo illustrates a project blocked by missing Git; it does not inspect your machine or install anything. **Close Demo** completes locally. No authentication or command execution occurs. Cancel, Escape, or the window close control dismisses it.

## Customize the Approval Timeout

Unanswered previews expire after **30 minutes (1,800 seconds)** by default, including the OMP demo. Agents can choose an integer from **30 to 86,400 seconds (24 hours)** with the CLI's `--expires-in` option. Expiry cannot be disabled.

For a two-hour approval window, run `privilege-preview --expires-in 7200 < request.json` from an OMP shell tool. To try the same duration without authentication or execution:

```sh
node "$HOME/.omp/plugins/node_modules/marlens-skills-rules-and-tools/bin/privilege-preview" --demo --expires-in 7200
```

The window displays the selected duration. This deadline covers waiting for approval, not authentication or command execution after approval. Choose a duration appropriate to the task, and give the calling shell tool enough time to wait; its own process timeout is independent. The OMP slash command remains demo-only and uses the default duration.

## Submit an Explicit Request

Supply one UTF-8 JSON object on stdin, then close stdin. Keep actual private task details out of public reports. For a separately authorized, read-only elevated identity check:

```json
{
  "target": [{ "label": "Resource", "value": "GNOME Privilege Handoff" }],
  "reason": "The read-only identity check verifies that the selected command runs with administrator privileges.",
  "context": {
    "agent": "Verification assistant",
    "task": "Verify the contextual GNOME privilege handoff",
    "whatHappened": "The native explanation and cancellation paths have been checked. Elevated execution remains to be verified.",
    "completionEffect": "Print the effective user ID. A result of 0 identifies root; no files will be changed."
  },
  "command": {
    "executable": "/usr/bin/id",
    "arguments": ["-u"],
    "cwd": "/"
  }
}
```

Save the request privately and invoke `privilege-preview < request.json` from an OMP shell tool, or use the explicit installed path shown above in an external terminal. The example's progress statement must match your actual checks; it does not itself authorize execution. Review the displayed context and exact operation before choosing Continue. Never send a password to this command or through chat.

### Request Contract

- `target`: 1–20 ordered `{label, value}` objects. The first value is the resource title; additional entries remain visible. Labels allow up to 100 characters and values up to 2,000.
- `reason`: a causal explanation of why this authorized task needs administrator access now, up to 2,000 characters. Follow [Writing Useful Task Context](authorization-preview-reference.md#writing-useful-task-context); do not invent a prior failure or pending operation.
- `context`: required `agent` (500 characters), `task` (1,000), `whatHappened` (2,000), and `completionEffect` (2,000); optional `repository` (2,000) identifies the project.
- `command`: absolute `executable`, explicit `arguments` array of at most 256 strings, and an absolute existing directory as `cwd`. Paths allow up to 4,096 characters; each argument up to 8,192. Empty arguments are preserved. Arguments are not a shell command string: expansion, substitution, and pipelines do not occur unless the explicitly selected executable itself interprets them.

Unknown fields, invalid UTF-8/JSON, oversized input, control characters in command strings, and directional overrides are rejected. The input limit is 65,536 bytes. Supplied text is displayed literally, not as markup. The immutable request snapshot is the source of both the display and execution; changing the caller's object cannot change an already displayed request.

## Results and Cancellation

One final JSON result is written to stdout. The command's stdout and stderr both stream to stderr so they cannot impersonate the final structured result.

| Result                            | Meaning                                                                                                                        | CLI Exit   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `demo-completed`                  | Demo finished; nothing authenticated or executed.                                                                              | 0          |
| `command-completed`               | `pkexec` returned zero; includes `exitCode` and `signal`.                                                                      | 0          |
| `cancelled`                       | Cancel, Escape, or close before confirmation; no executor started.                                                             | 3          |
| `expired`                         | Approval deadline elapsed; no executor started.                                                                                | 4          |
| `authorization-or-command-failed` | Includes the observed exit/signal or launch error; authorization failure and command failure cannot reliably be distinguished. | 1          |
| `interrupted`                     | Includes `executionMayContinue`; interruption before execution starts runs nothing.                                            | 130 or 143 |
| `error`                           | Invalid request or unavailable native dialog; no execution starts.                                                             | 1 or 2     |

Do not retry authentication automatically or fall back to an unexplained terminal prompt. Once execution starts, cancelling the unprivileged caller cannot guarantee that a root command stops or that its effects are undone. The UI disables cancellation after confirmation; an interrupted caller reports uncertainty rather than claiming rollback. Verify the requested effect separately: an exit status alone is not proof of a deployment, installation, or filesystem outcome.

## Trust Boundary

This is an informed handoff, not a sandbox. The caller remains responsible for truthful context, task authorization, and choosing a narrowly scoped operation. The helper passes the displayed executable and arguments directly to `pkexec` with the displayed working directory. It supplies a minimal environment; it does not inherit arbitrary command environment variables or accept environment overrides.

The immutable request pins strings, not executable or target-file contents. It does not prevent filesystem races, inspect scripts, or limit the power of an explicitly selected shell, interpreter, or package manager. Existing system polkit policy remains authoritative. Do not use this helper as a substitute for the specialized ownership and filesystem safeguards required by cleanup operations.
