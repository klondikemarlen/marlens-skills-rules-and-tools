# Codex CLI Rules Guide

Guidance for maintaining clean, reusable `prefix_rule` patterns in `~/.codex/rules/default.rules`.

## What Are Rules?

Codex CLI uses `prefix_rule` patterns to determine which commands can run outside the sandbox without prompting. Rules are stored in `~/.codex/rules/default.rules` and evaluated using argv-prefix matching.

## Shell Command Wrappers

When using a wrapper command (like `rtk`, `time`, or custom aliases), the full command needs its own rule because Codex matches on the first token.

**Key principle:** `wrapper git X` does NOT match a `git X` rule. They are separate command trees.

### Creating Wrapper Parallel Rules

When suggesting rules for commands that use a wrapper, create patterns for both:

```python
# If I ran: rtk git status
prefix_rule(pattern=["git", "status"], decision="allow")
prefix_rule(pattern=["rtk", "git", "status"], decision="allow")
```

Place wrapper variants immediately after their base equivalent in the rules file.

## General Rule Guidelines

### Avoid These Patterns

| Bad Pattern | Why | Good Alternative |
|-------------|-----|------------------|
| `prefix_rule(pattern=["git", "commit", "-m", "specific message"])` | One-off message won't match future commits | `prefix_rule(pattern=["git", "commit", "-m"])` |
| `prefix_rule(pattern=["gh", "api", "repos/org/repo/pulls/315"])` | Specific PR number won't match other PRs | `prefix_rule(pattern=["gh", "api"])` |
| `prefix_rule(pattern=["/bin/bash", "-lc", "complex \| pipeline"])` | Shell wrappers are brittle, won't match reliably | Break into separate commands or prompt |
| `prefix_rule(pattern=["printf", "\\n---DEBUG---\\n"])` | One-off debug helpers | Remove entirely |
| `prefix_rule(pattern=["git", "rebase", "--onto", "abc123", "def456"])` | Specific commit hashes | `prefix_rule(pattern=["git", "rebase", "--onto"])` |

### Prefer These Patterns

- **Prefixes over specifics:** `["git", "add"]` not `["git", "add", "specific/file.ts"]`
- **General git operations:** `["git", "grep"]` not complex regex patterns
- **Broad gh api:** `["gh", "api"]` covers all API endpoints
- **No broad wrappers:** Never `["rtk"]` alone - too permissive

## File Organization

Group rules by category with comment headers:

```python
# Development Commands
prefix_rule(pattern=["npm", "run", "test"], decision="allow")

# Git Commands
prefix_rule(pattern=["git", "add"], decision="allow")
prefix_rule(pattern=["rtk", "git", "add"], decision="allow")

# GitHub CLI Commands
prefix_rule(pattern=["gh", "pr", "view"], decision="allow")
```

## Decision Types

- `allow` - Run without prompting (safe, frequent operations)
- `prompt` - Ask each time (destructive or sensitive operations)
- `forbidden` - Block entirely (dangerous commands)

## Testing Rules

Verify rule syntax with:

```bash
codex execpolicy check --rules ~/.codex/rules/default.rules -- echo test
```

## See Also

- [OpenAI Codex Rules Documentation](https://developers.openai.com/codex/rules)
