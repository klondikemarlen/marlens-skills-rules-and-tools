import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { runVerification } from "../verifications/test-alignment.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const verifierPath =
  process.env.MARLENS_TEST_ALIGNMENT_ENTRY ?? path.join(root, "verifications/test-alignment.mjs")

function runStandalone(projectDirectory, environment) {
  return spawnSync(process.execPath, [verifierPath], {
    cwd: projectDirectory,
    encoding: "utf8",
    env: { ...process.env, ...environment },
  })
}

function standaloneResult(processResult) {
  assert.equal(processResult.error, undefined, processResult.error?.message)
  assert.equal(processResult.stderr, "")
  return JSON.parse(processResult.stdout)
}

function git(directory, argumentsList) {
  return execFileSync("git", argumentsList, {
    cwd: directory,
    stdio: "ignore",
  })
}

function write(directory, relativePath, contents) {
  const filePath = path.join(directory, relativePath)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, contents)
}

function createProject() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "marlens-test-alignment-"))
  git(directory, ["init", "--quiet"])
  git(directory, ["config", "user.email", "test@example.com"])
  git(directory, ["config", "user.name", "Test User"])
  git(directory, ["branch", "-M", "main"])
  return directory
}

function commit(directory, message) {
  git(directory, ["add", "."])
  git(directory, ["commit", "--quiet", "-m", message])
}

const guidance = `<!-- marlens-test-alignment: test-name-when -->
<!-- marlens-test-alignment: arrange-act-assert -->
<!-- marlens-test-alignment: one-direct-expect -->
<!-- marlens-test-alignment: no-mock-calls -->
<!-- marlens-test-alignment: describe-file-class-method -->
`

const alignedTest = `describe('widget.test.ts', () => {
  describe('Widget', () => {
    describe('save', () => {
      it('when the widget is valid, saves the widget', () => {
        // Arrange
        const widget = createWidget();

        // Act
        const saved = save(widget);

        // Assert
        expect(saved).toEqual(widget);
      });
    });
  });
});
`

