export function graphqlThreadVerifyQuery() {
  return `query CheckReviewThreadResolved($threadId: ID!) {
    node(id: $threadId) {
      ... on PullRequestReviewThread {
        isResolved
      }
    }
  }`
}
