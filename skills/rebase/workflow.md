# Git Rebase Workflow

Use when the user asks to fix up, amend, reword, squash, or reorder commits that are not `HEAD`, or to resolve a stacked child PR's conflicts against its parent.

## Intent

**WHY this workflow exists:** `git commit --amend` is fine for `HEAD`; rewriting the second-last commit or anything further back is where agents get brittle. The safe path is an explicit helper mode or fixup/autosquash flow.

**WHAT this workflow produces:** The requested older-commit change or a child-only replay onto the current stack parent, with verified history and authorized remote updates, or a clear blocker when the rewrite is unsafe.

**Decision Rules:**

- Never rewrite public/shared branch history unless the user explicitly asks for that exact branch rewrite.
- Preserve unrelated staged, unstaged, and untracked files. Stop if the target change is mixed with unrelated work.
- For older-commit edits, prefer the published `agent-rebase-edit` command when it is on `PATH`; package-local `bin/agent-rebase-edit.js` is only a checkout-specific override.
- If neither is available, use the fallback flows below rather than guessing helper paths or hand-writing rebase todo files first.
- Avoid opening an editor. Use helper modes or `GIT_SEQUENCE_EDITOR=true` for autosquash fallback rebases when the generated todo is sufficient.
- For an authorized published rewrite, use an exact expected-remote-SHA lease; never plain force or an implicit remote-tracking-ref lease.

## Stacked Pull Request Conflicts

For a stacked child PR, prefer rebasing onto its freshly fetched actual parent rather than merging the parent into the child. Use this procedure instead of the older-commit helper flow below. This preference does not authorize rewriting a published branch; retain the explicit authorization and PR draft/fixup gates.

1. Read the current PR base/stack metadata and remote refs to identify the actual parent and child. Do not infer the parent from the default branch or an old branch name.
2. Preserve unrelated work. Record the original child tip, its reviewed remote head for any authorized lease, and available historical parent refs before fetching. Fetch the actual parent; stop if unexpected remote child work is not included in the local history.
3. Identify and inspect the child-only replay range, `<old-parent-boundary>..<saved-child-tip>`. If the parent was rewritten, establish the historical boundary from saved refs, reflog, or verified stack history; a merge-base with the rewritten parent alone can include obsolete parent commits. Stop if the boundary is uncertain rather than replaying the old parent.
4. Keep a backup ref for the original child tip, then replay only child commits onto the fetched parent:

   ```bash
   git rebase --onto <fetched-parent> <old-parent-boundary> <child-branch>
   ```

5. Resolve only in-scope conflicts using the existing continue/abort safety guidance. Preserve child changes and unrelated work; do not silently discard merge intent or other commits.
6. Review `git range-diff <old-parent-boundary>..<saved-child-tip> <fetched-parent>..<new-child-tip>`, the final diff, and affected behavior. Account for intentional conflict resolutions and run the smallest relevant smoke/check plus required current-head CI.
7. Update a published child only when that exact rewrite is authorized, using the recorded expected-remote-SHA lease shown below. If the remote changed, stop and inspect/preserve that work; do not retry by blindly refreshing the lease or silently merge the parent as a substitute for authorization.

## Restoring Deleted Features

When restoring previously tracked behavior, inspect the removal commits and their parents before recreating code. Prefer scoped native recovery that preserves provenance when it fits the accepted current contract. For example, `git revert --no-commit <removal-commit>` recovers the inverse into both the index and worktree: exclude out-of-scope inverse changes from both before committing, and inspect the complete staged diff. Selective `git add` alone does not unstage the other reverted changes. Cite the removal commit hashes in the restoration commit message. A removal commit may also retire controls or contain unrelated changes: do not blanket-revert those deltas. Resolve recovered code against current callers and contracts; obsolete tests from the old implementation are not restoration requirements.

If provenance can be retained only by rewriting an already-verified branch, keep a backup ref first, replay later fixes, compare the full final tree with the previously verified head, and use `git range-diff` to confirm the later commit range was preserved. Content parity can reuse existing behavioral evidence, but does not prove behavior on the rewritten head or replace required CI there. Rewrite published history only with explicit authorization for that branch; otherwise make a forward restoration commit. When authorized to update a published branch, use an exact expected-remote-SHA lease, such as `git push --force-with-lease=refs/heads/<branch>:<expected-remote-sha>`, never an unqualified force push. A PR's net Changes view may show restored files as added; that display alone does not establish whether restoration provenance was retained.

