import marlensSkillsRulesAndTools from '../omp-plugin/index.ts';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function fail(message) {
  throw new Error(message);
}

function createFakePi() {
  return {
    label: null,
    setLabel(label) {
      this.label = label;
    },
    registerCommand() {
      fail('the adapter must not register commands');
    },
  };
}

const pi = createFakePi();
marlensSkillsRulesAndTools(pi);

const temporaryRepository = mkdtempSync(path.join(os.tmpdir(), "omp-plugin-bin-"));
try {
  execFileSync("git", ["init", "--quiet"], { cwd: temporaryRepository });
  const output = execFileSync("check-commit-scope", [], { cwd: temporaryRepository, encoding: "utf8" });
  if (output.trim() !== "Staged files satisfy commit file-type boundaries.") fail(`unexpected scope-check output: ${output}`);
} finally {
  rmSync(temporaryRepository, { recursive: true, force: true });
}

if (pi.label !== "Marlen's Skills, Rules, and Tools") fail(`unexpected label: ${pi.label}`);


console.log('OMP plugin adapter contract checks passed');
