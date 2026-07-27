import { applyReaction } from './apply-reaction.js';

export function upvoteReviewComment(repository, commentId, authToken, callRest) {
  return applyReaction(repository, commentId, '+1', authToken, callRest);
}
