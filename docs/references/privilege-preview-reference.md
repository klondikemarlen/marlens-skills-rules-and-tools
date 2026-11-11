# Privilege Preview Reference

`privilege-preview` explains what is about to happen in a GNOME window before running any caller-selected command. Use it when an upcoming action or window would otherwise be confusing. GPG signing, administrator checks, and application/key unlocks are examples, not an allowlist: a command need not request credentials or open another window. Select ordinary-user or administrator execution separately from the explanation. Use it only for an already-authorized task. It does not intercept arbitrary popups, collect passwords, change system policy, or install a root daemon.

The window leads with the affected resource, meaningful progress, why the operation is needed, and the execution identity. **Details** exposes the exact command, working directory, user goal, intended effect, and requesting agent. **Continue** immediately closes the explanation and permits only that command to proceed. Any credentials stay in the existing OS/application UI; the caller still waits for the actual command result.

| Execution                          | Operation After Continue                                                         | Credential UI                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `administrator` (existing default) | Pass the exact command to `pkexec` as root.                                      | The system's polkit agent, when policy requires authentication.                        |
| `current-user`                     | Run the exact command directly as the invoking user, without `sudo` or `pkexec`. | The application's normal native credential UI, when needed; for example, GPG pinentry. |

## Prerequisites

Run from a non-root Linux desktop session with Node.js supported by this package and `/usr/bin/python3` with PyGObject, GTK 4 and libadwaita supporting `Adw.ToolbarView`. Administrator execution additionally requires `/usr/bin/pkexec` supporting `--keep-cwd` and `--disable-internal-agent`, plus a working system polkit authentication agent. Current-user execution needs the selected command and any UI it normally uses; graphical GPG pinentry is one example, not a requirement for other commands. Missing preview prerequisites fail without execution; the helper never retries with a terminal password fallback. The package does not install system libraries or alter authentication policy.

## Try the Safe Demo

Inside OMP, type:

```text
/privilege-preview demo
```

Command and `demo` argument autocomplete are available. This slash command accepts only the demo; it cannot submit an execution request or forward arbitrary CLI arguments. Restart OMP after installing an update to load the command.

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
  "execution": "administrator",
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

### Application and Key Unlocks Without Elevation

Set `"execution": "current-user"` when the operation needs the invoking user's application credentials, not root. This applies to GPG signing, keyring access, and other explicitly selected native commands that use their normal credential UI; it is not a GPG-specific adapter.

For source signing, identify the actual prepared package/version, signing key fingerprint, exact file paths, and intended effect before constructing the request. This illustrative request signs one file; replace the sample artifact paths and `SIGNING_KEY_FINGERPRINT` with verified values. It does not authorize signing by itself:

```json
{
  "execution": "current-user",
  "target": [
    { "label": "Package", "value": "example-package 1.2.3" },
    { "label": "Signing key", "value": "SIGNING_KEY_FINGERPRINT" }
  ],
  "reason": "GPG may ask to unlock this user's signing key to create the detached signature. Administrator access is not needed.",
  "context": {
    "agent": "Release assistant",
    "task": "Sign the reviewed example-package 1.2.3 source artifact",
    "whatHappened": "The artifact is prepared for the separately authorized signing step.",
    "completionEffect": "Create the named detached signature as the invoking user. Do not upload or install anything."
  },
  "command": {
    "executable": "/usr/bin/gpg",
    "arguments": [
      "--local-user",
      "SIGNING_KEY_FINGERPRINT",
      "--detach-sign",
      "--output",
      "/absolute/path/example-package_1.2.3.tar.xz.sig",
      "/absolute/path/example-package_1.2.3.tar.xz"
    ],
    "cwd": "/absolute/path"
  }
}
```

Use the existing GPG agent and native pinentry; never put a passphrase, PIN, token, or unlock secret in the request, command arguments, logs, screenshots, or chat. Do not use root plus `runuser` to reach the user's keyring. Do not copy keys, change ownership, or weaken authentication/cache settings to avoid a prompt. A cached unlock may mean no password window appears; the preview still explains the operation.

After successful execution, verify the signature against the intended public key and artifact, and check ownership independently. For Debian source signing, verify the actual `.dsc`/`.changes` signatures and source checksums with the project's documented verification command. Keep signing, upload, and installation separately authorized.

### One Preview per Credential Step

