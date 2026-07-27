import { graphqlThreadLocatorQuery } from './graphql-thread-locator-query.js';
import { threadContainsComment } from './thread-contains-comment.js';
import { threadContainsCommentInLaterPages } from './thread-contains-comment-in-later-pages.js';

export async function findThreadByCommentId(repository, pullRequestNumber, reviewCommentId, authToken, callGraphql) {
  let after;
  for (;;) {
    const response = await callGraphql(
      graphqlThreadLocatorQuery(),
      {
        owner: repository.split('/')[0],
        name: repository.split('/')[1],
        pullNumber: pullRequestNumber,
        after,
      },
      authToken,
    );

    const threads = response?.data?.repository?.pullRequest?.reviewThreads;
    if (!threads) return undefined;

    for (const thread of threads.nodes ?? []) {
      if (threadContainsComment(thread, reviewCommentId)) return { threadId: thread.id, isResolved: Boolean(thread.isResolved) };

      if (await threadContainsCommentInLaterPages(thread, reviewCommentId, authToken, callGraphql)) {
        return { threadId: thread.id, isResolved: Boolean(thread.isResolved) };
      }
    }

    if (!threads.pageInfo?.hasNextPage) return undefined;
    after = threads.pageInfo?.endCursor;
  }
}
