import assert from "node:assert/strict"
import test from "node:test"

import { graphqlResolveMutation } from "../../lib/github-review-thread/graphql-resolve-mutation.js"
import { graphqlThreadLocatorQuery } from "../../lib/github-review-thread/graphql-thread-locator-query.js"
import { graphqlThreadVerifyQuery } from "../../lib/github-review-thread/graphql-thread-verify-query.js"
import { GitHubReviewIntegration } from "../../lib/github-review-thread/github-review-integration.js"
import { reviewCommentReactionEndpoint } from "../../lib/github-review-thread/review-comment-reaction-endpoint.js"

await test("when feedback is rejected, creates the reaction before resolving and verifies both states", async () => {
  // Arrange
  const restCalls = []
  const graphCalls = []
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: "-1" },
    [{ content: "-1", user: { id: 42 } }],
    [{ content: "-1", user: { id: 42 } }],
  ]
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "thread-1",
                  isResolved: false,
                  comments: { nodes: [{ databaseId: 123 }] },
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
        resolveReviewThread: { thread: { id: "thread-1", isResolved: true } },
      },
    },
    { data: { node: { isResolved: true } } },
  ]
  const callRest = async (method, endpoint, payload) => {
    restCalls.push({ method, endpoint, payload })
    return restResponses.shift()
  }
  const callGraphql = async (query, variables) => {
    graphCalls.push({ query, variables })
    return graphResponses.shift()
  }

  const github = new GitHubReviewIntegration("token", {
    callRest,
    callGraphql,
  })

  // Act
  const result = await github.resolveReviewThread("owner/repo", 456, 123, "-1")

  // Assert
  assert.deepEqual(result, {
    threadId: "thread-1",
    reactionCreated: true,
    verified: true,
  })
  assert.deepEqual(restCalls, [
    {
      method: "GET",
      endpoint: "user",
      payload: undefined,
    },
    {
      method: "GET",
      endpoint: `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=1`,
      payload: undefined,
    },
    {
      method: "POST",
      endpoint: reviewCommentReactionEndpoint("owner/repo", 123),
      payload: {
        content: "-1",
      },
    },
    {
      method: "GET",
      endpoint: `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=1`,
      payload: undefined,
    },
    {
      method: "GET",
      endpoint: `${reviewCommentReactionEndpoint("owner/repo", 123)}?per_page=100&page=1`,
      payload: undefined,
    },
  ])
  assert.deepEqual(graphCalls, [
    {
      query: graphqlThreadLocatorQuery(),
      variables: {
        owner: "owner",
        name: "repo",
        pullNumber: 456,
        after: undefined,
      },
    },
    {
      query: graphqlResolveMutation(),
      variables: {
        threadId: "thread-1",
      },
    },
    {
      query: graphqlThreadVerifyQuery(),
      variables: {
        threadId: "thread-1",
      },
    },
  ])
})

await test("when a resolved thread lacks its reaction, repairs it without resolving twice", async () => {
  // Arrange
  const restCalls = []
  const graphCalls = []
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: "+1" },
    [{ content: "+1", user: { id: 42 } }],
    [{ content: "+1", user: { id: 42 } }],
  ]
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "thread-resolved",
                  isResolved: true,
                  comments: { nodes: [{ databaseId: 123 }] },
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    },
    { data: { node: { isResolved: true } } },
  ]
  const callRest = async (method, endpoint, payload) => {
    restCalls.push({ method, endpoint, payload })
    return restResponses.shift()
  }
  const callGraphql = async (query, variables) => {
    graphCalls.push({ query, variables })
    return graphResponses.shift()
  }

  const github = new GitHubReviewIntegration("token", {
    callRest,
    callGraphql,
  })

  // Act
  const result = await github.resolveReviewThread("owner/repo", 456, 123, "+1")

  // Assert
  assert.deepEqual(result, {
    threadId: "thread-resolved",
    reactionCreated: true,
    verified: true,
  })
  assert.deepEqual(
    graphCalls.map(({ query }) => query),
    [graphqlThreadLocatorQuery(), graphqlThreadVerifyQuery()]
  )
  assert.deepEqual(restCalls[2], {
    method: "POST",
    endpoint: reviewCommentReactionEndpoint("owner/repo", 123),
    payload: {
      content: "+1",
    },
  })
})

await test("when the final reaction check is missing, rejects completion", async () => {
  // Arrange
  const restResponses = [
    { id: 42 },
    [],
    { id: 101, content: "+1" },
    [{ content: "+1", user: { id: 42 } }],
    [],
  ]
  const graphResponses = [
    {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "thread-1",
                  isResolved: false,
                  comments: { nodes: [{ databaseId: 123 }] },
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
        resolveReviewThread: { thread: { id: "thread-1", isResolved: true } },
      },
    },
    { data: { node: { isResolved: true } } },
  ]
  const callRest = async () => restResponses.shift()
  const callGraphql = async () => graphResponses.shift()

  const github = new GitHubReviewIntegration("token", {
    callRest,
    callGraphql,
  })

  // Act / Assert
  await assert.rejects(
    github.resolveReviewThread("owner/repo", 456, 123, "+1"),
    /Completion verification failed/u
  )
})