Keep restoration scoped to the requested behavior; do not add a new restoration workflow or assume every restoration requires reverting history.

## Process

1. Inspect branch and worktree state:

   ```bash
   git status --short
   git branch --show-current
   git log --oneline --decorate -n 20
   ```

   Before an authorized published rewrite, record the exact reviewed remote branch head as the lease expectation and ensure its history is included locally. Stop and reconcile unexpected remote work rather than replacing the expectation with an unreviewed newer SHA.

2. Identify the target commit hash and the branch range to rewrite. If the target is unclear, ask.

3. If the target is `HEAD`, do not use this workflow. Use normal amend commands:

   ```bash
   git commit --amend
   git commit --amend -m "New commit message."
   ```

4. The helper modes require a clean worktree because they start the rebase immediately. Prefer the installed command:

   ```bash
   command -v agent-rebase-edit
   ```

   A checkout may instead provide its own override:

   ```bash
   test -x bin/agent-rebase-edit.js
   ```

   If neither is available, skip directly to step 7 for code changes that are not yet applied, step 8 for existing worktree edits, or step 9 for message-only changes.

5. For a message-only fix to an older commit, a clean worktree, and an available helper, use:

   ```bash
   agent-rebase-edit --message-only <target-commit> "New commit message."
   # Or, when only the checkout-local helper exists:
   node bin/agent-rebase-edit.js --message-only <target-commit> "New commit message."
   ```

   The helper marks exactly the target commit as `reword`, writes the supplied message non-interactively, and replays later commits.

6. For code plus optional message edits to an older commit, a clean worktree, and an available helper, use:

   ```bash
   agent-rebase-edit --edit <target-commit>
   agent-rebase-edit --edit <target-commit> "New commit message."
   # Or, when only the checkout-local helper exists:
   node bin/agent-rebase-edit.js --edit <target-commit>
   node bin/agent-rebase-edit.js --edit <target-commit> "New commit message."
   ```

   The helper marks exactly the target commit as `edit`, optionally amends its message, then stops. Make code or message edits, stage them, amend the stopped commit, and continue:

   ```bash
   git add <files>
   git commit --amend --no-edit
   git rebase --continue
   ```

   If conflicts appear while later commits replay, resolve each conflict in scope, run the smallest relevant check, then run `git rebase --continue` again. Abort with `git rebase --abort` if a conflict is outside the requested rewrite.

7. If the helper is unavailable and the needed code change is not yet applied, stop at the target commit with a temporary non-interactive sequence editor:

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

   Make the requested edit at the stopped commit, then continue:

   ```bash
   git add <files>
   git commit --amend --no-edit
   git rebase --continue
   ```

   If the target commit is the root commit, use `TARGET_COMMIT="$target" TARGET_COMMIT_SHORT="$short_target" GIT_SEQUENCE_EDITOR="$editor" git rebase -i --root`.

8. If the helper is unavailable and the needed code changes already exist in the worktree or must be split across older commits:

   ```bash
   git add <only-files-for-this-fixup>
   git commit --fixup <target-commit>
   GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <target-commit>^
   ```

   For multiple target commits, create every scoped fixup first, then autosquash once from the
   oldest target commit's parent.

   If the target commit is the root commit, use `git rebase -i --autosquash --root`.

9. If the helper is unavailable and you need message-only changes to an older commit, first try:

   ```bash
   git commit --allow-empty --fixup=reword:<target-commit>
   GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <target-commit>^
   ```

   If the installed Git does not support `--fixup=reword:`, use a manual rebase todo with the target commit marked `reword`, and set `GIT_EDITOR` to a non-interactive script or amend directly at the stopped commit.

10. If conflicts occur:

- Resolve only the conflict caused by the requested rewrite.
- Run the smallest relevant check for the changed files.
- Continue with `git rebase --continue`.
- Abort with `git rebase --abort` if the conflict is outside the requested scope or would risk unrelated work.

11. Verify the result:

```bash
git log --oneline --decorate -n 20
git status --short
```

12. If the branch was already pushed and the user authorized that exact branch rewrite and remote update, use the reviewed remote SHA recorded before rewriting:

```bash
git push --force-with-lease=refs/heads/<branch>:<expected-remote-sha> origin HEAD:refs/heads/<branch>
```

## Output Contract

Report the target commit, rewritten commit range, final HEAD, whether conflicts occurred, and whether the branch was pushed. Mention any remaining uncommitted files.
