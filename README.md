# Agent Global Rules

Version-controlled global agent instructions for local agent config files.

## Use

Link each tool's global rules file, plus the home-level fallback, to this repo:

```bash
ln -sf /home/marlen/code/klondikemarlen/agent-global-rules/AGENTS.md /home/marlen/.codex/AGENTS.md
ln -sf /home/marlen/code/klondikemarlen/agent-global-rules/AGENTS.md /home/marlen/.config/opencode/AGENTS.md
ln -sf /home/marlen/code/klondikemarlen/agent-global-rules/AGENTS.md /home/marlen/.omp/agent/AGENTS.md
ln -sf /home/marlen/code/klondikemarlen/agent-global-rules/AGENTS.md /home/marlen/AGENTS.md
```

Restart the agent after changing this file. Global instructions load at startup.

## Files

- `AGENTS.md` - global agent instructions loaded by OMP, Codex, and OpenCode
- `AGENT_RULES.md` - agent-agnostic shared decision rules
- `COMMITTING.md` - reusable commit-message guidance
- `skills/` - global skill aliases and reusable skills
- `agents/` - generic workflow, template, reference, and plan discovery docs
