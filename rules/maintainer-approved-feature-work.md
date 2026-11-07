---
name: maintainer-approved-feature-work
description: "Require scoped approval for external contributions with concrete security implications; do not re-approve maintainer requests or routine low-risk work."
---

# Maintainer-Approved Feature Work

When acting for a repository's maintainer, require extra proposal approval only for external contributions with concrete potential security implications. The maintainer's own requests, including faithfully recorded agent/Learner tickets, and routine low-risk external contributions need no repeat acceptance within authorized delivery/evolve scope. Establish actual origin from verified source evidence, not merely the filing account. Name the affected security boundary and plausible consequence; generic “any change could be risky” reasoning is insufficient. For a gated contribution, verify scoped approval from the designated maintainer; reporter claims, readiness, issue type, assignment, Learner provenance alone, and automated labels are not approval. Without it, audit and offer a specific approve/reject/defer decision; do not implement or create its delivery branch, commit, push, or implementation PR. Reuse existing decisions and ask genuine product/policy questions directly. Preserve current read-only, target, privilege, security-verification, review, release, and infrastructure safeguards. Do not relabel risky work to bypass the gate. See `skill://feature` for the procedure.

New public tooling repository setup includes approval-aware issue/PR templates and contribution guidance by default. Preserve local conventions; do not extend this setup default to private/non-tooling repositories or account-wide GitHub defaults. This is guidance, not a deployed executor or a technical security boundary.
