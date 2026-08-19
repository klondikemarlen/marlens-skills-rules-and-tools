import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIRECTIVES = {
  'test-name-when': {
    summary: 'Test names use `when [condition], [behavior]`.',
    check: checkTestName,
    remediation: 'Rename the test to `when [condition], [behavior]`.',
  },
  'arrange-act-assert': {
    summary: 'Tests use ordered Arrange, Act, and Assert comments.',
    check: checkArrangeActAssert,
    remediation: 'Add ordered Arrange, Act, and Assert comments to the test.',
  },
  'one-direct-expect': {
    summary: 'Tests contain at most one direct `expect(...)` call.',
    check: checkExpectationCount,
    remediation: 'Keep one direct `expect(...)` call unless an explicit exemption applies.',
  },
  'no-mock-calls': {
    summary: 'Tests do not assert against bundled `.mock.calls` objects.',
    check: checkMockCalls,
    remediation: 'Assert the relevant mocked call directly instead of `.mock.calls`.',
  },
  'describe-file-class-method': {
    summary: 'Tests are nested under file, class, and method `describe` blocks.',
    check: checkDescribeDepth,
    remediation: 'Nest this test under file, class, and method `describe` blocks.',
  },
};

const BASELINE_DIRECTIVES = ['test-name-when', 'arrange-act-assert', 'one-direct-expect'];
const CHECK_ID = 'marlens-rules:test-alignment';
const SUPPRESSION_FILE = '.marlens-verifications.json';

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck };
}

function git(repositoryRoot, argumentsList) {
  return execFileSync('git', argumentsList, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function repositoryRoot(projectDirectory) {
  return git(projectDirectory, ['rev-parse', '--show-toplevel']).trim();
}

function changedTestFiles(root, environment) {
  const base = environment.MARLENS_TEST_ALIGNMENT_BASE;
  const comparison = base
    ? ['diff', '--name-only', '-z', '--diff-filter=ACMR', `${base}...HEAD`]
    : ['diff', '--name-only', '-z', '--diff-filter=ACMR', 'HEAD'];
  const committed = git(root, comparison).split('\0').filter(Boolean);
  const worktree = base
    ? git(root, ['diff', '--name-only', '-z', '--diff-filter=ACMR', 'HEAD']).split('\0').filter(Boolean)
    : [];
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);

  return [...new Set([...committed, ...worktree, ...untracked])].filter(isTestPath).sort();
}

function isTestPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/');

  return (
    /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)/u.test(normalized) || /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(normalized)
  );
}

function lineNumber(source, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (source[index] === '\n') line += 1;
  }

  return line;
}

function lineAt(source, line) {
  return source.split('\n')[line - 1]?.trim() ?? '';
}

function parseGuidance(source, relativePath) {
  const rules = new Map();
  const lines = source.split('\n');

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*<!--\s*marlens-test-alignment:\s*([a-z-]+)\s*-->\s*$/u);
    if (!match || !DIRECTIVES[match[1]]) continue;

    rules.set(match[1], {
      path: relativePath,
      line: index + 1,
      directive: match[1],
    });
  }

  return rules;
}

function guidanceForTest(root, testPath) {
  const rules = new Map(
    BASELINE_DIRECTIVES.map((directive) => [
      directive,
      {
        path: 'shared baseline',
        line: 1,
        directive,
      },
    ]),
  );
  let directory = path.dirname(testPath);

  while (directory !== '.' && directory !== path.dirname(directory)) {
    for (const name of ['README.md', 'README.mdx']) {
      const relativePath = path.join(directory, name).replaceAll('\\', '/');
      const absolutePath = path.join(root, relativePath);
      if (!existsSync(absolutePath)) continue;

      for (const [directive, source] of parseGuidance(readFileSync(absolutePath, 'utf8'), relativePath)) {
        if (!rules.has(directive)) rules.set(directive, source);
      }
    }

    directory = path.dirname(directory);
  }

  for (const name of ['README.md', 'README.mdx']) {
    const absolutePath = path.join(root, name);
    if (!existsSync(absolutePath)) continue;

    for (const [directive, source] of parseGuidance(readFileSync(absolutePath, 'utf8'), name)) {
      if (!rules.has(directive)) rules.set(directive, source);
    }
  }

  return rules;
}

function suppressionScope(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('suppression path must be a non-empty relative path');
  }

  const normalized = path.posix.normalize(value);
  if (path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) {
    throw new Error('suppression path must stay inside the project');
  }

  return normalized;
}

function suppressionExpiry(value) {
  if (value === undefined) return undefined;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new Error('suppression expiresOn must use YYYY-MM-DD');
  }

  return value;
}

