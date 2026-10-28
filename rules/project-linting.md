---
name: project-linting
description: "Before presenting source changes as ready, require working project-appropriate linting and current passing lint evidence."
condition: "\\bgit\\s+(commit|push)\\b|\\bgh\\s+pr\\s+(create|ready|merge)\\b|\\bready for review\\b"
scope: "tool:bash"
---

Before presenting source changes as ready:

1. Resolve the project's documented lint command, configuration, source coverage, and development/test wrapper. Require a working linter appropriate to the changed languages and frameworks: ESLint or an equivalent, with supported parsers/plugins where needed. A command name, dependency, or empty configuration does not establish meaningful lint coverage.
2. Run the applicable non-fixing lint command through that wrapper and require current successful execution under the project's configured error/warning policy. Formatting, typechecking, tests, and visual QA are separate evidence, not substitutes for linting. A script-only lint result does not prove styles were checked.
3. Use the existing Verifier's project-specific executable requirement when Verifier is in use: name the source/configuration trigger, check id, actual command, quality standard, and PASS evidence. Follow [Project Linting Verification](../docs/references/rules-and-verifications-reference.md#project-linting-verification); do not invent another command runner or advisor.
4. Fix reported violations and rerun after corrections. Do not disable rules, shrink ignore scope, or weaken configuration merely to obtain PASS. Intentional policy changes need their own accepted rationale.
5. Report missing or broken tooling/configuration, unavailable language coverage, or an unexecuted required check as BLOCKED with the missing prerequisite. A configured lint violation is FAIL. If Verifier is unavailable, run lint directly where possible and distinguish command evidence from unverified advisor delivery. No applicable source/configuration changes means N/A, not a universal lint PASS.

Follow project-local tool selection and setup procedures. Do not silently install dependencies or migrate unrelated projects to a particular linter. This rule guides readiness; it is not a host-enforced completion veto or automatic provisioning of project lint configuration.
