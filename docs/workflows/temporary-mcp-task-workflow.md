# Temporary MCP Task Workflow

Use when one offloaded OMP task needs one named MCP server that is disabled by default. This is an interim workaround for [OMP issue #5589](https://github.com/can1357/oh-my-pi/issues/5589), not child-scoped MCP isolation.

## Intent

**WHY this workflow exists:** Enabled MCP tools expand the running session's tool surface. OMP currently exposes interactive `/mcp` lifecycle commands, but no `omp mcp` CLI or per-invocation MCP allowlist. A separate one-off OMP process can temporarily enable one native-config server without reloading the current session.

**WHAT this workflow produces:** One non-interactive OMP child task with a named server temporarily enabled, the selected config restored exactly afterward, and no change to the parent session's tool registry.

**Decision Rules:**

- Ask for explicit confirmation before passing `--confirm`; this helper mutates the selected OMP-native `mcp.json` for the child process lifetime.
- First identify the server and its config source in interactive OMP with `/mcp list`. The helper accepts only the current working directory's `.omp/mcp.json` or the active profile's user `mcp.json`; arbitrary files are rejected because OMP would not discover them.
- Run one task per invocation. The helper serializes its own calls per config file, snapshots the original bytes, enables only the selected server among definitions in that file, and restores the snapshot in an exit path.
- The child prompt must describe the needed MCP action and the result to return. The helper instructs the child to use only the selected server.
- Do not claim full isolation: definitions discovered from third-party or other project config files can still load, and an untrappable process kill requires the next helper invocation to recover the saved snapshot.
- Do not use this to grant a broad or persistent server permission. For a persistent change, use OMP's `/mcp enable` or `/mcp disable` explicitly. For a true ephemeral allowlist, follow upstream #5589.

## Process

1. Confirm the task cannot use an existing built-in tool and name the required MCP server.
2. In interactive OMP, run `/mcp list` and record the exact discoverable OMP-native config path.
3. Explain the mutation and ask the user to approve the one-off child task.
4. Run from the target project directory:

   ```bash
   temporary-mcp-task --confirm --config .omp/mcp.json --server <server-name> -- "<child task>"
   ```

   For a user-level definition, pass the active profile's `~/.omp/agent/mcp.json` or `~/.omp/profiles/<profile>/agent/mcp.json` instead.
5. Inspect the child result. The helper restores the original config whether the child succeeds or fails.
6. If the command reports a stale lease, rerun it only after verifying that no previous helper process is still active; stale recovery restores the saved snapshot before starting a new child.

## Verification

```bash
node scripts/verify-temporary-mcp-task.mjs
```

## Output Contract

```text
Server: <name and source config>
Approval: <user confirmation for this one child task>
Task: <child prompt>
Result: <child exit status and returned outcome>
Restoration: PASS | FAIL <exact original config restored or stale-lease recovery result>
Limitations: <third-party/project discovery or none>
```
