import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIGURATION_FILE = '.marlens-verifications.json';
const CONFIGURATION_KEY = 'defaultFunctionExports';
const TYPESCRIPT_EXTENSIONS = new Set(['.cts', '.mts', '.ts', '.tsx']);
const DEFAULT_FUNCTION_DECLARATION = /^\s*export\s+default\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][\w$]*)/gmu;

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck };
}

function git(repositoryRoot, argumentsList, encoding = 'utf8') {
  return execFileSync('git', argumentsList, {
    cwd: repositoryRoot,
    encoding,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function projectRoot(projectDirectory) {
  if (!statSync(projectDirectory).isDirectory()) {
    throw new Error('Project directory is unavailable.');
  }

  return git(projectDirectory, ['rev-parse', '--show-toplevel']).trim();
}

function configuredPathPattern(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('configured paths must be non-empty strings');
  }

  const normalized = value.replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) {
    throw new Error('configured paths must stay inside the project');
  }

  return normalized;
}

function configuredPaths(repositoryRoot) {
  const configurationPath = path.join(repositoryRoot, CONFIGURATION_FILE);
  if (!existsSync(configurationPath)) return null;

  let configuration;
  try {
    configuration = JSON.parse(readFileSync(configurationPath, 'utf8'));
  } catch {
    throw new Error(`${CONFIGURATION_FILE} must contain valid JSON`);
  }

  if (!configuration || Array.isArray(configuration) || typeof configuration !== 'object') {
    throw new Error(`${CONFIGURATION_FILE} must contain an object`);
  }

  const convention = configuration[CONFIGURATION_KEY];
  if (convention === undefined) return null;
  if (!convention || Array.isArray(convention) || typeof convention !== 'object' || !Array.isArray(convention.paths) || convention.paths.length === 0) {
    throw new Error(`${CONFIGURATION_KEY} must contain a non-empty paths array`);
  }

  return convention.paths.map(configuredPathPattern);
}

function matchesGlob(filePath, pattern) {
  let expression = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      if (pattern[index + 2] === '/') {
        expression += '(?:.*/)?';
        index += 2;
      } else {
        expression += '.*';
        index += 1;
      }
    } else if (character === '*') {
      expression += '[^/]*';
    } else if (character === '?') {
      expression += '[^/]';
    } else {
      expression += character.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
    }
  }

  return new RegExp(`${expression}$`, 'u').test(filePath);
}

function typescriptProjectFiles(repositoryRoot, patterns) {
  return git(repositoryRoot, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], 'buffer')
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((filePath) => TYPESCRIPT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .filter((filePath) => patterns.some((pattern) => matchesGlob(filePath, pattern)));
}

function lineNumber(source, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (source[index] === '\n') line += 1;
  }

  return line;
}

function defaultFunctionDeclarations(source) {
  return [...source.matchAll(DEFAULT_FUNCTION_DECLARATION)].map((match) => ({
    line: lineNumber(source, match.index),
    symbol: match[1],
  }));
}

export function runVerification(projectDirectory = process.cwd()) {
  let repositoryRoot;
  try {
    repositoryRoot = projectRoot(projectDirectory);
  } catch {
    return result(
      'BLOCKED',
      'Git metadata is unavailable for the active project.',
      'Cannot inspect configured TypeScript modules.',
      'Run the check from a Git project.',
    );
  }

  let patterns;
  try {
    patterns = configuredPaths(repositoryRoot);
  } catch (error) {
    return result(
      'BLOCKED',
      'The default-function export convention is invalid.',
      error.message,
      `Configure ${CONFIGURATION_KEY}.paths with project-relative TypeScript path patterns.`,
    );
  }

  if (patterns === null) {
    return result(
      'PASS',
      'No default-function export convention is configured.',
      `Add ${CONFIGURATION_KEY}.paths to ${CONFIGURATION_FILE} to opt in.`,
      'No follow-up check is required.',
    );
  }

  let files;
  try {
    files = typescriptProjectFiles(repositoryRoot, patterns);
  } catch {
    return result(
      'BLOCKED',
      'Configured TypeScript modules could not be listed.',
      'Git returned an unexpected error while listing project files.',
      'Confirm Git can inspect the active project and run the check again.',
    );
  }

  const violations = [];
  for (const relativePath of files) {
    try {
      const source = readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
      for (const declaration of defaultFunctionDeclarations(source)) {
        violations.push({ path: relativePath, ...declaration });
      }
    } catch {
      return result(
        'BLOCKED',
        'A configured TypeScript module could not be inspected.',
        `Cannot read ${relativePath}.`,
        'Restore the file or its permissions, then run the check again.',
      );
    }
  }

  if (violations.length > 0) {
    const evidence = violations
      .map(({ path: relativePath, line, symbol }) => `${relativePath}:${line} exports default function ${symbol}; use \`export function ${symbol}\` and \`export default ${symbol}\`.`)
      .join(' ');
    return result(
      'FAIL',
      `${violations.length} configured default function declaration(s) violate the named-export convention.`,
      evidence,
      'Replace each default function declaration with a named function and a matching default export.',
    );
  }

  return result(
    'PASS',
    'Configured TypeScript modules use the named-function default-export convention.',
    `Inspected ${files.length} configured TypeScript module(s).`,
    'No follow-up check is required.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`);
}
