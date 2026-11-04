# Native Convention Memory

`conventions-memory` rebuilds Marlen's conventions in OMP's native Mnemopi memory from a Git clone. Git-backed Markdown remains the authored, reviewable, recoverable source; the memory database is a derived copy, not the only backup. Push accepted source changes to the remote before relying on another machine to recover them.

## Prerequisites and Boundaries

- Bun 1.4.4 or newer and Git. The importer pins `@oh-my-pi/pi-mnemopi` 18.16.0; the native OMP integration is verified against OMP 18.16.0. Other database/runtime versions require separate compatibility verification before writing.
- An installed MSSRT package and a clone of this repository. Source reads come exclusively from the clone's committed `HEAD`, never unstaged or staged edits.
- An explicitly selected absolute database path. The importer does not discover or change active OMP settings. Stop sessions using the destination and preserve a native export or stopped-database backup before updating an existing bank.
- No model, embedding service, Elasticsearch instance, or original machine's memory database is required. Import uses Mnemopi's native export/import API and a transaction, not custom SQL writes. Initial retrieval is lexical; improved coding adherence is an outcome to measure, not a promise of importing.

## Bootstrap from a Clone

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

## Select the OMP Recall Bank

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

The importer selects committed root agent/commit guidance plus Markdown under `rules/`, `examples/`, and `docs/references/`, `docs/workflows/`, and `docs/templates/`. Packaged skill workflow mirrors, changelog/release history, and unrelated repository files are excluded. YAML frontmatter is metadata, not convention prose. Markdown headings split sections; fenced-code headings remain code.

Each record contains its source path, original line, heading ancestry, committed revision, and immutable GitHub source link. Its stable identity combines the importer namespace, path, heading ancestry, and repeated-heading occurrence. Moving or renaming a section retires the old identity and creates a new one. Reordering same-named headings can change which occurrence owns an identity; the final active text still follows the committed source.

Re-run `sync --apply` after committing an accepted change. The same revision produces no duplicate records. Changed sections replace importer-owned records; absent sections receive a native invalidation timestamp and stop appearing in recall. Reintroduced sections become active again. A revision change refreshes provenance even for text that stayed the same. Imported rows are durable, not expiring scratch memory.

Only records carrying this importer's source, session, and metadata ownership markers are refreshed or retired. A desired ID owned by another source, or already present in episodic memory, aborts the transaction rather than overwriting it. Unrelated memories remain unchanged. Manually editing an imported record is temporary: the next sync restores Git's version. Put durable convention corrections in the source instead.

## Evaluate Retrieval and Adherence

Compare representative tasks using the same model and requirements: once with the Markdown-only workflow, then in a fresh session with native recall enabled. Inspect both the retrieved source and produced code against the actual convention—for example writable Vue composable state, explicit controller-test setup, and meaningful identifier names. Keep retrieval success separate from adherence and from a causal improvement claim. Lexical recall can return adjacent or irrelevant sections; authoritative source links and the ordinary Markdown workflow remain necessary. Memory is background context and does not replace current instructions, authorization checks, or executable verification.
