import { RECORD_TOOL_NAME } from './constants.mjs';
import { redactText } from './candidates.mjs';

export function classifierPrompt(feedback, _store) {
  return `Use docs/workflows/learner-feedback-workflow.md to classify this user feedback.\n\nFeedback:\n${redactText(feedback)}\n\nStored learner history is intentionally not injected into classification yet; keep pending candidates human-reviewed and keep adaptive summaries disabled until an executable eval proves they reduce noise without increasing verifier overlap.\n\nReturn one candidate JSON object only if it is high-confidence and durable. Use category ambiguous_needs_review for uncertain feedback, insufficient_context for commit grouping without structured visible provenance, and one_off_no_action for local nits. For commit_file_grouping, include provenance.kind as diff, staged_files, commit_hash, or local_committing_doc and provenance.reference naming the visible source. Do not persist, file issues, commit, push, edit files, or ask the user to run hidden learner subcommands.`;
}

export function automaticSystemPrompt() {
  return `Learner automatic triage is enabled. For the current user prompt only, decide whether it contains explicit durable feedback about code style, test style, commit message style, commit file grouping, or reusable workflow/tooling guidance. If it does, call ${RECORD_TOOL_NAME} exactly once with a pending learner candidate. Do not call the tool for one-off wording nits, verifier evidence/PASS/FAIL/BLOCKED feedback, ordinary task instructions, or uncertain feedback. For commit_file_grouping, only use that category when provenance.kind is diff, staged_files, commit_hash, or local_committing_doc and provenance.reference names the visible source; otherwise use insufficient_context or do not record. Stored learner history is not part of this classification.`;
}

export function isLearnerWorkflowPrompt(promptText) {
  const text = String(promptText || '');
  return text.startsWith('Use docs/workflows/learner-feedback-workflow.md')
    || text.startsWith('Review learner candidate ')
    || text.includes('through docs/workflows/learn-workflow.md before persisting it');
}
