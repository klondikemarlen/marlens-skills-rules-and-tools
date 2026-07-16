# Prompt Improvement Template

Use after an observed prompt, command-injection, identity, or instruction-routing failure needs a durable decision. Do not use it to rewrite wording without evidence.

## Required Fields

- **Trigger:** The exact user request, observed failure, or repeated correction.
- **Evidence:** A reproducible scenario, source path, audit finding, or verification output.
- **Durable impact:** The current cross-project behavior, safety, discoverability, or maintenance risk.
- **Classification:** `shared guidance`, `enforcement/runtime`, `already covered`, or `no action`.
- **Owner:** This package, the target project, `omp-verifier`, or another explicitly identified owner.
- **Next step:** Fix now, scoped issue/proposal, cite existing guidance, or no action.

## Template

```text
Trigger: <exact signal>
Evidence: <reproducible source or check output>
Durable impact: <current repeatable risk>
Classification: <shared guidance | enforcement/runtime | already covered | no action>
Owner: <specific repository or component>
Next step: <authorized fix, scoped proposal, citation, or no action>
Verification: <smallest check that proves the decision/change>
```

## Verification

- [ ] The trigger and evidence are specific enough for another maintainer to inspect.
- [ ] Classification has one owner and one next step.
- [ ] The next step does not add a rule, runtime feature, or issue without a demonstrated gap.
