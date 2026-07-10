import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  addCandidate,
  addFeedback,
  boundedFeedbackSummary,
  classifierPrompt,
  discardCandidate,
  editCandidate,
  learnerStorePath,
  promoteCandidate,
  readStore,
  redactText,
  registerLearnerCommand,
  writeStore,
} from '../omp-plugin/learner.mjs';

assert.equal(redactText('email me at user@example.com with ghp_abcdefghijklmnopqrstuvwxyz'), 'email me at [redacted-email] with [redacted-token]');
const token = 'ghp_abcdefghijklmnopqrstuvwxyz';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'learner-check-'));
try {
  const storePath = learnerStorePath({ OMP_LEARNER_DIR: tmp }, '/ignored');
  let store = readStore(storePath);

  const missingCommitContext = addCandidate(store, {
    category: 'commit_file_grouping',
    proposedRule: 'Split docs and tests.',
    evidence: 'no diff or staged files were visible',
    provenance: { kind: '', reference: '' },
  });
  assert.equal(missingCommitContext.category, 'insufficient_context');

  const longText = Array(120).fill('longword').join(' ');
  const grouped = addCandidate(store, {
    category: 'commit_file_grouping',
    proposedRule: `Split lockfile churn from behavior changes. ${token} ${longText}`,
    scope: `cross-project commits ${token}`,
    provenance: { kind: 'diff', reference: 'git diff --cached --stat' },
    confidence: 'high',
  });
  assert.equal(grouped.proposedRule.length, 500);
  assert.ok(!grouped.proposedRule.includes(token));
  assert.ok(!grouped.scope.includes(token));
  assert.equal(grouped.category, 'commit_file_grouping');

  const edited = editCandidate(store, grouped.id, { proposedRule: 'Split dependency churn from behavior changes.' });
  assert.equal(edited.status, 'edited');
  assert.equal(store.edits.length, 1);

  const accepted = promoteCandidate(store, edited.id, 'good cross-project commit grouping rule');
  assert.equal(accepted.status, 'accepted');
  assert.equal(store.pending.length, 1);

  const noisy = addCandidate(store, { category: 'one_off_no_action', proposedRule: 'Say tiny here.' });
  discardCandidate(store, noisy.id, 'noisy', 'local wording nit');
  addFeedback(store, accepted.id, 'useful', 'helped future commit grouping');

  const summary = boundedFeedbackSummary(store, 5);
  assert.match(summary, /Recent accepted examples:/);
  assert.match(summary, /Recent rejected\/noisy examples:/);
  assert.match(summary, /Recent edited examples:/);
  assert.match(summary, /Recent user feedback on learner quality:/);
  assert.ok(!summary.includes(token));
  assert.ok(summary.length < 1200);

  const prompt = classifierPrompt('Please keep lockfile churn separate.', store);
  assert.match(prompt, /docs\/workflows\/learner-feedback-workflow\.md/);
  assert.match(prompt, /provenance\.kind as diff, staged_files, commit_hash, or local_committing_doc/);
  assert.match(prompt, /Stored learner history is intentionally not injected/);
  assert.doesNotMatch(prompt, /Recent accepted examples:/);
  assert.doesNotMatch(prompt, /Split dependency churn/);

  writeStore(store, storePath);
  assert.equal(statSync(storePath).mode & 0o777, 0o600);
  const reread = readStore(storePath);
  assert.equal(reread.decisions.length, 2);
  assert.equal(reread.edits.length, 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const commandTmp = mkdtempSync(path.join(os.tmpdir(), 'learner-command-check-'));
try {
  const commands = new Map();
  const messages = [];
  const pi = {
    pi: { getAgentDir: () => commandTmp },
    registerCommand(name, options) {
      commands.set(name, options);
    },
    sendMessage(message, options) {
      messages.push({ message, options });
    },
  };

  registerLearnerCommand(pi);
  const learner = commands.get('learner');
  assert.ok(learner, 'learner command must register');

  await learner.handler('review');
  assert.equal(messages.at(-1).message.content, 'No pending learner candidates.');

  const candidateJson = JSON.stringify({
    category: 'test_style',
    proposedRule: `Assert explicit expected values. ${token}`,
    scope: 'cross-project tests',
    provenance: { kind: 'local_committing_doc', reference: 'COMMITTING.md' },
    confidence: 'high',
  });
  await learner.handler(`add ${candidateJson}`);
  assert.match(messages.at(-1).message.content, /Stored pending learner candidate lf-1/);
  assert.ok(existsSync(path.join(commandTmp, 'learner', 'feedback-store.json')));
  assert.ok(!readFileSync(path.join(commandTmp, 'learner', 'feedback-store.json'), 'utf8').includes(token));

  await learner.handler('review');
  assert.match(messages.at(-1).message.content, /### lf-1 — test_style/);
  assert.doesNotMatch(messages.at(-1).message.content, new RegExp(token));

  await learner.handler('classify Keep tests direct.');
  assert.equal(messages.at(-1).message.customType, 'learner-classify');
  assert.equal(messages.at(-1).options.triggerTurn, true);

  await learner.handler('promote lf-1 useful');
  assert.equal(messages.at(-1).message.customType, 'learner-promote');
  assert.equal(messages.at(-1).options.triggerTurn, true);
  assert.match(messages.at(-1).message.content, /Review learner candidate lf-1/);
} finally {
  rmSync(commandTmp, { recursive: true, force: true });
}

const evalSet = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile('docs/evals/learner-feedback.json', 'utf8')));
const ids = new Set(evalSet.cases.map((item) => item.id));
for (const required of [
  'accepted-commit-message-style',
  'accepted-test-style',
  'rejected-noisy-local-nit',
  'wrong-scope-project-style',
  'wrong-destination-workflow',
  'verifier-overlap',
  'insufficient-context-commit-grouping-negative',
  'accepted-commit-grouping-with-diff',
]) {
  assert.ok(ids.has(required), `missing eval case ${required}`);
}

const verifierOverlap = evalSet.cases.find((item) => item.id === 'verifier-overlap');
assert.equal(verifierOverlap.expectedCategory, 'one_off_no_action');
assert.equal(verifierOverlap.expectedAction, 'no_candidate');

const negativeCommitGrouping = evalSet.cases.find((item) => item.id === 'insufficient-context-commit-grouping-negative');
assert.equal(negativeCommitGrouping.expectedCategory, 'insufficient_context');

console.log('learner checks passed');
