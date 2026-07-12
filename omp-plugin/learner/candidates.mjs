import {
  CATEGORIES,
  COMMIT_CONTEXT_KINDS,
  FEEDBACK_LABELS,
  MAX_EXCERPT,
  SUMMARY_LIMIT,
} from './constants.mjs';

export function redactText(value) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:ghp|github_pat|sk|xox[baprs])[-_][-A-Za-z0-9_]{12,}\b/g, '[redacted-token]')
    .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, '[redacted-secret]')
    .slice(0, MAX_EXCERPT);
}

export function normalizeCategory(category) {
  return CATEGORIES.has(category) ? category : 'ambiguous_needs_review';
}

function fieldText(value) {
  return redactText(String(value || '').trim());
}

function normalizeProvenance(candidate) {
  const raw = candidate.provenance && typeof candidate.provenance === 'object' ? candidate.provenance : {};
  const kind = String(raw.kind || '').trim();
  const reference = redactText(raw.reference || raw.path || raw.commit || '');
  const promptExcerpt = redactText(candidate.evidence || candidate.promptExcerpt || '');

  return { kind, reference, promptExcerpt };
}

function hasVisibleCommitContext(provenance) {
  return COMMIT_CONTEXT_KINDS.has(provenance.kind) && provenance.reference.length > 0;
}

function normalizeCandidate(candidate) {
  const provenance = normalizeProvenance(candidate);
  const normalized = {
    category: normalizeCategory(candidate.category),
    proposedRule: fieldText(candidate.proposedRule || candidate.rule),
    scope: fieldText(candidate.scope),
    rationale: fieldText(candidate.rationale),
    suggestedDestination: fieldText(candidate.suggestedDestination),
    provenance,
    evidence: provenance.promptExcerpt,
    confidence: fieldText(candidate.confidence),
    whenNotToApply: fieldText(candidate.whenNotToApply),
    relationshipToExistingGuidance: fieldText(candidate.relationshipToExistingGuidance),
  };

  if (normalized.category === 'commit_file_grouping' && !hasVisibleCommitContext(provenance)) {
    normalized.category = 'insufficient_context';
    normalized.rationale = fieldText([
      normalized.rationale,
      'Commit file grouping needs structured provenance.kind of diff, staged_files, commit_hash, or local_committing_doc plus a reference.',
    ].filter(Boolean).join(' '));
  }

  return normalized;
}

function timestamp() {
  return new Date().toISOString();
}

export function addCandidate(store, candidate) {
  const id = `lf-${store.nextId}`;
  const now = timestamp();
  const record = {
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ...normalizeCandidate(candidate),
  };

  store.nextId += 1;
  store.pending.push(record);
  return record;
}

export function editCandidate(store, id, patch) {
  const record = store.pending.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Unknown pending candidate: ${id}`);

  const before = { ...record };
  Object.assign(record, normalizeCandidate({ ...record, ...patch }), { updatedAt: timestamp(), status: 'edited' });
  store.edits.push({ id, editedAt: record.updatedAt, before, after: { ...record } });
  return record;
}

export function promoteCandidate(store, id, rationale = '') {
  const index = store.pending.findIndex((candidate) => candidate.id === id);
  if (index === -1) throw new Error(`Unknown pending candidate: ${id}`);

  const [candidate] = store.pending.splice(index, 1);
  const decision = { ...candidate, status: 'accepted', decidedAt: timestamp(), userRationale: redactText(rationale) };
  store.decisions.push(decision);
  return decision;
}

export function discardCandidate(store, id, label = 'noisy', rationale = '') {
  const index = store.pending.findIndex((candidate) => candidate.id === id);
  if (index === -1) throw new Error(`Unknown pending candidate: ${id}`);

  const [candidate] = store.pending.splice(index, 1);
  const decision = {
    ...candidate,
    status: 'rejected',
    feedbackLabel: FEEDBACK_LABELS.has(label) ? label : 'noisy',
    decidedAt: timestamp(),
    userRationale: redactText(rationale),
  };
  store.decisions.push(decision);
  return decision;
}

export function addFeedback(store, id, label, rationale = '') {
  if (!FEEDBACK_LABELS.has(label)) throw new Error(`Feedback label must be one of: ${[...FEEDBACK_LABELS].join(', ')}`);

  const record = { id, label, rationale: redactText(rationale), createdAt: timestamp() };
  store.feedback.push(record);
  return record;
}

export function boundedFeedbackSummary(store, limit = SUMMARY_LIMIT) {
  const accepted = store.decisions.filter((item) => item.status === 'accepted').slice(-limit);
  const rejected = store.decisions.filter((item) => item.status === 'rejected').slice(-limit);
  const edits = store.edits.slice(-limit);
  const feedback = store.feedback.slice(-limit);

  return [
    'Recent accepted examples:',
    ...accepted.map((item) => `- ${item.category}: ${item.proposedRule} (${item.scope})`),
    'Recent rejected/noisy examples:',
    ...rejected.map((item) => `- ${item.category}: ${item.feedbackLabel || 'rejected'} — ${item.proposedRule}`),
    'Recent edited examples:',
    ...edits.map((item) => `- ${item.after.category}: ${item.after.proposedRule}`),
    'Recent user feedback on learner quality:',
    ...feedback.map((item) => `- ${item.label}: ${item.rationale}`),
  ].join('\n');
}

export function formatReview(store) {
  if (store.pending.length === 0) return 'No pending learner candidates.';

  return store.pending.map((candidate) => [
    `### ${candidate.id} — ${candidate.category}`,
    `Rule: ${candidate.proposedRule || '(none)'}`,
    `Scope: ${candidate.scope || '(unspecified)'}`,
    `Destination: ${candidate.suggestedDestination || '(unspecified)'}`,
    `Confidence: ${candidate.confidence || '(unspecified)'}`,
    `Provenance: ${candidate.provenance?.kind || '(none)'} ${candidate.provenance?.reference || ''}`.trim(),
  ].join('\n')).join('\n\n');
}
