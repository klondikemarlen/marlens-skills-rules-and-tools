# Native Convention Memory

Use `/mssrt memory sync on` to make the installed conventions available through OMP's native memory and keep them current after package updates. No repository clone, database path, shell command, or manual refresh is needed for the normal path. Git-backed Markdown remains the authored, reviewable, recoverable source; imported memory is a derived copy, not the only backup.

## Enable in OMP

```text
/mssrt memory sync on
```

Approve the in-OMP explanation once. The command imports immediately and remembers the opt-in. If needed, the explanation names two global changes: select native Mnemopi and use shared recall with project-local conversational retention (`per-project-tagged`). It preserves existing memories, normal recall/retention preferences, embeddings, model/provider routes, and credentials.

After installing a newer MSSRT version, start a new OMP process. Enabled sync refreshes automatically at session start. Repeated starts or `on` calls skip an already-completed source and target. A running process does not pretend to have loaded upgraded code: it asks for a restart if installed files changed underneath it.

```text
/mssrt memory sync status
/mssrt memory sync off
```

`status` separates opt-in state, loaded source, last successful synchronization, last failure, and live recall readiness. A completed import is not proof that recall is ready. If recall is not ready, restart OMP and use `/memory diagnose` if the problem persists. `off` stops automatic MSSRT refresh; it does not delete imported or conversational memories, disable native recall, or undo settings.

The command respects configured shared bank/database destinations. It does not bypass project, environment, overlay, or runtime overrides, edit linked managed configuration, or silently enable an explicitly disabled auto-recall preference. A conflict names the owning setting and required correction. Cancel leaves activation unchanged. Failed imports retain the previous successful result and report the prerequisite; correct it and retry `on`.

Synchronization uses the native transaction and cross-process locks. Concurrent sessions sharing a profile serialize opt-in and completion state; profiles pointing at the same physical database serialize their imports. Only importer-owned records are updated or retired. No scheduler, daemon, model call, embedding service, or automatic dependency installation is involved.

## Prerequisites and Boundaries

- The native command is verified on OMP 18.18.5 and uses the installed package, not a clone's working changes. Restart OMP after installing MSSRT to load its command.
- The importer pins `@oh-my-pi/pi-mnemopi` 18.16.0. Database compatibility was exercised with OMP 18.18.5; other runtime/database versions require compatibility verification before writes.
- The advanced `conventions-memory` CLI requires Bun 1.4.4 or newer, Git, a repository clone, and an explicitly selected absolute database path. It reads committed `HEAD`, never staged or unstaged edits, and does not change OMP settings. Stop sessions using that destination and preserve a native export or stopped-database backup before manual updates.
- Import uses Mnemopi's native export/import API and a transaction, not custom SQL writes. Initial retrieval is lexical; improved coding adherence is an outcome to measure, not a promise of importing.

## Advanced: Bootstrap From a Clone

Inside OMP shell tools, installed package commands are available on the process PATH. In an external terminal, use the installed entrypoint explicitly (adjust the package location if different):

```sh
bun "$HOME/.omp/plugins/node_modules/marlens-skills-rules-and-tools/bin/conventions-memory" sync \
  --source /absolute/path/to/marlens-skills-rules-and-tools \
  --database /absolute/path/to/conventions/mnemopi.db
```

Without `--apply`, this previews the committed revision, source-file count, section count, and destination. It does not open or inspect the database and is not a destination change plan. Add `--apply` to create or synchronize that database. Parent directories must exist and be writable. The JSON result reports inserted, updated, retired, and unchanged sections; errors exit nonzero.

To inspect a native export without opening a database:

```sh
conventions-memory export --source /absolute/path/to/marlens-skills-rules-and-tools
```

Treat exported conventions according to the source repository's visibility. Do not publish an export of a mixed personal-memory database as a convention artifact.

## Advanced: Select a Recall Bank Manually

For a disposable proof or a new installation, create an OMP configuration overlay pointing to the imported database:

```yaml
memory:
  backend: mnemopi
mnemopi:
  dbPath: /absolute/path/to/conventions/mnemopi.db
  scoping: global
  noEmbeddings: true
  llmMode: none
  autoRetain: false
```

Start a **new** process with `omp --config /absolute/path/to/overlay.yml`. This overlay affects only that invocation. It does not update the user's default configuration. `autoRetain: false` keeps this proof from adding conversational memories; it is not a recommendation to disable normal retention. Model/provider routes remain unchanged.

Use `/memory stats` and native `recall` to verify the database and retrieve a known convention. Recall previews can be clipped: read the complete `memory://<id>` or the cited Markdown source before applying detailed guidance. A resumed session may retain an old recall block; a fresh process and session avoid mistaking that cached context for a new import.

Records have global visibility **within the explicitly selected database**. OMP's `global` mode recalls that shared bank. Its `per-project-tagged` mode recalls both the shared and project-local banks; `per-project` normally selects a separate project bank. Do not infer a project-bank filename from the working directory: use OMP's reported bank/database identity. Importing one database does not silently populate every bank. See [OMP's versioned scoping contract](https://github.com/can1357/oh-my-pi/blob/v18.16.0/docs/mnemosyne-memory-backend.md#scoping).

## Source Identity and Refresh

Both paths select root agent/commit guidance plus Markdown under `rules/`, `examples/`, and `docs/references/`, `docs/workflows/`, and `docs/templates/`. Packaged skill workflow mirrors, changelog/release history, and unrelated files are excluded. YAML frontmatter is metadata, not convention prose. Markdown headings split sections; fenced-code headings remain code.

Each record contains its source path, original line, and heading ancestry. The OMP command identifies the installed package version and a deterministic content digest; it does not invent a Git revision or immutable GitHub link for installed files. The CLI captures the clone's committed revision and immutable GitHub source link. Installed records use an epoch timestamp because installed files carry no trustworthy authored date; the actual sync time is recorded separately in command status.

Stable record identity combines the importer namespace, path, heading ancestry, and repeated-heading occurrence, so the two paths can refresh the same owned records. Moving or renaming a section retires the old identity and creates a new one. Reordering same-named headings can change which occurrence owns an identity; the final active text still follows the selected source.

The OMP command refreshes enabled sync at the next session start after an installed update. The advanced CLI requires another `sync --apply` after committing an accepted change. Neither path creates duplicate records for unchanged source. Changed sections replace importer-owned records; absent sections receive a native invalidation timestamp and stop appearing in recall. Reintroduced sections become active again. A revision change refreshes provenance even for text that stayed the same. Imported rows are durable, not expiring scratch memory.

Only records carrying this importer's source, session, and metadata ownership markers are refreshed or retired. A desired ID owned by another source, or already present in episodic memory, aborts the transaction rather than overwriting it. Unrelated memories remain unchanged. Manually editing an imported record is temporary: the next sync restores the selected source. Put durable convention corrections in Git and release them instead.

## Evaluate Retrieval and Adherence

Compare representative tasks using the same model and requirements: once with the Markdown-only workflow, then in a fresh session with native recall enabled. Inspect both the retrieved source and produced code against the actual convention—for example writable Vue composable state, explicit controller-test setup, and meaningful identifier names. Keep retrieval success separate from adherence and from a causal improvement claim. Lexical recall can return adjacent or irrelevant sections; authoritative source links and the ordinary Markdown workflow remain necessary. Memory is background context and does not replace current instructions, authorization checks, or executable verification.
