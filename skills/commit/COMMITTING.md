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

**Bug and edge-case commits:** Prefer a body when the fix boundary is non-obvious. Name the failing condition, expected runtime effect, adjacent behavior intentionally preserved, and why the fix is one logical commit.

Examples:

```
:bug: Return 503 for transient JWT key lookup outages.

JWKS DNS EAI_AGAIN failures are dependency outages, not invalid tokens. Return the user-safe outage response, keep malformed or invalid JWTs on the normal auth error path, and keep this commit scoped to outage classification.
```

```
:bug: Route current-user bootstrap failures safely.

Current-user bootstrap 401s still send users to sign-in. Route controller catch-all and auth-service 5xx failures to the internal error page, preserve global 400 and 422 error-page behavior, and keep this commit scoped to authenticated bootstrap failures.
```

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
- `:art:` — completed quality improvements, cleanups, and refinements that do not fit a narrower semantic category
- `:cherry_blossom:` — UI polish and cosmetic improvements
- `:memo:` — documentation and plan updates
- `:wrench:` — config and settings changes
- `:hammer:` — infrastructure and tooling changes (docker, scripts)
- `:arrow_up:` — dependency, runtime, and version bumps
- `:arrow_down:` — dependency downgrades
- `:construction:` — exclusively an explicitly incomplete, application-breaking intermediate migration slice
- `:fire:` — deletion/removal of code or features
- `:unlock:` — security relaxations
- `:ok_hand:` — fixes/adjustments
- `:truck:` — renames/moves
- `:white_check_mark:` / `:heavy_check_mark:` — tests
- `:heavy_plus_sign:` — additions
- `:heavy_minus_sign:` — removals
- `:label:` — typing fixes

## Emoji selection before commit

Before creating a commit, inspect the staged diff with its issue or PR context and select the narrowest matching emoji.

- A completed extraction or refinement with no narrower semantic category uses `:art:`, never `:construction:`.
- Use `:construction:` only when the staged change and linked work explicitly identify an incomplete, application-breaking intermediate migration slice.
- If a proposed `:construction:` message does not meet that condition, stop and warn before committing; choose the emoji that matches the completed change instead.

## Dependency manifest and lockfile changes

When a dependency declaration file and its generated resolver file both change, keep that pair together in a dedicated dependency commit whenever practical.

Do not mix dependency resolution churn with unrelated source, test, refactor, formatting, or documentation changes. Put the dependency manifest and lockfile/resolution file in one commit, then put the behavior change in a separate implementation commit.

Examples include `package.json` with a JavaScript lockfile, `Gemfile` with `Gemfile.lock`, `Cargo.toml` with `Cargo.lock`, `pyproject.toml` with a Python lockfile, `go.mod` with `go.sum`, and other manifest plus generated resolution-file pairs. The examples are illustrative; the rule is the pair stays together and separate from unrelated work.

## Multi-concern commits

Keep commits cohesive and homogeneous. Implementation and its directly corresponding focused test belong in the same logical commit. Do not mix that feature slice with unrelated migrations/schema/data changes, dependency churn, formatting, broad test-only/support changes, documentation or workflow-learning updates unless the user explicitly requests a combined commit and the files are inseparable for review.

If the user asks to commit a code/test fix, leave documentation-learning edits unstaged unless they explicitly ask for a docs commit too.

When a genuinely inseparable commit addresses more than one concern, put the primary concern in the subject line and move secondary concerns into the body. Each sentence in the body ends with a period.

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


## Plain language

Prefer plain terms over unexplained software jargon in commit subjects and bodies. If a domain term is useful, define it once or choose the clearer phrase.

- Prefer "shared layout", "navigation shell", "notification menu", or "background metadata fetch" over "chrome" unless the repository already uses "chrome" for shared UI.
- Optimize for the next maintainer or reviewer understanding the behavior without glossary context.

Avoid: in-progress reasoning, implementation mechanics, and code symbols in prose.

## Rewriting past commits

Use the [`git-rebase` workflow](docs/workflows/git-rebase-workflow.md) for older-commit rewrites, commit rewording, amend stops, autosquash, and force-with-lease rules.

For HEAD-only message changes:

```bash
git commit --amend -m "new message"
```

---

## General rules

- **One commit per logical change** — don't bundle multiple fixes or changes into a single commit
- Never `git push --force` on main branch
- Use `Part of <issue-url>` in PR bodies for multi-PR work. Reserve `Fixes <issue-url>` for the PR that should actually close the issue.

---

## PR and testing workflows

- PR descriptions: [`docs/workflows/pull-request-management-workflow.md`](docs/workflows/pull-request-management-workflow.md).
- Testing instructions: [`docs/workflows/testing-instructions-workflow.md`](docs/workflows/testing-instructions-workflow.md).
