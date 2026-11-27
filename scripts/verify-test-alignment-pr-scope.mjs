import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { rmSync } from "node:fs"
import test from "node:test"
import { runVerification } from "../verifications/test-alignment.mjs"

function registerPrScopeTests({
  createProject,
  write,
  git,
  commit,
  runStandalone,
  standaloneResult,
}) {
  test("when a PR adds a second invalid test, only whole-file and standalone checks report the legacy line", (t) => {
    // Arrange
    const project = createProject()
    t.after(() => rmSync(project, { recursive: true, force: true }))

    const testPath = "tests/parcel.test.js"
    const legacyTest = "test('legacy parcel', () => { expect(true).toEqual(true) })\n"
    const introducedTest = "test('ships parcel', () => { expect(true).toEqual(true) })\n"
    write(project, testPath, legacyTest)
    commit(project, "legacy parcel test")
    const baseCommit = commitId(project)
    git(project, ["switch", "--quiet", "-c", "feature"])
    write(project, testPath, legacyTest + introducedTest)
    commit(project, "introduce a second invalid test")

    const lineRanges = { [testPath]: [[2, 2]] }
    const changedLineScope = prScopeEnvironment(project, baseCommit, [testPath], { lineRanges })
    const wholeFileScope = prScopeEnvironment(project, baseCommit, [testPath], {
      mode: "changed-lines-and-files",
      lineRanges,
      wholeFilePaths: [testPath],
    })

    // Act
    const changedLines = runStandalone(project, changedLineScope)
    const wholeFile = runStandalone(project, wholeFileScope)
    const standalone = runStandalone(project, {
      MARLENS_TEST_ALIGNMENT_BASE: baseCommit,
      OMP_VERIFIER_CHANGED_PATHS: undefined,
      OMP_VERIFIER_PR_SCOPE: undefined,
    })

    // Assert
    assert.equal(changedLines.status, 1)
    const changedLineResult = standaloneResult(changedLines)
    assert.equal(changedLineResult.status, "FAIL")
    assert.deepEqual(findingLocations(changedLineResult), [`${testPath}:2`, `${testPath}:2`])

    for (const processResult of [wholeFile, standalone]) {
      assert.equal(processResult.status, 1)
      const result = standaloneResult(processResult)
      assert.equal(result.status, "FAIL")
      assert.deepEqual(findingLocations(result), [
        `${testPath}:1`,
        `${testPath}:1`,
        `${testPath}:2`,
        `${testPath}:2`,
      ])
    }
  })

  test("when a stacked PR mixes whole-file and changed-line paths, each path keeps its own eligibility", (t) => {
    // Arrange
    const project = createProject()
    t.after(() => rmSync(project, { recursive: true, force: true }))

    const changedPath = "tests/changed.test.ts"
    const cleanupPath = "tests/cleanup.test.ts"
    const legacyTest = "test('legacy parcel', () => { expect(true).toEqual(true) })\n"
    const shipmentTest = `test('when a parcel ships, returns the shipment', () => {
  // Arrange
  const parcel = createParcel()
  // Act
  const shipment = shipParcel(parcel)
  // Assert
  expect(shipment.parcel).toEqual(parcel)
})
`
    write(project, "README.md", "# Parcel shipping\n")
    commit(project, "main baseline")
    git(project, ["switch", "--quiet", "-c", "stack-parent"])
    write(project, changedPath, legacyTest + shipmentTest)
    write(project, cleanupPath, legacyTest)
    commit(project, "stack parent introduces both test files")
    const parentCommit = commitId(project)
    git(project, ["switch", "--quiet", "-c", "stack-child"])
    write(
      project,
      changedPath,
      legacyTest + shipmentTest.replace("\n})", "\n  expect(shipment.state).toBe('shipped')\n})")
    )
    write(project, cleanupPath, `${legacyTest}// Opt this path into cleanup.\n`)
    commit(project, "child adds a second assertion and touches the cleanup path")

    const scope = prScopeEnvironment(project, parentCommit, [changedPath, cleanupPath], {
      mode: "changed-lines-and-files",
      lineRanges: { [changedPath]: [[9, 9]], [cleanupPath]: [[2, 2]] },
      wholeFilePaths: [cleanupPath],
    })

    // Act: the standalone base disagrees with the delivered scope's actual parent.
    const result = runVerification(project, { MARLENS_TEST_ALIGNMENT_BASE: "main", ...scope })

    // Assert
    assert.equal(result.status, "FAIL")
    assert.deepEqual(findingLocations(result), [
      `${changedPath}:9`,
      `${cleanupPath}:1`,
      `${cleanupPath}:1`,
    ])
    assert.match(
      result.evidence,
      /^tests\/changed\.test\.ts:9:.*marlens-test-alignment: one-direct-expect\b/mu
    )
  })

  test("when a PR scope refreshes after a rename and deletion, only the new destination line can fail", (t) => {
    // Arrange
    const project = createProject()
    t.after(() => rmSync(project, { recursive: true, force: true }))

    const originalPath = "tests/parcel.test.js"
    const renamedPath = "tests/shipment.test.js"
    const deletedPath = "tests/retired.test.js"
    const legacyTest =
      "test('legacy parcel awaiting a tracking reference', () => { expect(true).toEqual(true) })\n"
    write(project, originalPath, legacyTest)
    write(project, deletedPath, "test('retired route', () => { expect(true).toEqual(true) })\n")
    commit(project, "original parcel and retired route tests")
    const baseCommit = commitId(project)
    git(project, ["switch", "--quiet", "-c", "feature"])
    git(project, ["mv", originalPath, renamedPath])
    git(project, ["rm", deletedPath])
    commit(project, "rename the parcel test and remove the retired test")

    const changedPaths = [originalPath, deletedPath, renamedPath]
    const renameScope = prScopeEnvironment(project, baseCommit, changedPaths, {
      lineRanges: { [renamedPath]: [] },
      deletedPaths: [deletedPath],
    })

    // Act
    const renameResult = runVerification(project, renameScope)
    const renameCli = runStandalone(project, renameScope)

    // Assert
    assert.equal(renameResult.status, "PASS")
    assert.deepEqual(findingLocations(renameResult), [])
    assert.equal(renameCli.status, 0)
    assert.equal(standaloneResult(renameCli).status, "PASS")

    // Arrange
    const introducedTest = "test('ships parcel', () => { expect(true).toEqual(true) })\n"
    write(project, renamedPath, legacyTest + introducedTest)
    commit(project, "change the renamed test file")
    const refreshedScope = prScopeEnvironment(project, baseCommit, changedPaths, {
      lineRanges: { [renamedPath]: [[2, 2]] },
      deletedPaths: [deletedPath],
    })

    // Act
    const refreshedResult = runVerification(project, refreshedScope)

    // Assert
    assert.equal(refreshedResult.status, "FAIL")
    assert.deepEqual(findingLocations(refreshedResult), [`${renamedPath}:2`, `${renamedPath}:2`])
  })
}

function prScopeEnvironment(project, baseCommit, changedPaths, eligibility) {
  return {
    OMP_VERIFIER_CHANGED_PATHS: JSON.stringify(changedPaths),
    OMP_VERIFIER_PR_SCOPE: JSON.stringify({
      version: 1,
      baseCommit,
      mergeBaseCommit: baseCommit,
      headCommit: commitId(project),
      mode: "changed-lines",
      wholeFilePaths: [],
      deletedPaths: [],
      ...eligibility,
    }),
  }
}

function findingLocations({ evidence }) {
  return Array.from(evidence.matchAll(/^([^:\n]+:\d+): /gmu), ([, location]) => location).sort()
}

function commitId(directory) {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: directory, encoding: "utf8" }).trim()
}

export default registerPrScopeTests
