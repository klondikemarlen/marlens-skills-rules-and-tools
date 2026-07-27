import assert from 'node:assert/strict';
import test from 'node:test';

import { graphqlResolveMutation } from '../../lib/github-review-thread/graphql-resolve-mutation.js';
import { graphqlThreadLocatorQuery } from '../../lib/github-review-thread/graphql-thread-locator-query.js';
import { graphqlThreadVerifyQuery } from '../../lib/github-review-thread/graphql-thread-verify-query.js';
import { resolveReviewThread } from '../../lib/github-review-thread/resolve-review-thread.js';
import { reviewCommentReactionEndpoint } from '../../lib/github-review-thread/review-comment-reaction-endpoint.js';

await test('creates the expected reaction before resolving and verifies both states', async () => {
  const restCalls = [];
  const graphCalls = [];
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: '-1' },
    [{ content: '-1', user: { id: 42 } }],
    [{ content: '-1', user: { id: 42 } }],
  ];
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [{
                id: 'thread-1',
                isResolved: false,
                comments: { nodes: [{ databaseId: 123 }] },
              }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    },
    { data: { resolveReviewThread: { thread: { id: 'thread-1', isResolved: true } } } },
    { data: { node: { isResolved: true } } },
  ];
  const callRest = async (method, endpoint, payload) => {
    restCalls.push({ method, endpoint, payload });
    return restResponses.shift();
  };
  const callGraphql = async (query, variables) => {
    graphCalls.push({ query, variables });
    return graphResponses.shift();
  };

  const result = await resolveReviewThread('owner/repo', 456, 123, '-1', 'token', callRest, callGraphql);

  assert.deepEqual({
    result,
    restCalls: restCalls.map(({ method, endpoint, payload }) => ({ method, endpoint, payload })),
    graphCalls: graphCalls.map(({ query, variables }) => ({ query, variables })),
  }, {
    result: { threadId: 'thread-1', reactionCreated: true, verified: true },
    restCalls: [
      { method: 'GET', endpoint: 'user', payload: undefined },
      { method: 'GET', endpoint: `${reviewCommentReactionEndpoint('owner/repo', 123)}?per_page=100&page=1`, payload: undefined },
      { method: 'POST', endpoint: reviewCommentReactionEndpoint('owner/repo', 123), payload: { content: '-1' } },
      { method: 'GET', endpoint: `${reviewCommentReactionEndpoint('owner/repo', 123)}?per_page=100&page=1`, payload: undefined },
      { method: 'GET', endpoint: `${reviewCommentReactionEndpoint('owner/repo', 123)}?per_page=100&page=1`, payload: undefined },
    ],
    graphCalls: [
      { query: graphqlThreadLocatorQuery(), variables: { owner: 'owner', name: 'repo', pullNumber: 456, after: undefined } },
      { query: graphqlResolveMutation(), variables: { threadId: 'thread-1' } },
      { query: graphqlThreadVerifyQuery(), variables: { threadId: 'thread-1' } },
    ],
  });
});

await test('repairs a missing reaction on an already-resolved thread without resolving twice', async () => {
  const restCalls = [];
  const graphCalls = [];
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: '+1' },
    [{ content: '+1', user: { id: 42 } }],
    [{ content: '+1', user: { id: 42 } }],
  ];
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [{
                id: 'thread-resolved',
                isResolved: true,
                comments: { nodes: [{ databaseId: 123 }] },
              }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    },
    { data: { node: { isResolved: true } } },
  ];
  const callRest = async (method, endpoint, payload) => {
    restCalls.push({ method, endpoint, payload });
    return restResponses.shift();
  };
  const callGraphql = async (query, variables) => {
    graphCalls.push({ query, variables });
    return graphResponses.shift();
  };

  const result = await resolveReviewThread('owner/repo', 456, 123, '+1', 'token', callRest, callGraphql);

  assert.deepEqual({ result, graphQueries: graphCalls.map(({ query }) => query), reactionWrite: restCalls[2] }, {
    result: { threadId: 'thread-resolved', reactionCreated: true, verified: true },
    graphQueries: [graphqlThreadLocatorQuery(), graphqlThreadVerifyQuery()],
    reactionWrite: { method: 'POST', endpoint: reviewCommentReactionEndpoint('owner/repo', 123), payload: { content: '+1' } },
  });
});

await test('rejects completion when the final reaction check is missing', async () => {
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: '+1' },
    [{ content: '+1', user: { id: 42 } }],
    [],
  ];
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [{ id: 'thread-1', isResolved: false, comments: { nodes: [{ databaseId: 123 }] } }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    },
    { data: { resolveReviewThread: { thread: { id: 'thread-1', isResolved: true } } } },
    { data: { node: { isResolved: true } } },
  ];
  const callRest = async () => restResponses.shift();
  const callGraphql = async () => graphResponses.shift();

  await assert.rejects(
    resolveReviewThread('owner/repo', 456, 123, '+1', 'token', callRest, callGraphql),
    /Completion verification failed/u,
  );
});
