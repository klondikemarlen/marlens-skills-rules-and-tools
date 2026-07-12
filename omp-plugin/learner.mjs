import { CATEGORIES, NON_RECORDING_CATEGORIES, RECORD_TOOL_NAME } from './learner/constants.mjs';
import { addCandidate, normalizeCategory } from './learner/candidates.mjs';
import { learnerStorePath, readStore, setLearnerEnabled, writeStore } from './learner/store.mjs';
import { automaticSystemPrompt, isLearnerWorkflowPrompt } from './learner/prompts.mjs';

export {
  addCandidate,
  addFeedback,
  boundedFeedbackSummary,
  discardCandidate,
  editCandidate,
  formatReview,
  normalizeCategory,
  promoteCandidate,
  redactText,
} from './learner/candidates.mjs';
export { learnerStorePath, readStore, setLearnerEnabled, writeStore } from './learner/store.mjs';
export { automaticSystemPrompt, classifierPrompt, isLearnerWorkflowPrompt } from './learner/prompts.mjs';

const LEARNER_COMMANDS = ['on', 'off', 'status'];

function storePathFor(pi, ctx) {
  return learnerStorePath(process.env, ctx?.agentDir || pi.pi?.getAgentDir?.());
}

function sendDisplay(pi, content) {
  pi.sendMessage({ customType: 'learner', content, display: true, attribution: 'system' }, { deliverAs: 'followUp' });
}

function helpText() {
  return `Learner commands:\n/learner on\n/learner off\n/learner status`;
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
  const matches = LEARNER_COMMANDS
    .filter((command) => command.startsWith(lower))
    .map((command) => ({ value: `${command} `, label: command }));

  return matches.length ? matches : null;
}

async function setLearnerToolActive(pi, enabled) {
  if (!pi.getActiveTools || !pi.setActiveTools) return;

  const active = new Set(pi.getActiveTools());
  if (enabled) active.add(RECORD_TOOL_NAME);
  else active.delete(RECORD_TOOL_NAME);
  await pi.setActiveTools([...active]);
}

function learnerToolSchema(z) {
  if (!z) return {};

  return z.object({
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
  });
}

function skippedCandidateResult(category) {
  return {
    content: [{ type: 'text', text: `No learner candidate recorded for ${category}.` }],
    details: { recorded: false, category },
  };
}

function candidateParams(params) {
  return {
    ...params,
    evidence: params.evidence || params.promptExcerpt || params.proposedRule,
    provenance: params.provenance || { kind: 'observed_user_feedback', reference: 'enabled learner observation' },
  };
}

async function executeRecordCandidate(pi, params, ctx) {
  const category = normalizeCategory(params.category);
  if (NON_RECORDING_CATEGORIES.has(category)) return skippedCandidateResult(category);

  const filePath = storePathFor(pi, ctx);
  const store = readStore(filePath);
  const candidate = addCandidate(store, candidateParams(params));
  writeStore(store, filePath);

  return {
    content: [{ type: 'text', text: `Stored pending learner candidate ${candidate.id} for human review.` }],
    details: { id: candidate.id, category: candidate.category },
  };
}

function registerLearnerTool(pi) {
  pi.registerTool?.({
    name: RECORD_TOOL_NAME,
    label: 'Record Learner Candidate',
    description: 'Record one human-reviewed learner candidate from enabled automatic feedback triage. Use only for high-confidence durable guidance; never for verifier evidence review or one-off wording nits.',
    defaultInactive: true,
    approval: 'write',
    parameters: learnerToolSchema(pi.zod?.z),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      return executeRecordCandidate(pi, params, ctx);
    },
  });
}

function registerSessionStart(pi) {
  pi.on?.('session_start', async (_event, ctx) => {
    const store = readStore(storePathFor(pi, ctx));
    if (!store.settings?.enabled) return;

    await setLearnerToolActive(pi, true);
    ctx?.ui?.notify?.('Learner automatic triage enabled', 'info');
  });
}

function registerBeforeAgentStart(pi) {
  pi.on?.('before_agent_start', async (event, ctx) => {
    const store = readStore(storePathFor(pi, ctx));
    if (!store.settings?.enabled) return {};

    if (isLearnerWorkflowPrompt(event.prompt)) {
      await setLearnerToolActive(pi, false);
      return {};
    }

    await setLearnerToolActive(pi, true);
    return { systemPromptAppend: automaticSystemPrompt() };
  });
}

async function turnLearnerOn(pi, filePath, store) {
  setLearnerEnabled(store, true);
  writeStore(store, filePath);
  await setLearnerToolActive(pi, true);
  return 'Learner automatic triage enabled. New feedback-like user messages will be classified automatically.';
}

async function turnLearnerOff(pi, filePath, store) {
  setLearnerEnabled(store, false);
  writeStore(store, filePath);
  await setLearnerToolActive(pi, false);
  return 'Learner automatic triage disabled.';
}

function learnerCommandHandlers(pi, filePath, store) {
  return {
    status: () => statusText(store, filePath, pi),
    on: () => turnLearnerOn(pi, filePath, store),
    off: () => turnLearnerOff(pi, filePath, store),
  };
}

async function handleLearnerCommand(pi, args, ctx) {
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  const command = tokens[0] || 'status';
  const filePath = storePathFor(pi, ctx);
  const store = readStore(filePath);

  try {
    if (tokens.length > 1) return sendDisplay(pi, `Usage: /learner ${command}\n\n${helpText()}`);

    const handler = learnerCommandHandlers(pi, filePath, store)[command];
    if (!handler) return sendDisplay(pi, `Unknown learner command: ${command}\n\n${helpText()}`);

    return sendDisplay(pi, await handler());
  } catch (error) {
    return sendDisplay(pi, `Learner error: ${error.message}`);
  }
}

function registerLearnerSurface(pi) {
  pi.registerCommand('learner', {
    description: 'Toggle automatic learner triage.',
    getArgumentCompletions: completeLearner,
    handler: async (args, ctx) => handleLearnerCommand(pi, args, ctx),
  });
}

export function registerLearnerCommand(pi) {
  registerLearnerTool(pi);
  registerSessionStart(pi);
  registerBeforeAgentStart(pi);
  registerLearnerSurface(pi);
}
