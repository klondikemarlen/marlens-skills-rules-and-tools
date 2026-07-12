import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const STORE_VERSION = 1;
const MAX_EXCERPT = 500;
const SUMMARY_LIMIT = 5;
const RECORD_TOOL_NAME = 'learner_record_candidate';
const COMMIT_CONTEXT_KINDS = new Set(['diff', 'staged_files', 'commit_hash', 'local_committing_doc']);
const CATEGORIES = new Set([
  'project_code_style',
  'cross_project_code_style',
  'test_style',
  'commit_file_grouping',
  'commit_message_style',
  'workflow_or_tooling',
  'one_off_no_action',
  'ambiguous_needs_review',
  'insufficient_context',
]);
const FEEDBACK_LABELS = new Set(['useful', 'noisy', 'wrong-scope', 'wrong-destination']);
const NON_RECORDING_CATEGORIES = new Set(['one_off_no_action', 'ambiguous_needs_review', 'insufficient_context']);

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
  return {
    ...emptyStore(),
    ...parsed,
    settings: { ...emptyStore().settings, ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}) },
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

export function redactText(value) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:ghp|github_pat|sk|xox[baprs])[-_][-A-Za-z0-9_]{12,}\b/g, '[redacted-token]')
    .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, '[redacted-secret]')
    .slice(0, MAX_EXCERPT);
}

function fieldText(value) {
  return redactText(String(value || '').trim());
}

