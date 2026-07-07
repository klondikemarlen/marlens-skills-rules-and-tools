# Committing

## Format

`:emoji: Verb phrase.` — imperative mood, subject line ends with a period.

**Subject line describes the outcome or "why", not what was added.** The diff already shows what changed — the subject should tell the reader why it matters or what the user-visible effect is.

- ❌ `:sparkles: Add document card for admin view.` — describes what was built
- ✅ `:sparkles: Show documents with download actions on admin card.` — describes the outcome

When using broad verbs like "align", "nest", "scope", or "move", name the concrete namespace,
target, and comparison point in the subject so the outcome is clear without branch or PR context.

- ❌ `:construction: Nest document routes.` — does not say where they are nested
- ✅ `:construction: Nest document routes under the account namespace to match report routing.` — names the target namespace and comparison point
- ❌ `:recycle: Align web routes.` — does not say what they align with
- ✅ `:recycle: Align document web routes with account routes.` — names the comparison point

**Simple commits:** Single line when the change is self-explanatory.
**Complex commits:** Title line followed by one or two plain sentences explaining the non-obvious context — things the diff doesn't make immediately clear. Each sentence ends with a period.

## When to use bullet points

Use bullet points for:

- Multi-part changes with distinct items
- Complex changes needing detailed explanation
- When multiple files or concepts are affected

Example:

```
:recycle: Rename and reorganize user management components.

- Rename UsersController to UsersTableController
- Move user group logic to separate controller
- Update all route references
```

## When NOT to use bullet points

For simple single-purpose changes, use a second line instead for "why" explanation (conversational, not bullet list):

- Adding one migration file
- Straightforward single-file changes
- When title is self-explanatory

Example:

```
:butterfly: Add backfill migration for attachment association name rename.

Prepares for renaming receiptStatus to signedReceiptStatus in the document model.
```

## Emoji guidance

- `:sparkles:` — new features
- `:bug:` / `:beetle:` — bug fixes
- `:lock:` — security restrictions, especially policy/access restrictions
- `:shield:` / `:japanese_castle:` / `:european_castle:` — guardrails, invariants, and edge-case prevention
- `:recycle:` — structural cleanup or migration-safe refactors that preserve behavior
- `:butterfly:` — database migrations and data backfills
- `:art:` — theme, styling, or visual changes
- `:cherry_blossom:` — UI polish and cosmetic improvements
- `:memo:` — documentation and plan updates
- `:wrench:` — config and settings changes
- `:hammer:` — infrastructure and tooling changes (docker, scripts)
- `:arrow_up:` — dependency, runtime, and version bumps
- `:arrow_down:` — dependency downgrades
- `:construction:` — intentionally incomplete migration slices that may leave the app broken between commits
- `:fire:` — deletion/removal of code or features
- `:unlock:` — security relaxations
- `:ok_hand:` — fixes/adjustments
- `:truck:` — renames/moves
- `:white_check_mark:` / `:heavy_check_mark:` — tests
- `:heavy_plus_sign:` — additions
- `:heavy_minus_sign:` — removals
- `:label:` — typing fixes

## Multi-concern commits

When a commit addresses more than one concern, put the primary concern in the subject line and move secondary concerns into the body. Each sentence in the body ends with a period.

Example:

```
:bug: Fix primary thing.

Also fix secondary thing.
```

## Commit body guidance

Write in plain English for the next developer reading `git log`. Use conversational style and focus on "why" and "what" rather than implementation mechanics.

**Common markers to structure information:**

- `Why?` - Explains the reason for the change
- `What?` - Explains what was changed or the problem being solved
- `How?` - Technical implementation details
- `NOTE:` - Additional context, warnings, or caveats
- `TODO:` - Future work that needs to be done
- `See` - References to issues, PRs, external links, or other commits
- `Undoes` - References to previous commits being reverted
- `Also` - Additional related changes

**Examples:**

```
Why? Simplify non-reusable queries into services to reduce complexity at caller location.

What? Previously if you modified the record name, then changed it back to the original value, it would show as invalid.

NOTE: if a database only supports one cascade path between tables, use a restrictive action for the secondary relationship.

See https://github.com/example-org/example-repo/issues/309
```

Focus on:

- What changed (briefly, since the diff shows the how)
- Why it was needed — the problem being solved
- What the observable effect is for users or callers
- Prefer active phrasing in the body when it clarifies the outcome, especially for infrastructure
  and tooling changes
- When a body mentions a failure or mismatch, name the concrete issue you actually observed when
  possible (for example a specific runtime version mismatch) instead of describing it only in
  generic terms

Avoid: in-progress reasoning, implementation mechanics, and code symbols in prose.

## Rewriting past commits

Prefer the `git-rebase` skill. Use this repository's agent helper only when the current checkout provides it:

