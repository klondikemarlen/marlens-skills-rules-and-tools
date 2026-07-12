import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { STORE_VERSION } from './constants.mjs';

export function learnerStorePath(env = process.env, agentDir) {
  const baseDir = env.OMP_LEARNER_DIR || agentDir || path.join(env.HOME || os.homedir(), '.omp', 'agent');
  return path.join(baseDir, 'learner', 'feedback-store.json');
}

function emptyStore() {
  return { version: STORE_VERSION, nextId: 1, settings: { enabled: false }, pending: [], decisions: [], edits: [], feedback: [] };
}

export function readStore(filePath = learnerStorePath()) {
  if (!existsSync(filePath)) return emptyStore();

  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  const defaults = emptyStore();
  return {
    ...defaults,
    ...parsed,
    settings: { ...defaults.settings, ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}) },
    pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    edits: Array.isArray(parsed.edits) ? parsed.edits : [],
    feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
  };
}

export function writeStore(store, filePath = learnerStorePath()) {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
  renameSync(tempPath, filePath);
}

export function setLearnerEnabled(store, enabled) {
  store.settings = { ...(store.settings || {}), enabled: Boolean(enabled), updatedAt: new Date().toISOString() };
  return store.settings;
}
