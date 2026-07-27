import { currentViewerHasReaction } from './current-viewer-has-reaction.js';
import { verifyThreadResolved } from './verify-thread-resolved.js';

export async function verifyThreadCompletion(repository, commentId, reaction, viewerId, threadId, authToken, callRest, callGraphql) {
  const [hasReaction, isResolved] = await Promise.all([
    currentViewerHasReaction(repository, commentId, reaction, viewerId, authToken, callRest),
    verifyThreadResolved(threadId, authToken, callGraphql),
  ]);
  return { reaction: hasReaction, resolved: isResolved };
}
