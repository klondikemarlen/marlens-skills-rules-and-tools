import { reviewCommentReactionEndpoint } from './review-comment-reaction-endpoint.js';

export async function currentViewerHasReaction(repository, reviewCommentId, expectedReaction, viewerId, authToken, callRest) {
  for (let page = 1;; page += 1) {
    const reactions = await callRest(
      'GET',
      `${reviewCommentReactionEndpoint(repository, reviewCommentId)}?per_page=100&page=${page}`,
      undefined,
      authToken,
    );
    if (!Array.isArray(reactions)) {
      throw new Error(`Reaction lookup returned an invalid response for comment ${reviewCommentId}.`);
    }
    if (reactions.some((reaction) => reaction.content === expectedReaction && reaction.user?.id === viewerId)) {
      return true;
    }
    if (reactions.length < 100) return false;
  }
}
