import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const executable = path.join(root, "bin/github-pr-stack")
const repository = "owner/project"

function pullUrl(number) {
  return `https://github.com/${repository}/pull/${number}`
}

// The fake gh returns the --jq-projected shape the helper parses, not the
// raw REST payload: the projection contract is what the helper depends on.
function pullFixture(number, { base, head }) {
  return JSON.stringify({
    number,
    state: "open",
    draft: true,
    url: pullUrl(number),
    repo: repository,
    base,
    base_sha: `base-${number}`,
    head,
    head_sha: `head-${number}`,
    stack: null,
  })
}

// `gh api <path>` prints the prepared fixture body; `gh stack link` exits
// with GH_LINK_EXIT so callers can observe failure propagation.
const fakeGh = `#!/bin/sh
if [ "$1" = "api" ]; then
  number="\${2##*pulls/}"
  exec cat "$GH_FIXTURE_DIR/\${number}.json"
fi
if [ "$1" = "stack" ] && [ "$2" = "link" ]; then
  exit "\${GH_LINK_EXIT:-0}"
fi
exit 2
`

function withFakeGh(fixtures, run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "github-pr-stack-"))
  const binDirectory = path.join(directory, "bin")

  try {
    mkdirSync(binDirectory)
    for (const [number, body] of Object.entries(fixtures)) {
      writeFileSync(path.join(binDirectory, `${number}.json`), body)
    }
    const ghPath = path.join(binDirectory, "gh")
    writeFileSync(ghPath, fakeGh)
    chmodSync(ghPath, 0o755)

    const env = {
      ...process.env,
      PATH: `${binDirectory}:${process.env.PATH}`,
      GH_FIXTURE_DIR: binDirectory,
    }

    return run(env)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function runHelper(env, args, extraEnv = {}) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...env, ...extraEnv },
  })
}

test("a valid open bottom-to-top chain preflights cleanly and does not register", () => {
  const result = withFakeGh(
    {
      10: pullFixture(10, { base: "main", head: "slice-one" }),
      11: pullFixture(11, { base: "slice-one", head: "slice-two" }),
    },
    (env) => runHelper(env, ["--json", pullUrl(10), pullUrl(11)])
  )

  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  assert.deepEqual(report.errors, [])
  assert.equal(report.members.length, 2)
  assert.equal(report.members[1].base, "slice-one")
  assert.match(report.linkCommand, /gh stack link/)
})

test("a broken base chain fails preflight and refuses --link mutation", () => {
  const result = withFakeGh(
    {
      10: pullFixture(10, { base: "main", head: "slice-one" }),
      11: pullFixture(11, { base: "main", head: "slice-two" }),
    },
    (env) => runHelper(env, ["--json", "--link", pullUrl(10), pullUrl(11)])
  )

  assert.equal(result.status, 1)
  const report = JSON.parse(result.stdout)
  assert.ok(
    report.errors.some((error) => error.includes("expected the predecessor head slice-one")),
    JSON.stringify(report.errors)
  )
  assert.match(result.stderr, /Refusing --link while preflight errors exist/)
})

test("a gh stack link failure propagates its exit status", () => {
  const result = withFakeGh(
    {
      10: pullFixture(10, { base: "main", head: "slice-one" }),
      11: pullFixture(11, { base: "slice-one", head: "slice-two" }),
    },
    (env) =>
      runHelper(env, ["--json", "--link", pullUrl(10), pullUrl(11)], {
        GH_LINK_EXIT: "7",
      })
  )

  assert.equal(result.status, 7, result.stderr)
})