```bash
test -x bin/agent-rebase-edit.js
```

Do not hand-roll detached-HEAD rebases unless the helper is unavailable or the worktree already contains edits that must be split across multiple older commits.

**Reword HEAD:**

```bash
git commit --amend -m "new message"
```

**Reword an older commit with the repo-local helper available:**

```bash
node bin/agent-rebase-edit.js --message-only <commit> "new message"
```

**Amend code into an older commit with a clean worktree and the repo-local helper available:**

```bash
node bin/agent-rebase-edit.js --edit <commit>
git add <paths>
git commit --amend --no-edit
git rebase --continue
```

Use the fallback rebase flows when the repo-local helper is absent.

**Fallback for code changes that are not applied yet:**

Use a temporary non-interactive sequence editor to stop at the older commit:

```bash
target=$(git rev-parse <target-commit>)
short_target=$(git rev-parse --short <target-commit>)
editor=$(mktemp)
printf '%s\n' \
  '#!/usr/bin/env node' \
  'import { readFileSync, writeFileSync } from "node:fs";' \
  'const todoPath = process.argv[2];' \
  'const target = process.env.TARGET_COMMIT;' \
  'const shortTarget = process.env.TARGET_COMMIT_SHORT;' \
  'let changed = false;' \
  'const lines = readFileSync(todoPath, "utf8").split("\n").map((line) => {' \
  '  const match = line.match(/^(pick|reword|edit|squash|fixup)\s+([0-9a-f]+)/);' \
  '  if (!match) return line;' \
  '  const hash = match[2];' \
  '  if (!changed && (target.startsWith(hash) || hash.startsWith(shortTarget))) {' \
  '    changed = true;' \
  '    return line.replace(/^\w+/, "edit");' \
  '  }' \
  '  return line;' \
  '});' \
  'if (!changed) throw new Error(`Could not find commit ${shortTarget} in rebase todo.`);' \
  'writeFileSync(todoPath, lines.join("\n"));' > "$editor"
chmod +x "$editor"
TARGET_COMMIT="$target" TARGET_COMMIT_SHORT="$short_target" GIT_SEQUENCE_EDITOR="$editor" git rebase -i <target-commit>^
```

Make the edit, then continue:

```bash
git add <paths>
git commit --amend --no-edit
git rebase --continue
```

For the root commit, use `TARGET_COMMIT="$target" TARGET_COMMIT_SHORT="$short_target" GIT_SEQUENCE_EDITOR="$editor" git rebase -i --root`.

**Fallback for already-working tree changes that span older commits:**

Use this when the desired edits already exist in the worktree or must be split across multiple targets. Split the diff by concern, create scoped fixups, then autosquash from the oldest target:

```bash
git add <paths-for-first-concern>
git commit --fixup <first-target-commit>
git add <paths-for-second-concern>
git commit --fixup <second-target-commit>
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <oldest-target-commit>^
```

Use `git push --force-with-lease` after rewriting a pushed feature branch. Never use plain
`git push --force`.

---

## General rules

- **One commit per logical change** — don't bundle multiple fixes or changes into a single commit
- Never `git push --force` on main branch
- Use `Part of <issue-url>` in PR bodies for multi-PR work. Reserve `Fixes <issue-url>` for the PR that should actually close the issue.

---

## PR Description Guidelines

See also: [`agents/workflows/pull-request-management-workflow.md`](agents/workflows/pull-request-management-workflow.md) for full PR creation workflow.

- **Concise language:** use direct, active voice. Avoid redundant words like "entire", "proper", "fully".
- **Context section:** focus on the problem and solution. Use present tense ("implements" not "will implement").
- **Implementation section:** short, focused bullet points. Combine related items. Avoid qualifiers and unnecessary detail.
- **Example:** "Add group creation service" instead of "Add proper group creation service for the entire system".

---

## Testing Instructions Format

See also: [`agents/workflows/testing-instructions-workflow.md`](agents/workflows/testing-instructions-workflow.md) for comprehensive guidance.

Standard setup (always include):

1. Run the relevant test suite via the project test command or a narrower focused test command.
2. Boot the app via the project development command.
3. Log in to the app with an appropriate test account.

Navigation/verification steps:

- Use exact UI element names: **Add Record**, **Save**
- Reference menu locations: "top right dropdown nav", "left sidebar nav"
- Use navigation arrows: **Administration** → **Records** → **Create**
- Explicit verification: "Verify success message: 'Record created!'"
- Format: Bold for **UI elements**, inline code for `exact values/URLs/errors`
- **Always verify UI element names against the actual frontend source or browser state** before writing instructions — do not guess button labels or field names.

For complex scenarios, use `## Test Case N: Description` subheadings.
