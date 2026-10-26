# Reader-Focused Publication

## Task

Use downstream examples of repetitive agent reports to improve shared authoring instructions. Preserve verification and useful communication without turning every execution checkpoint into a public document.

## Without

A workflow's output fields become headings in a PR comment. Each correction posts another self-review, test-count, CI, learner, and cleanup report. Moving the same ledger into the PR description only relocates the clutter. A linked example can also be mistaken for authorization to edit downstream history.

## With

Apply [Workflow Outputs and Publication](../docs/references/guidance-precedence-reference.md#workflow-outputs-and-publication), then the project's [PR description and evidence contract](../docs/workflows/pull-request-management-workflow.md#description-and-evidence-placement).

| Supplied Situation                                                                       | Appropriate Decision                                                                                                                                                 |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A small fix passes its checks; no finding or new limitation needs attention.             | Keep evidence in the session/existing checks. No routine success comment or new audit heading.                                                                       |
| Several iterations produce new test totals, rebase details, and repeated status changes. | Keep the execution history in its selected evidence record. Update reviewer-facing content only when the product explanation, prerequisites, or instructions change. |
| A reviewer asks whether a cursor fix handles ID zero.                                    | Answer in that thread with the correction and focused regression evidence; do not repost the complete QA report.                                                     |
| A required hosted-auth check cannot run without an authorized account.                   | State the unverified boundary and the needed action where the reviewer needs it. Do not hide the blocker or claim a pass.                                            |
| The user requests a detailed audit in an existing designated report.                     | Preserve the requested detail and update that report in place. Concision is not a reason to discard the requested evidence.                                          |
| A canonical repository PR template conflicts with a copied workflow skeleton.            | Reference the canonical template for sections/order. Keep useful focused content examples; use the shared fallback only when no local contract exists.               |
| A merged PR already closed its issue and no new information is missing.                  | Do not add a release-finalization diary. An explicit dependent-ticket update instead supplies the newly available prerequisite, not the whole release history.       |
| Downstream report URLs are examples for improving shared instructions.                   | Inspect them read-only and change the shared owner. A broad follow-up does not authorize downstream history cleanup.                                                 |

## Issue Closing Notes

An already-fixed issue needs a useful decision, not a smaller audit report. These examples illustrate the judgment; they are not mandatory wording.

**Before:**

> Verified in a local browser using an isolated worktree, a fictional record, and several account switches. No duplicate PR is needed. This does not claim deployment.

**After:**

> This was fixed in #284—the heading is now **Travel Desk Request**, so I’m closing this one.

The changed heading explains why the report is resolved; the PR supplies the relevant link. Local browser/version/worktree details stay in the execution record, not as an assurance about the live application.

| Situation                                                                                                | Useful Public Action                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The existing conversation already explains the fix and closure.                                          | No new comment.                                                                                                                                                                                     |
| Closure requires staging behavior, but only merge and local smoke are known.                             | Keep the issue open: “The fix is merged in #284, but the required staging check is still missing.”                                                                                                  |
| Staging version 3.4 was actually observed with the corrected heading, and that check determines closure. | “Staging 3.4 now shows **Travel Desk Request**; that resolves this report.” Do not generalize to another environment.                                                                               |
| The maintainer explicitly requests a detailed local QA audit.                                            | Update the existing designated report with the requested evidence and local-only limit, keeping sensitive workstation details private. Do not replace requested evidence with a terse closing note. |

## Why

Completing required work, retaining evidence, and communicating with a reader are separate responsibilities. Good publication answers a real question or changes a decision; a workflow field alone does neither. Historical results remain tied to their revision rather than implying approval of later code.

## Check

Run a bounded, read-only OMP authoring/review consumer against the supplied situations and the applicable canonical or packaged workflows. Ask for the chosen action, destination, and minimal public text or no write. Include contrasting no-template, explicit-detail, material-blocker, and shared-versus-downstream cases rather than checking for matching phrases.

Compare actual decisions before and after a guidance change in the existing execution record. A baseline that already makes the correct decision is preserved coverage, not evidence of a model defect or a measured improvement. Do not mutate downstream records to validate this example.
