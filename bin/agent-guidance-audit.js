#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = `Usage: agent-guidance-audit [--json] [--strict] [--self-test] [--mirror <left>=<right>] <downstream-root>...

Read-only audit for downstream agent guidance. Reports stale package names, removed learner surfaces, broken local Markdown/backtick paths, optional workflow inventory drift, and optional explicit mirror drift.`;

const TEXT_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.yml', '.yaml', '.json']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', 'tmp', 'dist', 'build', '.next', '.nuxt', 'coverage']);
const PATH_PREFIXES = ['./', '../', 'docs/', 'agents/', 'skills/', 'scripts/', 'lib/', 'bin/', 'rules/', 'omp-plugin/', '.omp-plugin/', '.claude-plugin/'];

const STALE_LITERALS = [
  { check: 'stale-package-name', needle: 'marlens-rules-and-skills', detail: 'use marlens-skills-rules-and-tools' },
  { check: 'stale-install-command', needle: 'omp install github:klondikemarlen/marlens-skills-rules-and-tools', detail: 'use omp plugin install github:klondikemarlen/marlens-skills-rules-and-tools' },
  { check: 'removed-learner-surface', needle: '/learner', detail: 'learner moved out of this package' },
  { check: 'removed-learner-surface', needle: 'learner_record_candidate', detail: 'learner moved out of this package' },
  { check: 'removed-learner-surface', needle: 'docs/workflows/learner-feedback-workflow.md', detail: 'learner workflow moved out of this package' },
  { check: 'removed-learner-surface', needle: 'docs/evals/learner-feedback.json', detail: 'learner eval moved out of this package' },
  { check: 'removed-learner-surface', needle: 'skills/learner', detail: 'learner skill moved out of this package' },
  { check: 'removed-learner-surface', needle: 'omp-plugin/learner', detail: 'learner runtime moved out of this package' },
];

function parseArgs(argv) {
  const options = { json: false, strict: false, selfTest: false, mirrors: [], roots: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--self-test') {
      options.selfTest = true;
    } else if (arg === '--mirror') {
      const pair = argv[index + 1];
      if (!pair || !pair.includes('=')) throw new Error('--mirror requires <left>=<right>');
      options.mirrors.push(pair);
      index += 1;
    } else if (arg.startsWith('--mirror=')) {
      const pair = arg.slice('--mirror='.length);
      if (!pair.includes('=')) throw new Error('--mirror requires <left>=<right>');
      options.mirrors.push(pair);
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option ${arg}`);
    } else {
      options.roots.push(arg);
    }
  }

  return options;
}

function lineNumber(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

function isUrlOrAnchor(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target);
}

function cleanTarget(target) {
  return target.split('#')[0].split('?')[0].trim();
}

function isPathLike(token) {
  return PATH_PREFIXES.some((prefix) => token.startsWith(prefix));
}

function markdownTargetExists(baseDir, target) {
  return !target || existsSync(path.resolve(baseDir, target));
}

function backtickPathExists(baseDir, root, token) {
  if (!token) return true;
  const base = token.startsWith('./') || token.startsWith('../') ? baseDir : root;
  return existsSync(path.resolve(base, token));
}

function finding(root, file, line, check, detail, target = null) {
  return {
    root,
    file: path.relative(root, file) || '.',
    line,
    check,
    detail,
    target,
  };
}

