import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN_PATH = '.envrc.example';

function result(status, summary, evidence, nextCheck) {
  return { status, summary, evidence, nextCheck };
}

export function runVerification(projectDirectory = process.cwd()) {
  let repositoryRoot;
  try {
    if (!statSync(projectDirectory).isDirectory()) {
      return result(
        'BLOCKED',
        'The active project directory is unavailable.',
        `Cannot inspect ${projectDirectory}.`,
        'Run the check from an accessible project directory.',
      );
    }

    repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: projectDirectory,
      encoding: 'utf8',
    }).trim();
  } catch {
    return result(
      'BLOCKED',
      'Git metadata is unavailable for the active project.',
      `Cannot determine whether ${FORBIDDEN_PATH} is tracked.`,
      'Run the check from a Git project.',
    );
  }

  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', FORBIDDEN_PATH], {
      cwd: repositoryRoot,
      stdio: 'ignore',
    });
  } catch (error) {
    if (error.status === 1) {
      return result(
        'PASS',
        `The project does not track ${FORBIDDEN_PATH}.`,
        `Git found no tracked ${FORBIDDEN_PATH} file.`,
        'No follow-up check is required.',
      );
    }

    return result(
      'BLOCKED',
      `Unable to inspect tracked ${FORBIDDEN_PATH}.`,
      'Git returned an unexpected error while checking the fixed path.',
      'Confirm Git can inspect the active project and run the check again.',
    );
  }

  return result(
    'FAIL',
    `The project tracks ${FORBIDDEN_PATH}.`,
    `Remove ${FORBIDDEN_PATH} from version control and keep environment setup local.`,
    'Remove the tracked file, then run the check again.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runVerification())}\n`);
}
