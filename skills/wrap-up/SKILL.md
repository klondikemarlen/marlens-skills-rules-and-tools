---
name: wrap-up
description: Close out a requested unit of work by establishing delivery status, resolving reachable authorized work, preserving evidence, and safely handling session closure.
---

# Wrap-Up

Use the local `docs/workflows/wrap-up-workflow.md`, then `agents/workflows/wrap-up-workflow.md`; otherwise use the [packaged workflow](workflow.md).

For reusable lessons, use `session-insight-mining`; for implementation delivery and release gates, use the existing `feature` workflow. A request to wrap up does not itself authorize exiting; an explicit wrap-up-and-exit request permits exit only after completion and the final response, through the supported runtime.