function walkFiles(root, files = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(root, file) {
  const text = readFileSync(file, 'utf8');
  const baseDir = path.dirname(file);
  const results = [];

  for (const stale of STALE_LITERALS) {
    let offset = text.indexOf(stale.needle);
    while (offset !== -1) {
      results.push(finding(root, file, lineNumber(text, offset), stale.check, stale.detail, stale.needle));
      offset = text.indexOf(stale.needle, offset + stale.needle.length);
    }
  }

  for (const match of text.matchAll(/!??\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const rawTarget = match[1];
    if (isUrlOrAnchor(rawTarget)) continue;
    const target = cleanTarget(rawTarget);
    if (!target || target.includes('*') || target.startsWith('<')) continue;
    if (!markdownTargetExists(baseDir, target)) {
      results.push(finding(root, file, lineNumber(text, match.index), 'markdown-link', `missing target ${target}`, target));
    }
  }

  for (const match of text.matchAll(/`([^`\n]+)`/g)) {
    const token = cleanTarget(match[1]);
    if (!isPathLike(token) || token.includes('*') || token.includes(' ') || token.includes('{')) continue;
    if (!backtickPathExists(baseDir, root, token)) {
      results.push(finding(root, file, lineNumber(text, match.index), 'backtick-path', `missing target ${token}`, token));
    }
  }

  return results;
}

function markdownInventoryPaths(text) {
  const paths = new Set();
  for (const match of text.matchAll(/(?:`|\()([^`()\s]*(?:agents|docs)\/workflows\/[^`()\s]+\.md)(?:`|\))/g)) {
    paths.add(match[1]);
  }
  for (const match of text.matchAll(/`([^`\/\s]+-workflow\.md)`/g)) {
    paths.add(match[1]);
  }
  return paths;
}

function scanWorkflowInventory(root) {
  const results = [];
  for (const relativeDir of ['agents/workflows', 'docs/workflows']) {
    const workflowDir = path.join(root, relativeDir);
    const readmePath = path.join(workflowDir, 'README.md');
    if (!existsSync(workflowDir) || !existsSync(readmePath)) continue;

    const actual = new Set(readdirSync(workflowDir).filter((name) => name.endsWith('.md') && name !== 'README.md').map((name) => `${relativeDir}/${name}`));
    const listed = markdownInventoryPaths(readFileSync(readmePath, 'utf8'));

    for (const item of actual) {
      if (!listed.has(item) && !listed.has(path.basename(item))) {
        results.push(finding(root, readmePath, 1, 'workflow-inventory', `missing inventory entry ${item}`, item));
      }
    }
    for (const item of listed) {
      const normalized = item.startsWith(relativeDir) ? item : `${relativeDir}/${path.basename(item)}`;
      if (!actual.has(normalized)) {
        results.push(finding(root, readmePath, 1, 'workflow-inventory', `inventory lists missing workflow ${item}`, item));
      }
    }
  }
  return results;
}

function relativeFileMap(dir) {
  const files = new Map();
  if (!existsSync(dir)) return files;
  for (const file of walkFiles(dir, [])) {
    files.set(path.relative(dir, file), readFileSync(file));
  }
  return files;
}

function scanMirror(pair) {
  const [leftRaw, rightRaw] = pair.split('=');
  const left = path.resolve(leftRaw);
  const right = path.resolve(rightRaw);
  const root = process.cwd();
  const results = [];

  if (!existsSync(left)) return [finding(root, left, 1, 'mirror-drift', `missing mirror path ${leftRaw}`, leftRaw)];
  if (!existsSync(right)) return [finding(root, right, 1, 'mirror-drift', `missing mirror path ${rightRaw}`, rightRaw)];

  const leftFiles = relativeFileMap(left);
  const rightFiles = relativeFileMap(right);
  const allNames = new Set([...leftFiles.keys(), ...rightFiles.keys()]);

  for (const name of [...allNames].sort()) {
    if (!leftFiles.has(name)) {
      results.push(finding(root, right, 1, 'mirror-drift', `left missing ${name}`, name));
    } else if (!rightFiles.has(name)) {
      results.push(finding(root, left, 1, 'mirror-drift', `right missing ${name}`, name));
    } else if (!leftFiles.get(name).equals(rightFiles.get(name))) {
      results.push(finding(root, path.join(left, name), 1, 'mirror-drift', `changed ${name}`, name));
    }
  }

  return results;
}

export function auditRoots(options) {
  const results = [];
  for (const rootArg of options.roots) {
    const root = path.resolve(rootArg);
    if (!existsSync(root) || !lstatSync(root).isDirectory()) throw new Error(`root is not a directory: ${rootArg}`);
    for (const file of walkFiles(root, [])) {
      results.push(...scanFile(root, file));
    }
    if (options.strict) results.push(...scanWorkflowInventory(root));
  }
  for (const pair of options.mirrors) {
    results.push(...scanMirror(pair));
  }
  return results;
}

function formatFinding(item) {
  return `FAIL ${path.join(item.root, item.file)}:${item.line} ${item.check} ${item.detail}`;
}

function runSelfTest() {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'agent-guidance-audit-'));
  try {
    const repo = path.join(tempRoot, 'repo');
    const docs = path.join(repo, 'docs', 'workflows');
    const refs = path.join(repo, 'docs', 'references');
    mkdirSync(docs, { recursive: true });
    mkdirSync(refs, { recursive: true });
    writeFileSync(path.join(refs, 'ok.md'), '# ok\n');
    writeFileSync(path.join(docs, 'ok.md'), '# ok\n');
    writeFileSync(path.join(repo, 'README.md'), '[ok](docs/references/ok.md) [missing](./missing.md) `docs/workflows/nope.md`\n');

    const dirty = auditRoots({ roots: [repo], strict: false, mirrors: [] });
    if (dirty.length !== 2) throw new Error(`expected 2 findings, got ${dirty.length}`);
    const details = dirty.map(formatFinding).join('\n');
    if (!details.includes('markdown-link missing target ./missing.md')) throw new Error('missing Markdown fixture finding');
    if (!details.includes('backtick-path missing target docs/workflows/nope.md')) throw new Error('missing backtick fixture finding');
    if (details.includes('docs/references/ok.md')) throw new Error('valid relative link was reported');

    writeFileSync(path.join(repo, 'README.md'), '[ok](docs/references/ok.md) `docs/workflows/ok.md`\n');
    const clean = auditRoots({ roots: [repo], strict: false, mirrors: [] });
    if (clean.length !== 0) throw new Error(`expected clean fixture, got ${clean.length}`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}


function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.selfTest) {
      runSelfTest();
      console.log('agent guidance audit self-test passed');
      return;
    }
    if (options.roots.length === 0 && options.mirrors.length === 0) throw new Error('provide at least one downstream root or --mirror pair');

    const results = auditRoots(options);
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else if (results.length > 0) {
      console.log(results.map(formatFinding).join('\n'));
    }
    process.exitCode = results.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
