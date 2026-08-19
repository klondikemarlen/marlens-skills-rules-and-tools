import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MAX_LINES = 1200;
const SOURCE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.cpp',
  '.cs',
  '.cxx',
  '.ex',
  '.exs',
  '.fs',
  '.fsx',
  '.go',
  '.h',
  '.hpp',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.kts',
  '.mjs',
  '.php',
  '.py',
  '.rb',
  '.rs',
  '.sh',
  '.swift',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
]);
const IGNORED_SEGMENTS = new Set([
  '.git',
  'build',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  'tmp',
  'vendor',
]);

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck };
}

function configuredLimit(environment) {
  const value = environment.MARLENS_MAX_SOURCE_LINES ?? String(DEFAULT_MAX_LINES);
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    return { error: 'MARLENS_MAX_SOURCE_LINES must be a positive integer.' };
  }

  return { limit };
}

function configuredAllowlist(environment) {
  return new Set(
    (environment.MARLENS_SOURCE_SIZE_ALLOWLIST ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function isSourcePath(relativePath) {
  const segments = relativePath.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

function lineCount(contents) {
  if (contents.length === 0) {
    return 0;
  }

  let lines = 1;
  for (const byte of contents) {
    if (byte === 0x0a) {
      lines += 1;
    }
  }

  return contents[contents.length - 1] === 0x0a ? lines - 1 : lines;
}

function sourceFilesFromGit(repositoryRoot, arguments_) {
  const output = execFileSync('git', arguments_, {
    cwd: repositoryRoot,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter(isSourcePath);
}

function trackedSourceFiles(repositoryRoot) {
  return sourceFilesFromGit(repositoryRoot, ['ls-files', '-z']);
}

function stagedSourceFiles(repositoryRoot) {
  return sourceFilesFromGit(repositoryRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']);
}

function repositoryRoot(projectDirectory) {
  if (!statSync(projectDirectory).isDirectory()) {
    throw new Error('Project directory is unavailable.');
  }

  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: projectDirectory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function runSourceVerification(projectDirectory, environment, sourceFiles, readSourceFile, scope) {
  let root;
  try {
    root = repositoryRoot(projectDirectory);
  } catch {
    return result(
      'BLOCKED',
      'Git metadata is unavailable for the active project.',
      `Cannot determine which ${scope.toLowerCase()} source files to inspect.`,
      'Run the check from a Git project.',
    );
  }

  const configured = configuredLimit(environment);
  if (configured.error) {
    return result(
      'BLOCKED',
      'The source-file size limit is invalid.',
      configured.error,
      'Set MARLENS_MAX_SOURCE_LINES to a positive integer and run the check again.',
    );
  }

  const allowlist = configuredAllowlist(environment);
  let files;
  try {
    files = sourceFiles(root);
  } catch {
    return result(
      'BLOCKED',
      `${scope} source files could not be inspected.`,
      'Git returned an unexpected error while listing source files.',
      'Confirm Git can inspect the active project and run the check again.',
    );
  }

  const oversized = [];
  const allowlisted = [];
  for (const relativePath of files) {
    if (allowlist.has(relativePath)) {
      allowlisted.push(relativePath);
      continue;
    }

    try {
      const contents = readSourceFile(root, relativePath);
      if (contents.includes(0)) {
        continue;
      }

      const lines = lineCount(contents);
      if (lines > configured.limit) {
        oversized.push(`${relativePath} (${lines} lines)`);
      }
    } catch {
      return result(
        'BLOCKED',
        `A ${scope.toLowerCase()} source file could not be inspected.`,
        `Cannot read ${relativePath}.`,
        'Restore the file or its permissions, then run the check again.',
      );
    }
  }

  const allowanceEvidence = allowlisted.length
    ? ` Explicitly allowlisted: ${allowlisted.join(', ')}.`
    : '';
  if (oversized.length > 0) {
    return result(
      'FAIL',
      `${oversized.length} ${scope.toLowerCase()} source file(s) exceed the ${configured.limit}-line limit.`,
      `${oversized.join('; ')}.${allowanceEvidence}`,
      'Split oversized files by cohesive responsibility or document a deliberate exception in MARLENS_SOURCE_SIZE_ALLOWLIST, then run the check again.',
    );
  }

  return result(
    'PASS',
    `${scope} source files stay within the ${configured.limit}-line limit.`,
    `Inspected ${files.length} ${scope.toLowerCase()} source file(s).${allowanceEvidence}`,
    'No follow-up check is required.',
  );
}

function trackedSourceContents(repositoryRoot, relativePath) {
  const filePath = path.join(repositoryRoot, relativePath);
  const fileStats = lstatSync(filePath);
  if (!fileStats.isFile() || fileStats.isSymbolicLink()) {
    throw new Error('Tracked source path is not a regular file.');
  }

  return readFileSync(filePath);
}

function stagedSourceContents(repositoryRoot, relativePath) {
  return execFileSync('git', ['show', `:${relativePath}`], {
    cwd: repositoryRoot,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

export function runVerification(projectDirectory = process.cwd(), environment = process.env) {
  return runSourceVerification(projectDirectory, environment, trackedSourceFiles, trackedSourceContents, 'Tracked');
}

export function runStagedVerification(projectDirectory = process.cwd(), environment = process.env) {
  return runSourceVerification(projectDirectory, environment, stagedSourceFiles, stagedSourceContents, 'Staged');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`);
}
