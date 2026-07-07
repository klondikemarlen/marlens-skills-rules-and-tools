---
name: no-envrc-example-commits
description: "Do not add or commit .envrc example files because environment setup examples may expose secret-handling patterns."
condition: ["\"path\"\\s*:\\s*\"\\.envrc\\.example\"", "git add [^\\n]*\\.envrc\\.example", "\\.envrc\\.example\\s+\\|\\s+\\d+ \\+"]
scope: ["tool:write(.envrc.example)", "tool:bash"]
---

Do not create, stage, or commit `.envrc.example`. Environment and token setup should stay out of versioned example files unless the user explicitly asks for one. If a local env file contains sensitive material, keep it ignored and summarize the local-only cleanup without adding an example artifact.
