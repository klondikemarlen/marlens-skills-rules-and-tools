import { parseReplyBody } from './parse-reply-body.js';
import { reviewCommentReplyEndpoint } from './review-comment-reply-endpoint.js';

export async function replyReviewComment(repository, pullRequest, commentId, options, authToken, callRest) {
  const body = await parseReplyBody(options);
  await callRest(
    'POST',
    reviewCommentReplyEndpoint(repository, pullRequest, commentId),
    { body },
    authToken,
  );
}
