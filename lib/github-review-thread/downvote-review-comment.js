import { applyReaction } from './apply-reaction.js';

export function downvoteReviewComment(repository, commentId, authToken, callRest) {
  return applyReaction(repository, commentId, '-1', authToken, callRest);
}