const project = createProject()
const noGuidanceProject = createProject()
const nonTestProject = createProject()
const untrackedTestProject = createProject()
const exemptionProject = createProject()
const suppressionProject = createProject()
const invalidSuppressionProject = createProject()
const automaticScopeProject = createProject()
const combinedPhaseProject = createProject()
const regexProject = createProject()
const cliBlockedProject = createProject()
try {
  write(project, "tests/README.md", guidance)
  write(project, "tests/widget.test.ts", alignedTest)
  commit(project, "baseline")
  git(project, ["switch", "--quiet", "-c", "feature"])
  write(project, "tests/widget.test.ts", `${alignedTest}\n// Changed on this branch.\n`)
  commit(project, "aligned test change")
  // The standalone CLI keeps BLOCKED evidence and fails closed for shell gates.
  const blockedCli = runStandalone(cliBlockedProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "missing-pr-base",
    OMP_VERIFIER_CHANGED_PATHS: undefined,
  })
  assert.equal(blockedCli.status, 1)
  const blockedResult = standaloneResult(blockedCli)
  assert.equal(blockedResult.status, "BLOCKED")
  assert.match(blockedResult.nextCheck, /accessible PR base ref/u)

  const continuationPath = path.join(cliBlockedProject, "continued")
  const shellContinuation = spawnSync(
    "sh",
    ["-c", `node "$1" && printf reached > "$2"`, "test", verifierPath, continuationPath],
    {
      cwd: cliBlockedProject,
      encoding: "utf8",
      env: {
        ...process.env,
        MARLENS_TEST_ALIGNMENT_BASE: "missing-pr-base",
        OMP_VERIFIER_CHANGED_PATHS: undefined,
      },
    }
  )
  assert.equal(shellContinuation.status, 1)
  assert.equal(JSON.parse(shellContinuation.stdout).status, "BLOCKED")
  assert.equal(existsSync(continuationPath), false)

  const failingCliProject = createProject()
  try {
    write(failingCliProject, "tests/README.md", guidance)
    write(failingCliProject, "tests/widget.test.ts", alignedTest)
    commit(failingCliProject, "baseline")
    git(failingCliProject, ["switch", "--quiet", "-c", "feature"])
    write(
      failingCliProject,
      "tests/widget.test.ts",
      "test('saves widget', () => { expect(true).toEqual(true) })\n"
    )

    const failingCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(failingCli.status, 1)
    assert.equal(standaloneResult(failingCli).status, "FAIL")

    write(failingCliProject, "tests/widget.test.ts", `${alignedTest}\n// Corrected on branch.\n`)
    const passingCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(passingCli.status, 0)
    assert.equal(standaloneResult(passingCli).status, "PASS")

    write(
      failingCliProject,
      "tests/README.md",
      `<!-- marlens-test-alignment: test-name-when -->
<!-- marlens-test-alignment: arrange-act-assert -->
`
    )

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test("when a synchronous option is supplied, reads the value", { skip: false }, () => {
  // Arrange
  const input = 1;

  // Act
  const result = input + 1;

  // Assert
  expect(result).toBe(2);
});
`
    )
    const synchronousOptionsCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(synchronousOptionsCli.status, 0)
    assert.equal(standaloneResult(synchronousOptionsCli).status, "PASS")

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test("when an asynchronous option is supplied, reads the value", { skip: false }, async () => {
  // Arrange
  const input = 1;

  // Act
  const result = await Promise.resolve(input + 1);

  // Assert
  expect(result).toBe(2);
});
`
    )
    const asynchronousOptionsCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(asynchronousOptionsCli.status, 0)
    assert.equal(standaloneResult(asynchronousOptionsCli).status, "PASS")

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test.each([2])("when a row is supplied, keeps its callback", (input) => {
  // Arrange
  const value = input;

  // Act
  const result = value;

  // Assert
  expect(result).toBe(2);
}, 100);
`
    )
    const parameterizedTimeoutCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(parameterizedTimeoutCli.status, 0)
    assert.equal(standaloneResult(parameterizedTimeoutCli).status, "PASS")

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test.skip("when a test is skipped, keeps its callback", () => {
  // Arrange
  const value = 2;

  // Act
  const result = value;

  // Assert
  expect(result).toBe(2);
}, 100);
`
    )
    const modifiedTimeoutCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(modifiedTimeoutCli.status, 0)
    assert.equal(standaloneResult(modifiedTimeoutCli).status, "PASS")

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test("when the Act phase is missing, reports a violation", { skip: false }, () => {
  // Arrange
  const value = 2;

  // Assert
  expect(value).toBe(2);
});
`
    )
    const missingOptionPhaseCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(missingOptionPhaseCli.status, 1)
    assert.equal(standaloneResult(missingOptionPhaseCli).status, "FAIL")

    write(
      failingCliProject,
      "tests/widget.test.ts",
      `test("when the phases are out of order, reports a violation", { skip: false }, () => {
  // Act
  const value = 2;

  // Arrange
  const input = value;

  // Assert
  expect(input).toBe(2);
});
`
    )
    const outOfOrderOptionPhasesCli = runStandalone(failingCliProject, {
      MARLENS_TEST_ALIGNMENT_BASE: "main",
      OMP_VERIFIER_CHANGED_PATHS: undefined,
    })
    assert.equal(outOfOrderOptionPhasesCli.status, 1)
    assert.equal(standaloneResult(outOfOrderOptionPhasesCli).status, "FAIL")
  } finally {
    rmSync(failingCliProject, { recursive: true, force: true })
  }

  const aligned = runVerification(project, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(aligned.status, "PASS")
  assert.match(aligned.evidence, /tests\/widget\.test\.ts/)

  write(automaticScopeProject, "tests/README.md", guidance)
  write(automaticScopeProject, "tests/current.test.ts", alignedTest)
  write(
    automaticScopeProject,
    "tests/legacy.test.ts",
    "test('legacy test', () => { expect(true).toEqual(true) })\n"
  )

  const scopedPassing = runVerification(automaticScopeProject, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["tests/current.test.ts"]),
  })
  assert.equal(scopedPassing.status, "PASS")
  assert.match(scopedPassing.evidence, /tests\/current\.test\.ts/u)

  const scopedFailing = runVerification(automaticScopeProject, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["tests/legacy.test.ts"]),
  })
  assert.equal(scopedFailing.status, "FAIL")
  assert.match(scopedFailing.evidence, /tests\/legacy\.test\.ts/u)
  assert.doesNotMatch(scopedFailing.evidence, /tests\/current\.test\.ts/u)

  write(
    project,
    "tests/widget.test.ts",
    `describe('widget.test.ts', () => {
  test('saves widget', () => {
    expect(save.mock.calls).toEqual([]);
    expect(true).toEqual(true);
  });

  it.only('returns its state', function () {
    expect(state).toEqual('ready');
    expect(result).toEqual(state);
    expect(complete).toBe(true);
  });

  it('waits for completion', done => {
    expect(complete).toBe(true);
    expect(done).toBeDefined();
  });

  it.each([[true]])('reports parameterized cases', () => {
    expect(complete).toBe(true);
    expect(result).toEqual('ready');
  });
});
`
  )
  commit(project, "misaligned test change")

  const misaligned = runVerification(project, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(misaligned.status, "FAIL")
  assert.match(misaligned.evidence, /tests\/widget\.test\.ts:2/)
  assert.match(misaligned.evidence, /marlens-test-alignment: test-name-when/)
  assert.match(misaligned.evidence, /marlens-test-alignment: arrange-act-assert/)
  assert.match(misaligned.evidence, /marlens-test-alignment: one-direct-expect/)
  assert.match(
    misaligned.evidence,
    /test "saves widget" contains 2 direct `expect\(\.\.\.\)` calls/
  )
  assert.match(
    misaligned.evidence,
    /test "returns its state" contains 3 direct `expect\(\.\.\.\)` calls/
  )
  assert.match(
    misaligned.evidence,
    /test "waits for completion" contains 2 direct `expect\(\.\.\.\)` calls/
  )
  assert.match(
    misaligned.evidence,
    /test "reports parameterized cases" contains 2 direct `expect\(\.\.\.\)` calls/
  )
  assert.match(misaligned.evidence, /marlens-test-alignment: no-mock-calls/)
  assert.match(misaligned.evidence, /marlens-test-alignment: describe-file-class-method/)
  assert.match(misaligned.nextCheck, /Rename the test/)
  assert.throws(
    () =>
      execFileSync(process.execPath, [path.join(root, "verifications/test-alignment.mjs")], {
        cwd: project,
        encoding: "utf8",
        env: { ...process.env, MARLENS_TEST_ALIGNMENT_BASE: "main" },
      }),
    (error) => error.status === 1
  )

  write(noGuidanceProject, "tests/widget.test.ts", alignedTest)
  commit(noGuidanceProject, "baseline")
  git(noGuidanceProject, ["switch", "--quiet", "-c", "feature"])
  write(
    noGuidanceProject,
    "tests/widget.test.ts",
    `it('saves widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`
  )
  commit(noGuidanceProject, "test without guidance")

  const baseline = runVerification(noGuidanceProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(baseline.status, "FAIL")
  assert.match(baseline.evidence, /shared baseline:1/)
  assert.match(baseline.evidence, /marlens-test-alignment: test-name-when/)
  assert.match(baseline.evidence, /marlens-test-alignment: arrange-act-assert/)

  write(nonTestProject, "src/widget.ts", "export const widget = 1;\n")
  commit(nonTestProject, "baseline")
  git(nonTestProject, ["switch", "--quiet", "-c", "feature"])
  write(nonTestProject, "src/widget.ts", "export const widget = 2;\n")
  commit(nonTestProject, "non-test change")

  const noTests = runVerification(nonTestProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(noTests.status, "PASS")
  assert.match(noTests.summary, /No changed test files/)

  write(
    nonTestProject,
    ".marlens-verifications.json",
    JSON.stringify({
      defaultFunctionExports: { paths: ["src/**/*.ts"] },
    })
  )
  assert.equal(
    runVerification(nonTestProject, { MARLENS_TEST_ALIGNMENT_BASE: "main" }).status,
    "PASS"
  )

  write(untrackedTestProject, "README.md", guidance)
  commit(untrackedTestProject, "baseline")
  git(untrackedTestProject, ["switch", "--quiet", "-c", "feature"])
  write(
    untrackedTestProject,
    "tests/untracked.test.ts",
    `it('saves widget', () => {
  expect(save.mock.calls).toEqual([]);
  expect(true).toEqual(true);
});
`
  )

  const untracked = runVerification(untrackedTestProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(untracked.status, "FAIL")
  assert.match(untracked.evidence, /tests\/untracked\.test\.ts:1/)

  write(exemptionProject, "README.md", "# Assertion policy scope\n")
  commit(exemptionProject, "baseline")
  git(exemptionProject, ["switch", "--quiet", "-c", "feature"])
  const coupledInvariantTest = `test('when a transfer fails, rolls back both balances', async () => {
  // Arrange
  const sourceAccount = await createAccount({ balance: 10 });
  const destinationAccount = await createAccount({ balance: 20 });

  // Act
  await failTransfer(sourceAccount, destinationAccount);

  // Assert
  expect(await reload(sourceAccount)).toEqual({ balance: 10 });
  expect(await reload(destinationAccount)).toEqual({ balance: 20 });
});
`
  write(exemptionProject, "tests/transfer.test.ts", coupledInvariantTest)

  const defaultPolicy = runVerification(exemptionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(defaultPolicy.status, "PASS")

  write(exemptionProject, "tests/README.md", "<!-- marlens-test-alignment: one-direct-expect -->\n")
  const localPolicy = runVerification(exemptionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(localPolicy.status, "FAIL")
  assert.match(localPolicy.evidence, /source tests\/README\.md:1/)

  write(
    exemptionProject,
    "tests/transfer.test.ts",
    coupledInvariantTest.replace(
      "  // Assert",
      "  // Assert\n  // marlens-test-alignment: allow-multiple-expects -- Both balances prove atomic rollback."
    )
  )
  const exempt = runVerification(exemptionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(exempt.status, "PASS")

  write(
    exemptionProject,
    "tests/transfer.test.ts",
    coupledInvariantTest.replace(
      "  // Assert",
      "  // Assert\n  // marlens-test-alignment: allow-multiple-expects"
    )
  )
  assert.equal(
    runVerification(exemptionProject, { MARLENS_TEST_ALIGNMENT_BASE: "main" }).status,
    "FAIL"
  )

  write(
    suppressionProject,
    ".marlens-verifications.json",
    JSON.stringify({
      suppressions: [
        {
          id: "marlens-rules:test-alignment",
          path: "tests/legacy",
          reason: "Legacy tests are being migrated separately.",
          expiresOn: "2099-01-01",
        },
      ],
    })
  )
  write(suppressionProject, "tests/legacy/widget.test.ts", alignedTest)
  write(suppressionProject, "tests/current/widget.test.ts", alignedTest)
  commit(suppressionProject, "baseline")
  git(suppressionProject, ["switch", "--quiet", "-c", "feature"])
  write(
    suppressionProject,
    "tests/legacy/widget.test.ts",
    `it('legacy widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`
  )
  commit(suppressionProject, "suppressed legacy test")

  const suppressedPass = runVerification(suppressionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(suppressedPass.status, "PASS")
  assert.match(suppressedPass.evidence, /tests\/legacy\/widget\.test\.ts/)
  assert.match(suppressedPass.evidence, /Legacy tests are being migrated separately/)

  write(
    suppressionProject,
    "tests/current/widget.test.ts",
    `it('current widget', () => {
  expect(saved).toEqual(widget);
  expect(result).toEqual(saved);
});
`
  )
  commit(suppressionProject, "scoped suppression")

  const suppression = runVerification(suppressionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(suppression.status, "FAIL")
  assert.match(suppression.evidence, /shared baseline:1/)
  assert.match(
    suppression.evidence,
    /Suppressed marlens-rules:test-alignment for tests\/legacy\/widget\.test\.ts/
  )
  assert.match(suppression.evidence, /Legacy tests are being migrated separately/)

  write(invalidSuppressionProject, "tests/widget.test.ts", alignedTest)
  commit(invalidSuppressionProject, "baseline")
  git(invalidSuppressionProject, ["switch", "--quiet", "-c", "feature"])
  write(
    invalidSuppressionProject,
    ".marlens-verifications.json",
    JSON.stringify({
      suppressions: [{ id: "marlens-rules:test-alignment", path: "tests" }],
    })
  )
  write(
    invalidSuppressionProject,
    "tests/widget.test.ts",
    `${alignedTest}\n// Changed on this branch.\n`
  )

  const invalidSuppression = runVerification(invalidSuppressionProject, {
    MARLENS_TEST_ALIGNMENT_BASE: "main",
  })
  assert.equal(invalidSuppression.status, "BLOCKED")
  assert.match(invalidSuppression.evidence, /reason must be a non-empty string/)

  write(
    combinedPhaseProject,
    "tests/README.md",
    "<!-- marlens-test-alignment: one-direct-expect -->\n"
  )
  for (const [phases, expectedStatus] of [
    ["// Arrange\nconst response = makeResponse();\n// Act / Assert", "PASS"],
    ["// Arrange\nconst response = makeResponse();\n// Act and Assert", "PASS"],
    ["// Arrange\nconst response = makeResponse();\n// Act\n// Assert", "PASS"],
    ["// Act / Assert\nconst response = makeResponse();\n// Arrange", "FAIL"],
    ["// Arrange\nconst response = makeResponse();\n// Act", "FAIL"],
  ]) {
    write(
      combinedPhaseProject,
      "tests/response.test.ts",
      `test("when the response matches, accepts the HTTP contract", () => {
${phases}
expect(response).toHaveHttpResponse(200, { id: 7 });
});
`
    )
    const result = runVerification(combinedPhaseProject, {
      OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["tests/response.test.ts"]),
    })
    assert.equal(result.status, expectedStatus, result.evidence)
  }

  // Arrange: a compliant callback whose regex used to consume its closing brace.
  write(
    regexProject,
    "tests/csv.test.ts",
    String.raw`test("when CSV text starts with formula markers, neutralizes the cells", () => {
  // Arrange
  const text = "'=Title,'=Waiting On (User),Open,'+Creator,";

  // Act
  const csv = text;

  // Assert
  expect(csv).toMatch(/'=Title,'=Waiting On \(User\),Open,.*,'\+Creator,/);
});
`
  )

  // Act
  const compliantRegex = runVerification(regexProject, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["tests/csv.test.ts"]),
  })

  // Assert
  assert.equal(compliantRegex.status, "PASS", compliantRegex.evidence)
  assert.equal(compliantRegex.evidence, "Inspected tests/csv.test.ts (2 rules).")

  // Arrange: rewrite that same file with a missing phase and a shifted declaration.
  write(
    regexProject,
    "tests/csv.test.ts",
    String.raw`// Updated source snapshot.

test("when CSV text starts with formula markers, neutralizes the cells", () => {
  // Arrange
  const csv = "'=Title,'=Waiting On (User),Open,'+Creator,";

  // Assert
  expect(csv).toMatch(/'=Title,'=Waiting On \(User\),Open,.*,'\+Creator,/);
});
`
  )

  // Act
  const missingPhase = runVerification(regexProject, {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(["tests/csv.test.ts"]),
  })

  // Assert
  assert.deepEqual(missingPhase, {
    status: "FAIL",
    summary: "1 test-alignment violation(s) found.",
    evidence:
      'tests/csv.test.ts:3: `test("when CSV text starts with formula markers, neutralizes the cells", () => {` — does not contain ordered Arrange, Act, and Assert comments; source shared baseline:1 (`marlens-test-alignment: arrange-act-assert`).',
    nextCheck: "Add ordered Arrange, Act, and Assert comments to the test.",
  })

  console.log("Test alignment verification checks passed")
} finally {
  rmSync(project, { recursive: true, force: true })
  rmSync(noGuidanceProject, { recursive: true, force: true })
  rmSync(nonTestProject, { recursive: true, force: true })
  rmSync(untrackedTestProject, { recursive: true, force: true })
  rmSync(exemptionProject, { recursive: true, force: true })
  rmSync(suppressionProject, { recursive: true, force: true })
  rmSync(invalidSuppressionProject, { recursive: true, force: true })
  rmSync(automaticScopeProject, { recursive: true, force: true })
  rmSync(combinedPhaseProject, { recursive: true, force: true })
  rmSync(regexProject, { recursive: true, force: true })
  rmSync(cliBlockedProject, { recursive: true, force: true })
}
