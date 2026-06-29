# Git Rebase Workflow

Use when the user asks to fix up, amend, reword, squash, or reorder commits that are not `HEAD`.

## Intent

**WHY this workflow exists:** `git commit --amend` is fine for `HEAD`; rewriting the second-last commit or anything further back is where agents get brittle. The safe path is an explicit helper mode or fixup/autosquash flow.

**WHAT this workflow produces:** A rewritten local branch history with the requested older-commit message/code change folded into the target commit, or a clear blocker when the worktree is unsafe.

**Decision Rules:**

- Never rewrite public/shared branch history unless the user explicitly asks for that exact branch rewrite.
- Preserve unrelated staged, unstaged, and untracked files. Stop if the target change is mixed with unrelated work.
- Prefer `git edit-commit --message-only <commit> "New message"` for message-only fixes to older commits.
- Prefer `git edit-commit --edit <commit> [message]` for code plus optional message changes to older commits.
- Prefer `git commit --fixup <commit>` plus `git rebase -i --autosquash <commit>^` only when the helper is unavailable.
- Avoid opening an editor. Use helper modes or `GIT_SEQUENCE_EDITOR=true` for autosquash rebases when the generated todo is sufficient.
- After rewriting commits that were already pushed, use `git push --force-with-lease`, never plain force.

## Process

1. Inspect branch and worktree state:

   ```bash
   git status --short
   git branch --show-current
   git log --oneline --decorate -n 20
   ```

2. Identify the target commit hash and the branch range to rewrite. If the target is unclear, ask.

3. If the target is `HEAD`, do not use this workflow. Use normal amend commands:

   ```bash
   git commit --amend
   git commit --amend -m "New commit message."
   ```

4. The helper modes require a clean worktree because they start the rebase immediately. If the needed code change is already unstaged/staged, either commit/stash unrelated work first or use the fixup/autosquash fallback in step 7.

5. For a message-only fix to an older commit and a clean worktree, use the helper:

   ```bash
   git edit-commit --message-only <target-commit> "New commit message."
   ```

   If the helper is not on `PATH`, call the installed binary directly:

   ```bash
   ~/.omp/plugins/node_modules/.bin/git-edit-commit --message-only <target-commit> "New commit message."
   ```

   The helper marks exactly the target commit as `reword`, writes the supplied message non-interactively, and replays later commits.

6. For code plus optional message edits to an older commit and a clean worktree, use the helper:

   ```bash
   git edit-commit --edit <target-commit>
   git edit-commit --edit <target-commit> "New commit message."
   ```

   The helper marks exactly the target commit as `edit`, optionally amends its message, then stops. Make code or message edits, stage them, amend the stopped commit, and continue:

   ```bash
   git add <files>
   git commit --amend --no-edit
   git rebase --continue
   ```

   If conflicts appear while later commits replay, resolve each conflict in scope, run the smallest relevant check, then run `git rebase --continue` again. Abort with `git rebase --abort` if a conflict is outside the requested rewrite.

7. If the helper is unavailable and you need content changes to an older commit:

   ```bash
   git add <only-files-for-this-fixup>
   git commit --fixup <target-commit>
   GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <target-commit>^
   ```

   If the target commit is the root commit, use `git rebase -i --autosquash --root`.

8. If the helper is unavailable and you need message-only changes to an older commit, first try:

   ```bash
   git commit --allow-empty --fixup=reword:<target-commit>
   GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <target-commit>^
   ```

   If the installed Git does not support `--fixup=reword:`, use a manual rebase todo with the target commit marked `reword`, and set `GIT_EDITOR` to a non-interactive script or amend directly at the stopped commit.

9. If conflicts occur:

   - Resolve only the conflict caused by the requested rewrite.
   - Run the smallest relevant check for the changed files.
   - Continue with `git rebase --continue`.
   - Abort with `git rebase --abort` if the conflict is outside the requested scope or would risk unrelated work.

10. Verify the result:

   ```bash
   git log --oneline --decorate -n 20
   git status --short
   ```

11. If the branch was already pushed and the user asked to update the remote:

   ```bash
   git push --force-with-lease
   ```

## Output Contract

Report the target commit, rewritten commit range, final HEAD, whether conflicts occurred, and whether the branch was pushed. Mention any remaining uncommitted files.
