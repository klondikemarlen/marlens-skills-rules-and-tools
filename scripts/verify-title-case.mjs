import assert from "node:assert/strict"
import test from "node:test"
import { spawnSync } from "node:child_process"

import { isTitleCase } from "../lib/title-case.js"

test("title-case validation", async (suite) => {
  await suite.test("accepts title-case display titles and preserved terms", () => {
    assert.equal(isTitleCase("Fix GitHub Issue Titles"), true)
    assert.equal(isTitleCase("Require OMP Plugin Checks"), true)
    assert.equal(
      isTitleCase("Use check-title-case Before Delivery", {
        preserve: ["check-title-case"],
      }),
      true
    )
    assert.equal(isTitleCase("Follow-up Review Checks"), true)
    assert.equal(isTitleCase("State-of-the-Art Review Checks"), true)
  })

  await suite.test("rejects sentence-case titles and incorrect hyphen casing", () => {
    assert.equal(isTitleCase("Fix GitHub issue titles"), false)
    assert.equal(isTitleCase("Follow-Up Review Checks"), false)
    assert.equal(isTitleCase(""), false)
  })

  await suite.test("CLI catches a sentence-case title before delivery", () => {
    const result = spawnSync(
      process.execPath,
      ["bin/check-title-case", "--title", "Investigate why GitHub issue titles are missed"],
      { encoding: "utf8" }
    )

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /not title case/u)
  })

  await suite.test("CLI preserves exact identifiers while checking the rest", () => {
    const result = spawnSync(
      process.execPath,
      [
        "bin/check-title-case",
        "--title",
        "Use check-title-case Before GitHub Delivery",
        "--preserve",
        "check-title-case",
      ],
      { encoding: "utf8" }
    )

    assert.equal(result.status, 0)
    assert.match(result.stdout, /Title case OK/u)
  })
})
