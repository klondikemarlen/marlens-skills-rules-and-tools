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
    registeredTools: [],
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
      this.registeredTools.push(tool);
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

const helperTool = pi.registeredTools.find(({ name }) => name === "github_markdown_image_upload_helper_path");
if (!helperTool) {
  fail("the adapter must expose the screenshot upload helper path tool");
}
const helperResult = await helperTool.execute();
if (!helperResult.details.helperUrl.endsWith("/lib/github-markdown-image-upload-helper.mjs")) {
  fail(`unexpected screenshot helper URL: ${helperResult.details.helperUrl}`);
}

const uploaderTool = pi.registeredTools.find(({ name }) => name === "github_pr_screenshot_upload_path");
if (!uploaderTool) {
  fail("the adapter must expose the PR screenshot upload path tool");
}
const uploaderResult = await uploaderTool.execute();
if (!uploaderResult.details.uploaderUrl.endsWith("/lib/github-pr-screenshot-upload.mjs")) {
  fail(`unexpected PR screenshot uploader URL: ${uploaderResult.details.uploaderUrl}`);
}


console.log('OMP plugin adapter contract checks passed');
