import { reviewCommentReactionEndpoint } from './review-comment-reaction-endpoint.js';
import { reviewCommentReplyEndpoint } from './review-comment-reply-endpoint.js';
import { parseReplyBody } from './parse-reply-body.js';

export async function buildPlan(action, repository, commentId, options, owner, name) {
  const plan = [];
  const reaction = action === 'upvote' ? '+1' : '-1';

  if (action === 'upvote' || action === 'downvote') {
    plan.push(
      { method: 'GET', endpoint: 'user', note: 'identify the authenticated user' },
      {
        method: 'GET',
        endpoint: `${reviewCommentReactionEndpoint(repository, commentId)}?per_page=100&page=<n>`,
        note: 'skip POST when the authenticated user already has the expected reaction',
      },
      {
        method: 'POST',
        endpoint: reviewCommentReactionEndpoint(repository, commentId),
        body: { content: reaction },
        note: 'only when the authenticated user lacks the expected reaction',
      },
      {
        method: 'GET',
        endpoint: `${reviewCommentReactionEndpoint(repository, commentId)}?per_page=100&page=<n>`,
        note: 'verify the authenticated user has the expected reaction',
      },
    );
  }

  if (action === 'reply') {
    const body = await parseReplyBody(options);
    plan.push({
      method: 'POST',
      endpoint: reviewCommentReplyEndpoint(repository, options.pr, commentId),
      body: { body },
      note: 'reply endpoint uses review-comment databaseId directly',
    });
  }

  if (action === 'resolve') {
    plan.push(
      {
        method: 'POST',
        endpoint: '/graphql',
        query: 'LocateReviewThread',
        variables: { owner, name, pullNumber: options.pr },
        note: 'map review comment databaseId -> review thread id',
      },
      { method: 'GET', endpoint: 'user', note: 'identify the authenticated user' },
      {
        method: 'GET',
        endpoint: `${reviewCommentReactionEndpoint(repository, commentId)}?per_page=100&page=<n>`,
        note: 'skip POST when the authenticated user already has the expected reaction',
      },
      {
        method: 'POST',
        endpoint: reviewCommentReactionEndpoint(repository, commentId),
        body: { content: options.reaction },
        note: 'only when the expected reaction is absent',
      },
      {
        method: 'GET',
        endpoint: `${reviewCommentReactionEndpoint(repository, commentId)}?per_page=100&page=<n>`,
        note: 'verify the expected reaction before resolving',
      },
      {
        method: 'POST',
        endpoint: '/graphql',
        query: 'ResolveReviewThread',
        variables: { threadId: '<thread-id>' },
        note: 'only when the mapped review thread is unresolved',
      },
      {
        method: 'GET',
        endpoint: `${reviewCommentReactionEndpoint(repository, commentId)}?per_page=100&page=<n>`,
        note: 'final reaction check paired with the resolved-thread check',
      },
      {
        method: 'POST',
        endpoint: '/graphql',
        query: 'CheckReviewThreadResolved',
        variables: { threadId: '<thread-id>' },
        note: 'final resolution check paired with the final reaction check',
      },
    );
  }

  return plan;
}
