import { currentViewerHasReaction } from './current-viewer-has-reaction.js';
import { currentViewerId } from './current-viewer-id.js';
import { reviewCommentReactionEndpoint } from './review-comment-reaction-endpoint.js';

export async function applyReaction(repository, commentId, reaction, authToken, callRest) {
  const viewerId = await currentViewerId(authToken, callRest);
  const alreadyReacted = await currentViewerHasReaction(repository, commentId, reaction, viewerId, authToken, callRest);
  if (!alreadyReacted) {
    await callRest('POST', reviewCommentReactionEndpoint(repository, commentId), { content: reaction }, authToken);
    if (!await currentViewerHasReaction(repository, commentId, reaction, viewerId, authToken, callRest)) {
      throw new Error(`Reaction ${reaction} was not present after the request for comment ${commentId}.`);
    }
  }
  return { viewerId, created: !alreadyReacted };
}
