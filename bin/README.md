# Package Commands

Read this file when a workflow refers to package-local command setup. It maps published entrypoints; each command owns its own options and detailed behavior.

| Command | Purpose | Source |
| --- | --- | --- |
| `dev` | Generic Docker Compose wrapper for project-local `bin/dev` shims. | [`bin/dev`](./dev) |
| `check-commit-scope` | Reject mixed staged file categories unless explicitly overridden; a root `.commit-scope.json` can declare atomic release metadata groups. | [`bin/check-commit-scope`](./check-commit-scope) |
| `agent-guidance-audit` | Read-only audit of a downstream repository's guidance. | [`bin/agent-guidance-audit.js`](./agent-guidance-audit.js) |
| `git-edit-commit` | Safe entrypoint for scripted history edits. | [`bin/git-edit-commit.js`](./git-edit-commit.js) |
| `temporary-mcp-task` | Run one confirmed child task with a temporarily enabled native OMP MCP server. | [`bin/temporary-mcp-task.js`](./temporary-mcp-task.js) |
| `github-review-thread` | Upvote/downvote, reply, and resolve review comments in the current repository. | [`bin/github-review-thread`](./github-review-thread) |
| `github-headless-session` | Starts a disposable headed-to-headless GitHub browser session and prints a loopback CDP endpoint. The endpoint is not an authorization boundary; use a dedicated test account with repository-only access. | [`bin/github-headless-session`](./github-headless-session) |

`agent-rebase-edit.js` is the implementation loaded by `git-edit-commit`; invoke the published command rather than calling it directly.

To allow a required release-metadata pair without allowing unrelated mixed commits, declare each all-or-nothing group in the repository root:

```json
{ "atomicGroups": [["package.json", "lib/harvest_worklog/version.rb"]] }
```
