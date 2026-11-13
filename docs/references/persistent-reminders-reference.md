# Persistent Reminders Reference

Use `/remind` when you want a **one-shot reminder for yourself**, not repeated model execution. `/loop` repeats prompts after yields; reminders never invoke a model, execute the remembered task, install software, or carry an earlier approval forward. There is one slash name, `/remind`; typing `/rem` discovers it and its description. The extension also exposes `remind_create` for an assistant acting on an explicit reminder request. That tool still requires your interactive review; it cannot silently save a reminder in print/RPC mode.

## First Use and Routine Use

Linux prerequisites are an existing systemd **user** manager, Node on PATH, `flock`/`cat`, `notify-send`, and a running desktop notification service. Nothing installs these prerequisites. Log into your normal desktop; a headless login or an unavailable notification service cannot guarantee a visible notification. Loading the plugin never enables a timer or runs remembered tasks.

1. Run `/remind setup`. Read and accept the separate activation prompt. It creates only this feature's user service/timer and private finite dispatcher. It does not enable lingering, change the shared user-manager environment, or manage unrelated services.
2. Run `/remind create tomorrow at 09:00 | check the PPA release`. Optionally specify an IANA zone: `/remind create tomorrow at 09:00 | America/Vancouver | check the PPA release`.
3. Review the exact resolved date, local time, timezone, UTC instant, message, project, session ID, and session file. Cancel to save nothing. The confirmed ID appears **only after durable persistence succeeds**. A due time that passes during review must be resolved and reviewed again.
4. Use `/remind list`, `/remind show ID`, and `/remind cancel ID`. IDs must match exactly; cancellation never touches another reminder. `list` retains history as well as pending records.
5. Use `/remind status` for enabled state, timer health, private state path, runtime readability/executable prerequisites, installed/current package versions (`needsRefresh`), and records. `/remind off` stops/disables only this timer, retaining records. `/remind setup` explicitly resumes delivery and catches up pending overdue work.

Time input is deliberately strict: `tomorrow at HH:MM` in the selected zone (the system zone by default), or `YYYY-MM-DDTHH:MM[:SS[.sss]]Z` / an explicit `±HH:MM` offset. Bare dates, `next Monday`, offset-free ISO times, invalid dates, and past times are rejected. Nonexistent or ambiguous local times at a daylight-saving transition are rejected rather than guessed; give an ISO time with the intended offset. An ISO offset selects an absolute instant; the review also shows that instant in the chosen display timezone. To change a message or due time, cancel and create a new reviewed reminder.

## Delivery, Return, and Session Safety

The single `mssrt-reminders.timer` checks once a minute using a short-lived `Type=oneshot` service. It is not a permanent daemon and creates no per-reminder units. The timer is persistent, so a missed check is caught up when the user manager next runs; it does not wake a powered-off machine. A user login is normally required after reboot. Delivery is at the next available minute/check after login or wake, not a precise alarm clock, and desktop Do Not Disturb settings may hide or delay a notification even when the notification service accepts it.

All reminders overdue at a check are delivered in **one summary notification**, showing up to five messages/projects/session IDs and a count of the rest. Use `/remind list` for the complete backlog. Cancellation and concurrent checks share a kernel-backed lock. Delivery state is claimed durably before notification, and completed records are not automatically resent. Notifications are plain escaped text, not shell commands, and the notification does not open any session. When returning to OMP, a bounded summary surfaces due records whose delivery status has not yet been surfaced in OMP, including reminders delivered while OMP was closed.

Exactly-once notification display is **not promised**: a crash or timeout around the external desktop notification can leave delivery uncertain. Such a reminder is not retried automatically (avoiding a duplicate flood). `/remind show ID` explains the failure. Inspect your desktop/history first; `/remind retry ID` requires a separate confirmation acknowledging that an already-delivered notification may be duplicated. Failures of the desktop service are retained as uncertain rather than discarded or silently marked delivered.

`/remind show ID` checks that the original session file still contains the saved session ID before showing a quoted manual `cd ... && omp --session ...` command. No command is run automatically. If the file was moved, removed, or replaced, it prints the original path/ID and asks you to locate that exact session manually; it never falls back to the newest/different session. The original project may also have moved: inspect the displayed path before running the command. No credentials are stored; message, project and session metadata remain private local user data.

## Persistence, Upgrades, and Recovery

