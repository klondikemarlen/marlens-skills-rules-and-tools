---
name: no-issue-filing-without-confirmation
description: "Do not create GitHub issues in external projects without current-conversation authorization."
condition: "\\bgh\\s+issue\\s+create\\b|\"op\"\\s*:\\s*\"issue_create\"|\\bcreate\\s+issue\\b"
scope: "tool"
---

Do not file issues against other people's projects without current-conversation authorization for that specific target. A direct user request such as "file the appropriate issues" is sufficient authorization for the current repo or a user-owned repo named in the request, and MUST NOT trigger a second/final confirmation prompt. For an external or unrelated project, ask for confirmation unless the user already authorized issue filing for that target in the current conversation.
