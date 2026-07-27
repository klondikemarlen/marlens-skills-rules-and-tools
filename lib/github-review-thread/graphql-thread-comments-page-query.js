export function graphqlThreadCommentsPageQuery() {
  return `query LocateReviewThreadComments($threadId: ID!, $after: String) {
    node(id: $threadId) {
      ... on PullRequestReviewThread {
        comments(first: 100, after: $after) {
          nodes { databaseId }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }`;
}
