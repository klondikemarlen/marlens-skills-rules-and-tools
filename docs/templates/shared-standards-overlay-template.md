# Shared Standards Overlay Template

Use this compact declaration in project-root agent guidance or a local workflow overlay when adopting a packaged shared standard. Follow the [project knowledge base workflow](../workflows/project-knowledge-base-workflow.md#adopting-shared-standards) before removing existing guidance.

```markdown
## <Shared Standard>

- Shared base: <standard owner and supported direct workflow source; compatibility requirement only if needed>
- Local overlay: <path to this project-specific guidance>
- Apply: Load the task-relevant shared workflow first, then this overlay; retain the project constraints and exceptions below.

### Project-Specific Constraints and Exceptions

- <Domain, security, cultural, command, tool, or other local requirement; omit generic rules already covered by the shared base.>
- <Compatible local exception, or "None".>
```

Use a direct OMP workflow URI such as `skill://code-review/workflow.md`, or identify the verified corresponding workflow file from the resolved release in other clients. Keep the actual observed release/source identity in the adoption PR or existing verification record, not a permanent duplicate inventory. Do not put personal machine paths here. If a genuine rule conflict needs an owner decision or the required source/version is unavailable, do not represent adoption as complete or delete existing local coverage.