function readSuppressions(root) {
  const configurationPath = path.join(root, SUPPRESSION_FILE);
  if (!existsSync(configurationPath)) return [];

  let configuration;
  try {
    configuration = JSON.parse(readFileSync(configurationPath, 'utf8'));
  } catch {
    throw new Error(`${SUPPRESSION_FILE} must contain valid JSON`);
  }

  if (!configuration || Array.isArray(configuration) || typeof configuration !== 'object') {
    throw new Error(`${SUPPRESSION_FILE} must contain an object`);
  }

  const suppressions = configuration.suppressions ?? [];
  if (!Array.isArray(suppressions)) {
    throw new Error(`${SUPPRESSION_FILE} suppressions must be an array`);
  }

  const parsedSuppressions = suppressions.map((suppression, index) => {
    if (!suppression || Array.isArray(suppression) || typeof suppression !== 'object') {
      throw new Error(`suppression ${index + 1} must be an object`);
    }
    if (typeof suppression.id !== 'string' || suppression.id.length === 0) {
      throw new Error(`suppression ${index + 1} id must be a non-empty string`);
    }
    if (typeof suppression.reason !== 'string' || suppression.reason.trim().length === 0) {
      throw new Error(`suppression ${index + 1} reason must be a non-empty string`);
    }

    return {
      id: suppression.id,
      path: suppressionScope(suppression.path),
      reason: suppression.reason.trim(),
      expiresOn: suppressionExpiry(suppression.expiresOn),
    };
  });

  for (const suppression of parsedSuppressions) {
    if (
      suppression.id === CHECK_ID &&
      suppression.expiresOn &&
      suppression.expiresOn < new Date().toISOString().slice(0, 10)
    ) {
      throw new Error(`suppression for ${CHECK_ID} at ${suppression.path} expired on ${suppression.expiresOn}`);
    }
  }

  return parsedSuppressions;
}

function matchingSuppression(suppressions, testPath) {
  return suppressions.find((suppression) => {
    if (suppression.id !== CHECK_ID) return false;
    return suppression.path === '.' || testPath === suppression.path || testPath.startsWith(`${suppression.path}/`);
  });
}

function closingDelimiter(source, openingOffset, openingCharacter, closingCharacter) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingOffset; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === openingCharacter) depth += 1;
    if (character === closingCharacter) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return null;
}

