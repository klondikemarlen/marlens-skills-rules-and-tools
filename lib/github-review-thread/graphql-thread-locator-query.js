export function graphqlThreadLocatorQuery() {
  return `query LocateReviewThread($owner: String!, $name: String!, $pullNumber: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $pullNumber) {
        reviewThreads(first: 100, after: $after) {
          nodes {
            id
            isResolved
            comments(first: 100) {
              nodes { databaseId }
              pageInfo { hasNextPage endCursor }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }`
}