The caller must identify the intended credential steps before starting. If the task needs administrator authorization and then a separate signing-key unlock, submit an administrator request for the administrator operation, observe its result, then submit a distinct current-user request for signing. Each preview explains what that credential authorizes. Do not wrap both operations in one elevated script or present one preview as consent to unrelated password windows.

This is explicit composition, not universal interception of arbitrary child prompts. Commands with several known credential challenges must be decomposed at a supported boundary so each challenge has its own truthful preview. If they cannot be separated, do not launch them under a misleading one-step request; explain the unsupported boundary instead. An unexpected or opaque challenge is a reason to stop, not automatically retry.

### Request Contract

- `execution`: `"administrator"` or `"current-user"`. Omission retains administrator execution for existing requests. Set it explicitly for new requests; invalid supplied values are rejected. This selects execution identity, not which credential a child process may request.
- `target`: 1–20 ordered `{label, value}` objects. The first value is the resource title; additional entries remain visible. Labels allow up to 100 characters and values up to 2,000.
- `reason`: a causal explanation of why this authorized task needs the selected operation now, up to 2,000 characters. Explain access or credentials when relevant, but neither is required. Follow [Writing Useful Task Context](authorization-preview-reference.md#writing-useful-task-context); do not invent a prior failure or pending operation.
- `context`: required `agent` (500 characters), `task` (1,000), `whatHappened` (2,000), and `completionEffect` (2,000); optional `repository` (2,000) identifies the project.
- `command`: absolute `executable`, explicit `arguments` array of at most 256 strings, and an absolute existing directory as `cwd`. Paths allow up to 4,096 characters; each argument up to 8,192. Empty arguments are preserved. Arguments are not a shell command string: expansion, substitution, and pipelines do not occur unless the explicitly selected executable itself interprets them.

Unknown fields, invalid UTF-8/JSON, oversized input, control characters in command strings, and directional overrides are rejected. The input limit is 65,536 bytes. Supplied text is displayed literally, not as markup. The immutable request snapshot is the source of both the display and execution; changing the caller's object cannot change an already displayed request.

## Results and Cancellation

One final JSON result is written to stdout. The command's stdout and stderr both stream to stderr so they cannot impersonate the final structured result.

| Result                            | Meaning                                                                                                                        | CLI Exit   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `demo-completed`                  | Demo finished; nothing authenticated or executed.                                                                              | 0          |
| `command-completed`               | The selected executor returned zero; includes `exitCode` and `signal`.                                                         | 0          |
| `cancelled`                       | Cancel, Escape, or close before confirmation; no executor started.                                                             | 3          |
| `expired`                         | Approval deadline elapsed; no executor started.                                                                                | 4          |
| `authorization-or-command-failed` | Includes the observed exit/signal or launch error; authorization failure and command failure cannot reliably be distinguished. | 1          |
| `interrupted`                     | Includes `executionMayContinue`; interruption before execution starts runs nothing.                                            | 130 or 143 |
| `error`                           | Invalid request or unavailable native dialog; no execution starts.                                                             | 1 or 2     |

Do not retry authentication automatically or fall back to an unexplained terminal prompt. Once execution starts, interrupting the caller cannot guarantee that the command or its descendants stop or that their effects are undone. The preview has already closed after confirmation; an interrupted caller reports uncertainty rather than claiming rollback. Verify the requested effect separately: preview continuation is not authentication, a zero exit status is not signature verification, and signing is not uploading or installation.

## Trust Boundary

This is an informed handoff, not a sandbox. The caller remains responsible for truthful context, task authorization, and choosing one narrowly scoped credential step. Administrator execution passes the displayed executable and arguments to `pkexec` with the displayed working directory and a minimal environment (`PATH` and `LANG`). Current-user execution starts that executable directly with the invoking user's identity and inherited environment, preserving their home, keyring configuration, and desktop session. The request accepts no environment overrides or arbitrary target user.

The immutable request pins strings, not executable or target-file contents. It does not prevent filesystem races, inspect scripts, or limit an explicitly selected shell, interpreter, or package manager. A current-user command can itself request privileges; the helper does not inspect or intercept its child dialogs. Choose commands whose credential steps are understood, and split distinct steps rather than hiding them in a script. Existing OS/application authentication policy remains authoritative. Do not use this helper as a substitute for the specialized ownership and filesystem safeguards required by cleanup operations.