function testBlocks(source) {
  const blocks = [];
  const declaration = /\b(?:it|test)(?:\.(?:concurrent|fails|only|skip))?(?:\.each)?\s*\(/gu;

  for (const match of source.matchAll(declaration)) {
    const declarationEnd = match.index + match[0].length;
    let titleOffset = declarationEnd;

    if (match[0].includes('.each')) {
      const eachClosing = closingDelimiter(source, declarationEnd - 1, '(', ')');
      const testCall = eachClosing === null ? null : /^\s*\(/u.exec(source.slice(eachClosing + 1));
      if (eachClosing === null || testCall === null) continue;

      titleOffset = eachClosing + 1 + testCall[0].length;
    }

    const title = /^(['"`])((?:\\.|(?!\1)[\s\S])*)\1/u.exec(source.slice(titleOffset));
    if (title === null) continue;

    const callbackOffset = titleOffset + title[0].length;
    const callback =
      /^\s*,\s*(?:(?:async\s+)?function\s*\([^)]*\)|(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)\s*\{/u.exec(
        source.slice(callbackOffset),
      );
    const openingBrace = callback === null ? -1 : callbackOffset + callback[0].lastIndexOf('{');
    const closing = openingBrace === -1 ? null : closingDelimiter(source, openingBrace, '{', '}');
    const line = lineNumber(source, match.index);

    blocks.push({
      name: title[2],
      line,
      code: lineAt(source, line),
      body: closing === null ? '' : source.slice(openingBrace + 1, closing),
      offset: match.index,
    });
  }

  return blocks;
}

function checkTestName(block) {
  return /^when\s+.+,\s+.+$/iu.test(block.name) ? null : 'does not use `when [condition], [behavior]` naming';
}

function checkArrangeActAssert(block) {
  const arrange = block.body.search(/(?:\/\/|\/\*)\s*Arrange\b/u);
  const act = block.body.search(/(?:\/\/|\/\*)\s*Act\b/u);
  const assert = block.body.search(/(?:\/\/|\/\*)\s*Assert\b/u);

  return arrange !== -1 && act > arrange && assert > act
    ? null
    : 'does not contain ordered Arrange, Act, and Assert comments';
}

function directExpectationCount(source) {
  let count = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (!source.startsWith('expect', index)) continue;

    const before = source[index - 1] ?? '';
    const after = source[index + 6] ?? '';
    if (/[\w$]/u.test(before) || /[\w$]/u.test(after)) continue;

    let openingParenthesis = index + 6;
    while (/\s/u.test(source[openingParenthesis])) openingParenthesis += 1;
    if (source[openingParenthesis] === '(') count += 1;
  }

  return count;
}

function checkExpectationCount(block) {
  const count = directExpectationCount(block.body);
  const exemption = /^\s*\/\/\s*marlens-test-alignment:\s*allow-multiple-expects\s+--\s+\S/mu;

  return count <= 1 || exemption.test(block.body)
    ? null
    : `test ${JSON.stringify(block.name)} contains ${count} direct \`expect(...)\` calls`;
}

function checkMockCalls(block) {
  return /\.mock\s*\.calls\b/gu.test(block.body) ? 'asserts against `.mock.calls`' : null;
}

function describeDepth(source, offset) {
  const tokens = /\bdescribe\s*\(|[{}]/gu;
  const stack = [];
  let describesNextBlock = false;

  for (const match of source.slice(0, offset).matchAll(tokens)) {
    if (match[0].startsWith('describe')) {
      describesNextBlock = true;
    } else if (match[0] === '{') {
      stack.push(describesNextBlock);
      describesNextBlock = false;
    } else {
      stack.pop();
    }
  }

  return stack.filter(Boolean).length;
}

function checkDescribeDepth(block, source) {
  return describeDepth(source, block.offset) >= 3
    ? null
    : 'is not nested under file, class, and method `describe` blocks';
}

function formatViolation(testPath, block, source, reason) {
  return `${testPath}:${block.line}: \`${block.code}\` — ${reason}; source ${source.path}:${source.line} (\`marlens-test-alignment: ${source.directive}\`).`;
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  let root;
  try {
    if (!statSync(projectDirectory).isDirectory()) {
      return result(
        'BLOCKED',
        'The active project directory is unavailable.',
        `Cannot inspect ${projectDirectory}.`,
        'Run the check from an accessible project directory.',
      );
    }

    root = repositoryRoot(projectDirectory);
  } catch {
    return result(
      'BLOCKED',
      'Git metadata is unavailable for the active project.',
      'Cannot determine which changed test files to inspect.',
      'Run the check from a Git project.',
    );
  }

  let testPaths;
  try {
    testPaths = changedTestFiles(root, environment);
  } catch {
    return result(
      'BLOCKED',
      'Changed files could not be inspected.',
      'Git returned an unexpected error while reading the configured base diff or worktree diff.',
      'Set MARLENS_TEST_ALIGNMENT_BASE to an accessible PR base ref, or confirm Git can inspect the active project.',
    );
  }

  if (testPaths.length === 0) {
    return result(
      'PASS',
      'No changed test files require alignment review.',
      'The worktree diff contains no changed test files.',
      'No follow-up check is required.',
    );
  }

  let suppressions;
  try {
    suppressions = readSuppressions(root);
  } catch (error) {
    return result(
      'BLOCKED',
      'Test-alignment suppression configuration is invalid.',
      error.message,
      `Fix ${SUPPRESSION_FILE} before running ${CHECK_ID}.`,
    );
  }

  const configured = [];
  const suppressed = [];
  const violations = [];

  for (const testPath of testPaths) {
    const suppression = matchingSuppression(suppressions, testPath);
    if (suppression) {
      suppressed.push(`${testPath} (${suppression.path}: ${suppression.reason})`);
      continue;
    }

    const guidance = guidanceForTest(root, testPath);
    const source = readFileSync(path.join(root, testPath), 'utf8');
    const blocks = testBlocks(source);
    configured.push(`${testPath} (${guidance.size} rule${guidance.size === 1 ? '' : 's'})`);

    for (const block of blocks) {
      for (const [directive, ruleSource] of guidance) {
        const reason = DIRECTIVES[directive].check(block, source);
        if (!reason) continue;

        violations.push({
          evidence: formatViolation(testPath, block, ruleSource, reason),
          remediation: DIRECTIVES[directive].remediation,
        });
      }
    }
  }

  if (violations.length > 0) {
    const suppressionEvidence = suppressed.length > 0 ? `\nSuppressed ${CHECK_ID} for ${suppressed.join(', ')}.` : '';
    return result(
      'FAIL',
      `${violations.length} test-alignment violation(s) found.`,
      `${violations.map(({ evidence }) => evidence).join('\n')}${suppressionEvidence}`,
      [...new Set(violations.map(({ remediation }) => remediation))].join(' '),
    );
  }

  const inspected = configured.length > 0 ? `Inspected ${configured.join(', ')}.` : '';
  const skipped = suppressed.length > 0 ? ` Suppressed ${CHECK_ID} for ${suppressed.join(', ')}.` : '';
  return result(
    'PASS',
    configured.length > 0
      ? 'Changed test files follow shared baseline and local alignment guidance.'
      : 'Changed test files are covered by a scoped test-alignment suppression.',
    `${inspected}${skipped}`.trim(),
    'No follow-up check is required.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const verification = runVerification();
  process.stdout.write(`${JSON.stringify(verification)}\n`);
  if (verification.status === 'FAIL') process.exitCode = 1;
}
