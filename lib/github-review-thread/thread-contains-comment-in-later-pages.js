import { graphqlThreadCommentsPageQuery } from './graphql-thread-comments-page-query.js';

export async function threadContainsCommentInLaterPages(thread, reviewCommentId, authToken, callGraphql) {
  let after = thread?.comments?.pageInfo?.endCursor;
  let hasNextPage = Boolean(thread?.comments?.pageInfo?.hasNextPage);
  while (hasNextPage) {
    const response = await callGraphql(
      graphqlThreadCommentsPageQuery(),
      {
        threadId: thread?.id,
        after,
      },
      authToken,
    );
    const comments = response?.data?.node?.comments;
    for (const node of comments?.nodes ?? []) {
      if (String(node?.databaseId) === String(reviewCommentId)) return true;
    }
    hasNextPage = Boolean(comments?.pageInfo?.hasNextPage);
    after = comments?.pageInfo?.endCursor;
  }
  return false;
}
