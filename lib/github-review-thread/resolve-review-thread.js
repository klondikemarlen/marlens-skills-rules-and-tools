import { applyReaction } from './apply-reaction.js';
import { findThreadByCommentId } from './find-thread-by-comment-id.js';
import { graphqlResolveMutation } from './graphql-resolve-mutation.js';
import { verifyThreadCompletion } from './verify-thread-completion.js';

export async function resolveReviewThread(repository, pullRequest, commentId, reaction, authToken, callRest, callGraphql) {
  const mapped = await findThreadByCommentId(repository, pullRequest, commentId, authToken, callGraphql);
  if (!mapped) {
    throw new Error(`No review-thread mapping found for comment ${commentId} in ${repository}#${pullRequest}.`);
  }

  const { viewerId, created } = await applyReaction(repository, commentId, reaction, authToken, callRest);
  if (!mapped.isResolved) {
    await callGraphql(graphqlResolveMutation(), { threadId: mapped.threadId }, authToken);
  }

  const verification = await verifyThreadCompletion(
    repository,
    commentId,
    reaction,
    viewerId,
    mapped.threadId,
    authToken,
    callRest,
    callGraphql,
  );
  if (!verification.reaction || !verification.resolved) {
    throw new Error(`Completion verification failed for comment ${commentId}: reaction=${verification.reaction}, resolved=${verification.resolved}.`);
  }

  return {
    threadId: mapped.threadId,
    reactionCreated: created,
    verified: true,
  };
}
