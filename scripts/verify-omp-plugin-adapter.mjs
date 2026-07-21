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
    registeredTool: null,
    zod: {
      z: {
        object(shape) {
          return shape;
        },
      },
    },
    registerCommand() {
      fail('the adapter must not register commands');
    },
    registerTool(tool) {
      this.registeredTool = tool;
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

if (pi.registeredTool?.name !== "github_markdown_image_upload_helper_path") {
  fail("the adapter must expose the screenshot upload helper path tool");
}
const toolResult = await pi.registeredTool.execute();
if (!toolResult.details.helperUrl.endsWith("/lib/github-markdown-image-upload-helper.mjs")) {
  fail(`unexpected screenshot helper URL: ${toolResult.details.helperUrl}`);
}


console.log('OMP plugin adapter contract checks passed');
