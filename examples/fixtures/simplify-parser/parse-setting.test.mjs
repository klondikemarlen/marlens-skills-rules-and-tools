import assert from "node:assert/strict"
import { test } from "node:test"

import parseSetting, { parseSetting as namedParseSetting } from "./parse-setting.mjs"

test("when called through the named export, parses a setting", () => {
  // Arrange
  const line = "port=3000"

  // Act
  const setting = namedParseSetting(line)

  // Assert
  assert.deepEqual(setting, {
    key: "port",
    value: "3000",
  })
})

test("when the line contains only whitespace, ignores the line", () => {
  // Arrange
  const line = " \t "

  // Act
  const setting = parseSetting(line)

  // Assert
  assert.equal(setting, null)
})

test("when a comment contains a setting, ignores the line", () => {
  // Arrange
  const line = "  # color=blue  "

  // Act
  const setting = parseSetting(line)

  // Assert
  assert.equal(setting, null)
})

test("when the value contains another separator, trims the fields and keeps that separator", () => {
  // Arrange
  const line = "  label = a=b  "

  // Act
  const setting = parseSetting(line)

  // Assert
  assert.deepEqual(setting, {
    key: "label",
    value: "a=b",
  })
})

test("when the value is blank, returns an empty value", () => {
  // Arrange
  const line = "color=  "

  // Act
  const setting = parseSetting(line)

  // Assert
  assert.deepEqual(setting, {
    key: "color",
    value: "",
  })
})

test("when the separator is missing, rejects the setting", () => {
  // Arrange
  const line = "color"

  // Act
  const parseLine = () => parseSetting(line)

  // Assert
  assert.throws(parseLine, {
    name: "Error",
    message: "Missing setting separator",
  })
})

test("when the key is missing, rejects the setting", () => {
  // Arrange
  const line = "  = blue"

  // Act
  const parseLine = () => parseSetting(line)

  // Assert
  assert.throws(parseLine, {
    name: "Error",
    message: "Missing setting key",
  })
})
