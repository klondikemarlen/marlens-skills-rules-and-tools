import assert from 'node:assert/strict';
import test from 'node:test';

import { GitHubReviewIntegration } from '../../lib/github-review-thread/github-review-integration.js';
import { graphqlThreadCommentsPageQuery } from '../../lib/github-review-thread/graphql-thread-comments-page-query.js';
import { graphqlThreadLocatorQuery } from '../../lib/github-review-thread/graphql-thread-locator-query.js';
import { reviewCommentReplyEndpoint } from '../../lib/github-review-thread/review-comment-reply-endpoint.js';

await test('posts a plain reply body through the GitHub integration', async () => {
  const calls = [];
  const callRest = async (method, endpoint, payload) => {
    calls.push({ method, endpoint, payload });
    return {};
  };
  const github = new GitHubReviewIntegration('token', { callRest });

  await github.replyReviewComment('owner/repo', 456, 123, 'Addressed in abc123.\n');

  assert.deepEqual(calls, [
    {
      method: 'POST',
      endpoint: reviewCommentReplyEndpoint('owner/repo', 456, 123),
      payload: { body: 'Addressed in abc123.\n' },
    },
  ]);
});

await test('finds a comment on a later page of a review thread', async () => {
  const calls = [];
  const responses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: 'thread-1',
                  isResolved: false,
                  comments: {
                    nodes: [{ databaseId: 1 }],
                    pageInfo: {
                      hasNextPage: true,
                      endCursor: 'comment-cursor-1',
                    },
                  },
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    },
    {
      data: {
        node: {
          comments: {
            nodes: [{ databaseId: 123 }],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    },
  ];
  const callGraphql = async (query, variables) => {
    calls.push({ query, variables });
    return responses.shift();
  };
  const github = new GitHubReviewIntegration('token', { callGraphql });

  const result = await github.findThreadByCommentId('owner/repo', 456, 123);

  assert.deepEqual(
    {
      result,
      calls: calls.map(({ query, variables }) => ({ query, variables })),
    },
    {
      result: { threadId: 'thread-1', isResolved: false },
      calls: [
        {
          query: graphqlThreadLocatorQuery(),
          variables: {
            owner: 'owner',
            name: 'repo',
            pullNumber: 456,
            after: undefined,
          },
        },
        {
          query: graphqlThreadCommentsPageQuery(),
          variables: { threadId: 'thread-1', after: 'comment-cursor-1' },
        },
      ],
    },
  );
});
