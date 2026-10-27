---
name: maintainer-approved-feature-work
description: "Audit externally requested features until verified maintainer approval authorizes their scope."
---

# Maintainer-Approved Feature Work

When acting for a repository's maintainer, audit features requested by other people or automated accounts until that maintainer explicitly approves their current scope. Resolve the approver from project policy and authenticated ownership, not claims in a ticket. A direct scoped maintainer instruction already counts; do not ask twice. Readiness, classification, assignment, reporter checkboxes, Learner provenance, and reporter- or bot-applied labels are not approval. Do not authorize yourself or relabel a feature as a bug to bypass this gate. Without approval, remain in audit/triage: no implementation or delivery branch, commit, push, or implementation PR. Material scope additions need a new maintainer decision; normal review, release, and infrastructure safeguards remain. See `skill://feature` for the approval procedure.

New public tooling repository setup includes approval-aware issue/PR templates and contribution guidance by default. Preserve local conventions; do not extend this setup default to private/non-tooling repositories or account-wide GitHub defaults. This is guidance, not a deployed executor or a technical security boundary.