State is stored in `$XDG_STATE_HOME/mssrt-reminders` (default `~/.local/state/mssrt-reminders`), with directory mode `0700` and durable atomic `state.json` writes at mode `0600`. Records survive OMP restarts, reboot, and package replacement. Units live under `$XDG_CONFIG_HOME/systemd/user` (default `~/.config/systemd/user`). Do not edit `state.json` while a dispatcher or OMP reminder operation is running; preserve backups before recovery.

Setup copies its finite dispatcher and required modules into a private runtime bundle and atomically updates a stable `dispatch.mjs` symlink. Systemd uses that stable path and an absolute Node executable, not OMP's package cache or process PATH. Thus removing/updating a plugin package does not strand already-saved reminders. The dispatcher keeps the version copied at setup: **after upgrading the plugin, explicitly run `/remind setup` again** to refresh it. Old private runtime bundles can remain as recovery material; do not remove the active symlink target. If Node moves/disappears, reinstall/provide Node through your normal approved setup and re-run `/remind setup` to record the new executable.

Use `/remind status` first when a reminder is missing. Inspect `systemctl --user status mssrt-reminders.timer mssrt-reminders.service` and `journalctl --user -u mssrt-reminders.service`. Inactive/missing units require an explicit `/remind setup`; a disabled state requires setup as well. Notification errors require a working desktop notification service followed by an explicit retry of uncertain IDs. Corrupt/incompatible state fails closed without replacing the file: preserve it, disable the exact timer with `systemctl --user disable --now mssrt-reminders.timer`, and recover a trusted backup before setup. Never resolve a corrupt state warning by silently deleting the user's records.

To uninstall delivery, run `/remind off` **before** uninstalling the plugin. Off retains state/history/runtime and unit files for recovery; package uninstall alone does not undo a prior explicit scheduler activation. To remove those retained files permanently, first back up any wanted history, confirm this timer is disabled, and remove only the displayed feature-owned paths. This is separate from deleting an OMP session or project.

## CLI and Isolated QA

`omp-remind` is on OMP's process PATH. From a checkout/external shell, use `node /path/to/package/bin/omp-remind`. Run `help` for JSON creation input. CLI `setup`, `create`, and `retry` print their resolved review then require the explicit words `enable`, `schedule`, and `retry` respectively; they have no implicit yes flag. `dispatch` is finite and respects the persisted opt-in state.

For isolated real-manager QA, use **all three** options consistently: a fresh `--state-dir`, a fresh `--unit-dir`, and a unique `--unit-name mssrt-reminders-qa-NAME`. Custom unit files are linked into the same real user manager under only that unique name. They still require the current desktop notification service; isolation does not fake visibility. Do not reuse the production unit name or production state. Example setup:

```sh
qa_dir=$(mktemp -d)
qa_unit="mssrt-reminders-qa-$(date +%s)"
node bin/omp-remind --state-dir "$qa_dir/state" --unit-dir "$qa_dir/units" --unit-name "$qa_unit" setup
```

Use a dedicated disposable OMP session, its real session ID/path, and a future ISO-offset time in CLI `create` JSON. Review the visible resolved values and type `schedule`. Create a second reminder and cancel its exact ID. Exit OMP; confirm a fresh CLI `list` still has the first reminder pending and only the second cancelled. Wait for the actual timer and observe the desktop notification, then check status/journal and run `dispatch` again: no second notification should appear. To check catch-up, stop only the isolated timer, create a near-future reminder while opt-in remains on, wait until it is overdue, then start that timer; one summary should arrive. Never alter the production clock or global services.

Cleanup after this isolated scenario:

```sh
node bin/omp-remind --state-dir "$qa_dir/state" --unit-dir "$qa_dir/units" --unit-name "$qa_unit" off
systemctl --user disable "$qa_unit.service"
# Inspect only these named units/paths; preserve desired evidence before deleting qa_dir.
systemctl --user daemon-reload
```

Focused automated contracts run with `npm run test:reminders`. The adapter tests import TypeScript directly using Node's `--experimental-strip-types` flag, supported by the repository's Node 22.13+ development baseline. They use temporary private records, an explicit injected plugin state path, and an injected notification boundary, not global state rewrites or real desktop/user units. They exercise strict DST/time parsing, restart persistence, cancellation isolation, off behavior, concurrent/batched catch-up, uncertain delivery/retry, session identity safety, malformed-state preservation, review-before-save/decline, and headless startup preserving a notice for the next interactive user. Automated contracts are not proof of a real desktop notification or slash autocomplete: capture those separately in a fresh OMP process (type `/rem`, inspect description and argument completion, and exercise review/cancel/save). Full machine reboot and sleeping-desktop behavior remain separate manual scenarios, not claims inferred from persistence tests.
