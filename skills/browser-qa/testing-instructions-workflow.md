# Testing Instructions Workflow

Use when writing or updating pull request testing instructions.

## Process
1. Read the PR body, diff, and any existing testing section.
2. Read project-local setup docs and command wrappers, such as `README.md`, `bin/README.md`, package scripts, or dev-wrapper docs. <!-- agent-guidance-audit: ignore backtick-path -->
3. Identify behavior a reviewer can actually verify.
4. Start from Gold: name the behavior, invariant, or regression risk each scenario must prove.
5. Verify exact UI labels, routes, commands, and required setup from source or a running app. Do not guess.
6. Write steps in the order a reviewer should perform them.
7. Give each scenario enough tester-facing context to identify where the tester is, the starting state, the action, and the expected result. Use exact labels or values when they matter.
8. Separate independent scenarios with numbered test cases when the flow is complex.

## Rules

- Test behavior, not implementation details.
- Prefer user-visible verification over internal plumbing.
- Include setup commands only when they are needed for the scenario.
- Use exact labels for buttons, fields, tabs, pages, and messages.
- Write from the tester's point of view: explain where they are, what state they should start from, what to do, and what should happen next. Use plain user-facing terms; implementation-specific UI terminology is optional.
- Screenshots are optional supporting evidence. Do not require agents to create or annotate screenshots, and do not rely on an image to supply missing action or expected-result context.
- Do not include credentials, secrets, or local-only state values.
- If something was not verified, say so explicitly.
- Use `PASS`, `FAIL`, and `BLOCKED` from `AGENT_RULES.md` when reporting verification outcomes.

## Output Shape

```markdown
## Testing Instructions

1. Run `<focused check>`.
2. Start the app with `<project command>`.
3. Navigate to `<page>`.
4. Perform `<action>`.
5. Verify `<observable result>`.
```
