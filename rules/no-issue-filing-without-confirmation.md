---
name: no-issue-filing-without-confirmation
description: "Do not create GitHub issues in external projects without explicit final confirmation."
condition: "\\bgh\\s+issue\\s+create\\b|\"op\"\\s*:\\s*\"issue_create\"|\\bcreate\\s+issue\\b"
scope: "tool"
---

Do not file issues against other people's projects without explicit final confirmation in the current conversation. Draft the issue body, summarize the evidence, and ask for confirmation before running `gh issue create` or any equivalent issue-creation tool.
