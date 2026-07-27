import { REVIEW_COMMENT_REACTION_REPLIES } from './review-comment-reaction-replies.js';

export function parseReaction(options) {
  if (!REVIEW_COMMENT_REACTION_REPLIES.includes(options.reaction)) {
    throw new Error('resolve requires --reaction +1 or --reaction -1.');
  }
  return options.reaction;
}
