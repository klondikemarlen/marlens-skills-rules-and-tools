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
  const initialReactionEndpoint = reviewCommentReactionEndpoint("owner/repo", 123)
  const initialReactionPage = `${initialReactionEndpoint}?per_page=100&page=1`
  const createdReactionEndpoint = reviewCommentReactionEndpoint("owner/repo", 123)
  const verifiedReactionEndpoint = reviewCommentReactionEndpoint("owner/repo", 123)
  const verifiedReactionPage = `${verifiedReactionEndpoint}?per_page=100&page=1`
  const finalReactionEndpoint = reviewCommentReactionEndpoint("owner/repo", 123)
  const finalReactionPage = `${finalReactionEndpoint}?per_page=100&page=1`
  assert.deepEqual(restCalls, [
    {
      method: "GET",
      endpoint: "user",
      payload: undefined,
    },
    {
      method: "GET",
      endpoint: initialReactionPage,
      payload: undefined,
    },
    {
      method: "POST",
      endpoint: createdReactionEndpoint,
      payload: {
        content: "-1",
      },
    },
    {
      method: "GET",
      endpoint: verifiedReactionPage,
      payload: undefined,
    },
    {
      method: "GET",
      endpoint: finalReactionPage,
      payload: undefined,
    },
  ])
  const threadLocatorQuery = graphqlThreadLocatorQuery()
  const resolveMutation = graphqlResolveMutation()
  const threadVerifyQuery = graphqlThreadVerifyQuery()
  assert.deepEqual(graphCalls, [
    {
      query: threadLocatorQuery,
      variables: {
        owner: "owner",
        name: "repo",
        pullNumber: 456,
        after: undefined,
      },
    },
    {
      query: resolveMutation,
      variables: {
        threadId: "thread-1",
      },
    },
    {
      query: threadVerifyQuery,
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
  const actualQueries = graphCalls.map(({ query }) => query)
  const threadLocatorQuery = graphqlThreadLocatorQuery()
  const threadVerifyQuery = graphqlThreadVerifyQuery()
  assert.deepEqual(actualQueries, [threadLocatorQuery, threadVerifyQuery])
  const reactionEndpoint = reviewCommentReactionEndpoint("owner/repo", 123)
  assert.deepEqual(restCalls[2], {
    method: "POST",
    endpoint: reactionEndpoint,
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
