#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { checkCommitScope, formatCommitScopeFailures } from '../lib/commit-scope-check.mjs';

function stagedPaths() {
  return execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

const paths = stagedPaths();
const { boundaries } = checkCommitScope(paths);

if (boundaries.length === 0) {
  console.log('Staged files satisfy commit file-type boundaries.');
} else if (process.argv.includes('--allow-mixed')) {
  console.warn(`${formatCommitScopeFailures(boundaries)}\nOverride accepted.`);
} else {
  console.error(formatCommitScopeFailures(boundaries));
  process.exitCode = 1;
}
