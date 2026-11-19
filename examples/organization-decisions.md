# Organization Decisions

Use these fictional cases to exercise [Human Readability](../docs/references/code-organization-reference.md#human-readability), [Libraries for Generic Mechanism](../docs/references/code-organization-reference.md#libraries-for-generic-mechanism), and [Readable Agent Instructions](../docs/references/guidance-precedence-reference.md#readable-agent-instructions). Expected decisions are evaluation inputs, not claims of executed review or security certification. Supply the task, current source, local conventions, and material consumer evidence when evaluating a real change.

## Readable Statements

**Before:** A changed publication operation packs validation, persistence, and notification into `validate(input); const record = save(input); notify(record)`. The operations have distinct effects and failure points.

**After:** Keep those three operations in execution order on separate lines with descriptive names. Do not add a wrapper per statement or alter awaiting, transaction scope, or error propagation. Expected decision: reject the packed version; accept the expanded version. A single fluent query or simple inline serializer projection remains valid when its supported contract is clear.

## Dependency Choice

1. A project already uses a maintained parser that supports the required runtime and grammar. A new implementation instead builds a custom tokenizer merely to avoid calling the dependency. Expected decision: reject the unsupported duplication; reuse the existing parser and keep application policy at its boundary.
2. A candidate has many stars, but its publisher identity is unresolved and a relevant known vulnerability has no verified fix. Expected decision: do not approve based on popularity; resolve identity and the security prerequisite or choose an established compatible alternative.
3. A little-used package is selected because its API is short, with no comparison to the existing framework, maintenance, provenance, transitive dependencies, license, or runtime support. Expected decision: reject the unsupported selection, not the package solely because its star count is low.
4. A mature standard-library operation satisfies a small local contract without adapters or a new dependency. Expected decision: accept; do not mandate a third-party package.
5. An established specialized package has few stars but verified ownership, maintained releases, applicable security review, compatible licensing/runtime, and evidence that alternatives cannot meet the required format. Expected decision: a documented exception can be accepted. No star threshold establishes safety or overrides the actual integration evidence.
6. Required provenance or security evidence cannot be recovered. Expected decision: report the exact unavailable prerequisite, not a clean assessment or an invented vulnerability.

## Instruction Organization

**Before:** A reviewer instruction file interleaves ordinary request selection and assessment with repeated details for paging, stale requests, capacity exhaustion, and cleanup. Its final-result rule appears in several slightly different formulations. Expected decision: identify the competing rule owner and hard-to-follow branches; do not reject it merely for length.

**After:** Keep one authoritative final-result rule and a core procedure: establish authority and trigger, select scope, execute, finish applicable assessment, and report the observed result. Label each conditional recovery path and the condition that selects it. Use a goal and bounded caveat for each governing rule. Preserve exact commands, identifiers, pending/failure semantics, and safety constraints. Expected decision: accept when source and consumer evidence establish equivalent authority and behavior, not just fewer words.

**Unsafe extraction:** The revised entrypoint says “follow recovery.md” but the deployed consumer has no tool or loader that can retrieve that file. Expected decision: reject moving mandatory recovery behind an inaccessible link; keep it loaded or use an already-supported retrieval mechanism.

**Supported extraction:** The entrypoint retains the recovery trigger and required stop condition, and a fresh consumer demonstrably retrieves the authoritative conditional section before deciding what to do. Expected decision: accept conditional placement without copying a second policy into the entrypoint.

**Self-contained exception:** A runtime loads one generated prompt and cannot retrieve references. Its existing generator includes the mandatory procedure from one maintained source, with readable sections and preserved semantics. Expected decision: accept; a large loaded prompt is not inherently a defect and does not require a new compiler.

**Unknown consumer:** Only a valid Markdown link is supplied; consumer loading behavior is absent and cannot be recovered. Expected decision: `BLOCKED` for the retrieval claim, not assumed access. Keep any independently evidenced source findings visible.

## Evidence Boundary

Exercise the cases through a fresh guidance consumer and, for declared semantic standards, the supported review path. Verify changed documentation under `marlens-rules:documentation-purpose-alignment` and module ownership under the [cohesive module cases](cohesive-module-review.md). Source/link checks prove neither consumer decisions nor runtime enforcement. Preserve each observed result and its scope; do not convert an expected decision into a claimed `PASS`.
