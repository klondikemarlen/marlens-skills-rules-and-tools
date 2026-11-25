import assert from "node:assert/strict"
import { test } from "node:test"

import parseSetting, { parseSetting as namedParseSetting } from "./parse-setting.mjs"

test("keeps the named parser export", () => {
  assert.equal(namedParseSetting, parseSetting)
})

test("ignores whitespace-only lines", () => {
  assert.equal(parseSetting(" \t "), null)
})

test("ignores comments even when they contain a setting", () => {
  assert.equal(parseSetting("  # color=blue  "), null)
})

test("trims surrounding whitespace and preserves additional separators in the value", () => {
  assert.deepEqual(parseSetting("  label = a=b  "), {
    key: "label",
    value: "a=b",
  })
})

test("accepts an empty value", () => {
  assert.deepEqual(parseSetting("color=  "), {
    key: "color",
    value: "",
  })
})

test("rejects a missing separator", () => {
  assert.throws(() => parseSetting("color"), {
    name: "Error",
    message: "Missing setting separator",
  })
})

test("rejects a missing key", () => {
  assert.throws(() => parseSetting("  = blue"), {
    name: "Error",
    message: "Missing setting key",
  })
})
