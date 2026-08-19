import { callGraphql as defaultCallGraphql } from './call-graphql.js';
import { callRest as defaultCallRest } from './call-rest.js';
import { graphqlResolveMutation } from './graphql-resolve-mutation.js';
import { graphqlThreadCommentsPageQuery } from './graphql-thread-comments-page-query.js';
import { graphqlThreadLocatorQuery } from './graphql-thread-locator-query.js';
import { graphqlThreadVerifyQuery } from './graphql-thread-verify-query.js';
import { reviewCommentReactionEndpoint } from './review-comment-reaction-endpoint.js';
import { reviewCommentReplyEndpoint } from './review-comment-reply-endpoint.js';

export class GitHubReviewIntegration {
  constructor(authToken, { callRest = defaultCallRest, callGraphql = defaultCallGraphql } = {}) {
    this.authToken = authToken;
    this.callRest = callRest;
    this.callGraphql = callGraphql;
  }

  async upvoteReviewComment(repository, commentId) {
    return this.applyReaction(repository, commentId, '+1');
  }

  async downvoteReviewComment(repository, commentId) {
    return this.applyReaction(repository, commentId, '-1');
  }

  async replyReviewComment(repository, pullRequest, commentId, body) {
    await this.callRest(
      'POST',
      reviewCommentReplyEndpoint(repository, pullRequest, commentId),
      { body },
      this.authToken,
    );
  }

  async resolveReviewThread(repository, pullRequest, commentId, reaction) {
    const mapped = await this.findThreadByCommentId(repository, pullRequest, commentId);
    if (!mapped) {
      throw new Error(`No review-thread mapping found for comment ${commentId} in ${repository}#${pullRequest}.`);
    }

    const { viewerId, created } = await this.applyReaction(repository, commentId, reaction);
    if (!mapped.isResolved) {
      await this.callGraphql(graphqlResolveMutation(), { threadId: mapped.threadId }, this.authToken);
    }

    const verification = await this.verifyThreadCompletion(repository, commentId, reaction, viewerId, mapped.threadId);
    if (!verification.reaction || !verification.resolved) {
      throw new Error(
        `Completion verification failed for comment ${commentId}: reaction=${verification.reaction}, resolved=${verification.resolved}.`,
      );
    }

    return {
      threadId: mapped.threadId,
      reactionCreated: created,
      verified: true,
    };
  }

  async applyReaction(repository, commentId, reaction) {
    const viewerId = await this.currentViewerId();
    const alreadyReacted = await this.currentViewerHasReaction(repository, commentId, reaction, viewerId);
    if (!alreadyReacted) {
      await this.callRest(
        'POST',
        reviewCommentReactionEndpoint(repository, commentId),
        { content: reaction },
        this.authToken,
      );
      if (!(await this.currentViewerHasReaction(repository, commentId, reaction, viewerId))) {
        throw new Error(`Reaction ${reaction} was not present after the request for comment ${commentId}.`);
      }
    }
    return { viewerId, created: !alreadyReacted };
  }

  async findThreadByCommentId(repository, pullRequestNumber, reviewCommentId) {
    let after;
    for (;;) {
      const response = await this.callGraphql(
        graphqlThreadLocatorQuery(),
        {
          owner: repository.split('/')[0],
          name: repository.split('/')[1],
          pullNumber: pullRequestNumber,
          after,
        },
        this.authToken,
      );

      const threads = response?.data?.repository?.pullRequest?.reviewThreads;
      if (!threads) return undefined;

      for (const thread of threads.nodes ?? []) {
        if (threadContainsComment(thread, reviewCommentId)) {
          return {
            threadId: thread.id,
            isResolved: Boolean(thread.isResolved),
          };
        }
        if (await this.threadContainsCommentInLaterPages(thread, reviewCommentId)) {
          return {
            threadId: thread.id,
            isResolved: Boolean(thread.isResolved),
          };
        }
      }

      if (!threads.pageInfo?.hasNextPage) return undefined;
      after = threads.pageInfo?.endCursor;
    }
  }

  async currentViewerId() {
    const viewer = await this.callRest('GET', 'user', undefined, this.authToken);
    if (!Number.isInteger(viewer?.id)) {
      throw new Error('Could not resolve the authenticated GitHub user.');
    }
    return viewer.id;
  }

  async currentViewerHasReaction(repository, reviewCommentId, expectedReaction, viewerId) {
    for (let page = 1; ; page += 1) {
      const reactions = await this.callRest(
        'GET',
        `${reviewCommentReactionEndpoint(repository, reviewCommentId)}?per_page=100&page=${page}`,
        undefined,
        this.authToken,
      );
      if (!Array.isArray(reactions)) {
        throw new Error(`Reaction lookup returned an invalid response for comment ${reviewCommentId}.`);
      }
      for (const reaction of reactions) {
        if (reaction.content === expectedReaction && reaction.user?.id === viewerId) return true;
      }
      if (reactions.length < 100) return false;
    }
  }

  async threadContainsCommentInLaterPages(thread, reviewCommentId) {
    let after = thread?.comments?.pageInfo?.endCursor;
    let hasNextPage = Boolean(thread?.comments?.pageInfo?.hasNextPage);
    while (hasNextPage) {
      const response = await this.callGraphql(
        graphqlThreadCommentsPageQuery(),
        { threadId: thread?.id, after },
        this.authToken,
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

  async verifyThreadCompletion(repository, commentId, reaction, viewerId, threadId) {
    const [hasReaction, isResolved] = await Promise.all([
      this.currentViewerHasReaction(repository, commentId, reaction, viewerId),
      this.verifyThreadResolved(threadId),
    ]);
    return { reaction: hasReaction, resolved: isResolved };
  }

  async verifyThreadResolved(threadId) {
    const response = await this.callGraphql(graphqlThreadVerifyQuery(), { threadId }, this.authToken);
    return Boolean(response?.data?.node?.isResolved);
  }
}

function threadContainsComment(thread, reviewCommentId) {
  for (const node of thread?.comments?.nodes ?? []) {
    if (String(node?.databaseId) === String(reviewCommentId)) return true;
  }
  return false;
}
