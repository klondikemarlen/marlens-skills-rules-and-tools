import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))

const pack = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: root,
  encoding: "utf8",
})
assert.equal(pack.status, 0, pack.stderr)

const [archive] = JSON.parse(pack.stdout)
const published = new Set(archive.files.map(({ path: file }) => file))

function expectPublished(declaredPath) {
  const relativePath = declaredPath.replace(/^\.\//, "")
  const included =
    published.has(relativePath) ||
    [...published].some((file) => file.startsWith(`${relativePath.replace(/\/$/, "")}/`))

  assert.ok(included, `${declaredPath} is missing from npm pack output`)
}

for (const declaredPath of packageJson.files) expectPublished(declaredPath)
for (const commandPath of Object.values(packageJson.bin)) expectPublished(commandPath)
for (const manifest of [packageJson.omp, packageJson.pi].filter(Boolean)) {
  for (const extension of manifest.extensions ?? []) expectPublished(extension)
  for (const skill of manifest.skills ?? []) expectPublished(skill)
}
for (const verification of packageJson.omp.verifications ?? []) {
  const declaredPath =
    verification.mode === "agentic" ? verification.contract : verification.entry
  expectPublished(declaredPath)
}

console.log("package contents checks passed")