function normalizeCategory(category) {
  return CATEGORIES.has(category) ? category : 'ambiguous_needs_review';
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

export function setLearnerEnabled(store, enabled) {
  store.settings = { ...(store.settings || {}), enabled: Boolean(enabled), updatedAt: timestamp() };
  return store.settings;
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

export function classifierPrompt(feedback, _store) {
  return `Use docs/workflows/learner-feedback-workflow.md to classify this user feedback.\n\nFeedback:\n${redactText(feedback)}\n\nStored learner history is intentionally not injected into classification yet; use /learner review for human review and keep adaptive summaries disabled until an executable eval proves they reduce noise without increasing verifier overlap.\n\nReturn one candidate JSON object only if it is high-confidence and durable. Use category ambiguous_needs_review for uncertain feedback, insufficient_context for commit grouping without structured visible provenance, and one_off_no_action for local nits. For commit_file_grouping, include provenance.kind as diff, staged_files, commit_hash, or local_committing_doc and provenance.reference naming the visible source. Do not persist, file issues, commit, push, or edit files. If a candidate should be stored for human review, tell the user to run /learner add with the JSON.`;
}

export function automaticSystemPrompt() {
  return `Learner automatic triage is enabled. For the current user prompt only, decide whether it contains explicit durable feedback about code style, test style, commit message style, commit file grouping, or reusable workflow/tooling guidance. If it does, call ${RECORD_TOOL_NAME} exactly once with a pending learner candidate. Do not call the tool for one-off wording nits, verifier evidence/PASS/FAIL/BLOCKED feedback, ordinary task instructions, or uncertain feedback. For commit_file_grouping, only use that category when provenance.kind is diff, staged_files, commit_hash, or local_committing_doc and provenance.reference names the visible source; otherwise use insufficient_context or do not record. Stored learner history is not part of this classification.`;
}

function parseJsonArgument(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Expected JSON argument: ${error.message}`);
  }
}

function helpText() {
  return `Learner commands:\n/learner on\n/learner off\n/learner status\n/learner classify <feedback>\n/learner add <candidate-json>\n/learner review\n/learner promote <id> [rationale]\n/learner discard <id> [label] [rationale]\n/learner edit <id> <candidate-json>\n/learner feedback <id> <useful|noisy|wrong-scope|wrong-destination> <rationale>`;
}

function statusText(store, filePath, pi) {
  const activeTools = new Set(pi.getActiveTools?.() || []);
  return [
    'Learner status:',
    `automatic triage: ${store.settings?.enabled ? 'on' : 'off'}`,
    `recording tool: ${activeTools.has(RECORD_TOOL_NAME) ? 'active' : 'inactive'}`,
    `pending candidates: ${store.pending.length}`,
    `store: ${filePath}`,
  ].join('\n');
}

function completeLearner(argumentPrefix) {
  if (argumentPrefix.includes(' ')) return null;
  const lower = argumentPrefix.toLowerCase();
  const commands = ['on', 'off', 'status', 'classify', 'add', 'review', 'promote', 'discard', 'edit', 'feedback'];
  const matches = commands.filter((command) => command.startsWith(lower)).map((command) => ({ value: `${command} `, label: command }));
  return matches.length ? matches : null;
}

async function setLearnerToolActive(pi, enabled) {
  if (!pi.getActiveTools || !pi.setActiveTools) return;
  const active = new Set(pi.getActiveTools());
  if (enabled) active.add(RECORD_TOOL_NAME);
  else active.delete(RECORD_TOOL_NAME);
  await pi.setActiveTools([...active]);
}

export function isLearnerWorkflowPrompt(promptText) {
  const text = String(promptText || '');
  return text.startsWith('Use docs/workflows/learner-feedback-workflow.md')
    || text.startsWith('Review learner candidate ')
    || text.includes('through docs/workflows/learn-workflow.md before persisting it');
}


function storePathFor(pi, ctx) {
  return learnerStorePath(process.env, ctx?.agentDir || pi.pi?.getAgentDir?.());
}

function registerLearnerTool(pi) {
  const z = pi.zod?.z;
  pi.registerTool?.({
    name: RECORD_TOOL_NAME,
    label: 'Record Learner Candidate',
    description: 'Record one human-reviewed learner candidate from enabled automatic feedback triage. Use only for high-confidence durable guidance; never for verifier evidence review or one-off wording nits.',
    defaultInactive: true,
    approval: 'write',
    parameters: z?.object({
      category: z.enum([...CATEGORIES]).describe('Learner category'),
      proposedRule: z.string().describe('Durable rule or guidance to remember'),
      scope: z.string().optional().describe('Scope where the guidance applies'),
      rationale: z.string().optional().describe('Why this is durable feedback'),
      suggestedDestination: z.string().optional().describe('Likely memory, workflow, or rule destination'),
      evidence: z.string().optional().describe('Redacted bounded user feedback excerpt'),
      provenance: z.object({
        kind: z.string().describe('diff, staged_files, commit_hash, local_committing_doc, or observed_user_feedback'),
        reference: z.string().describe('Visible source reference'),
      }).optional(),
      confidence: z.string().optional(),
      whenNotToApply: z.string().optional(),
      relationshipToExistingGuidance: z.string().optional(),
    }) || {},
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const category = normalizeCategory(params.category);
      if (NON_RECORDING_CATEGORIES.has(category)) {
        return {
          content: [{ type: 'text', text: `No learner candidate recorded for ${category}.` }],
          details: { recorded: false, category },
        };
      }

      const filePath = storePathFor(pi, ctx);
      const store = readStore(filePath);
      const candidate = addCandidate(store, {
        ...params,
        evidence: params.evidence || params.promptExcerpt || params.proposedRule,
        provenance: params.provenance || { kind: 'observed_user_feedback', reference: 'enabled learner observation' },
      });
      writeStore(store, filePath);
      return {
        content: [{ type: 'text', text: `Stored pending learner candidate ${candidate.id}. Run /learner review or /learner promote ${candidate.id}.` }],
        details: { id: candidate.id, category: candidate.category },
      };
    },
  });
}

export function registerLearnerCommand(pi) {
  registerLearnerTool(pi);

  pi.on?.('session_start', async (_event, ctx) => {
    const filePath = storePathFor(pi, ctx);
    const store = readStore(filePath);
    if (!store.settings?.enabled) return;
    await setLearnerToolActive(pi, true);
    ctx?.ui?.notify?.('Learner automatic triage enabled', 'info');
  });

  pi.on?.('before_agent_start', async (event, ctx) => {
    const filePath = storePathFor(pi, ctx);
    const store = readStore(filePath);
    if (!store.settings?.enabled) return {};
    if (isLearnerWorkflowPrompt(event.prompt)) {
      await setLearnerToolActive(pi, false);
      return {};
    }

    await setLearnerToolActive(pi, true);
    return { systemPromptAppend: automaticSystemPrompt() };
  });

  pi.registerCommand('learner', {
    description: 'Toggle automatic learner triage or review durable style, commit, test, and workflow feedback.',
    getArgumentCompletions: completeLearner,
    handler: async (args, ctx) => {
      const [command = 'help', ...rest] = args.trim().split(/\s+/).filter(Boolean);
      const filePath = storePathFor(pi, ctx);
      const store = readStore(filePath);

      try {
        if (command === 'help') return sendDisplay(pi, helpText());
        if (command === 'on') {
          setLearnerEnabled(store, true);
          writeStore(store, filePath);
          await setLearnerToolActive(pi, true);
          return sendDisplay(pi, 'Learner automatic triage enabled. New feedback-like user messages will be classified automatically.');
        }
        if (command === 'off') {
          setLearnerEnabled(store, false);
          writeStore(store, filePath);
          await setLearnerToolActive(pi, false);
          return sendDisplay(pi, 'Learner automatic triage disabled.');
        }
        if (command === 'status') return sendDisplay(pi, statusText(store, filePath, pi));
        if (command === 'review') return sendDisplay(pi, formatReview(store));
        if (command === 'classify') {
          const feedback = args.trim().slice(command.length).trim();
          if (!feedback) return sendDisplay(pi, 'Usage: /learner classify <feedback>');
          return pi.sendMessage({ customType: 'learner-classify', content: classifierPrompt(feedback, store), display: true, attribution: 'user' }, { deliverAs: 'followUp', triggerTurn: true });
        }
        if (command === 'add') {
          const candidate = addCandidate(store, parseJsonArgument(args.trim().slice(command.length).trim()));
          writeStore(store, filePath);
          return sendDisplay(pi, `Stored pending learner candidate ${candidate.id}. Run /learner review or /learner promote ${candidate.id}.`);
        }
        if (command === 'edit') {
          const id = rest[0];
          const patchText = args.trim().slice(`edit ${id}`.length).trim();
          const candidate = editCandidate(store, id, parseJsonArgument(patchText));
          writeStore(store, filePath);
          return sendDisplay(pi, `Updated learner candidate ${candidate.id}.`);
        }
        if (command === 'promote') {
          const id = rest[0];
          const rationale = args.trim().slice(`promote ${id}`.length).trim();
          const decision = promoteCandidate(store, id, rationale);
          writeStore(store, filePath);
          return pi.sendMessage({ customType: 'learner-promote', content: `Review learner candidate ${decision.id} through docs/workflows/learn-workflow.md before persisting it. Candidate:\n${JSON.stringify(decision, null, 2)}`, display: true, attribution: 'user' }, { deliverAs: 'followUp', triggerTurn: true });
        }
        if (command === 'discard') {
          const id = rest[0];
          const label = rest[1] || 'noisy';
          const rationale = rest.slice(2).join(' ');
          const decision = discardCandidate(store, id, label, rationale);
          writeStore(store, filePath);
          return sendDisplay(pi, `Discarded learner candidate ${decision.id} as ${decision.feedbackLabel}.`);
        }
        if (command === 'feedback') {
          const id = rest[0];
          const label = rest[1];
          const rationale = rest.slice(2).join(' ');
          addFeedback(store, id, label, rationale);
          writeStore(store, filePath);
          return sendDisplay(pi, `Recorded learner feedback for ${id}.`);
        }

        return sendDisplay(pi, helpText());
      } catch (error) {
        return sendDisplay(pi, `Learner error: ${error.message}`);
      }
    },
  });
}

function sendDisplay(pi, content) {
  pi.sendMessage({ customType: 'learner', content, display: true, attribution: 'system' }, { deliverAs: 'followUp' });
}
