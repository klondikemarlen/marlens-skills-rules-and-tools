import { buildPlan } from './build-plan.js';
import { callGraphql } from './call-graphql.js';
import { callRest } from './call-rest.js';
import { currentCheckoutRepository } from './current-checkout-repository.js';
import { downvoteReviewComment } from './downvote-review-comment.js';
import { normalizeRepository } from './normalize-repository.js';
import { parseInteger } from './parse-integer.js';
import { parseOptions } from './parse-options.js';
import { parseReaction } from './parse-reaction.js';
import { replyReviewComment } from './reply-review-comment.js';
import { resolveReviewThread } from './resolve-review-thread.js';
import { resolveToken } from './resolve-token.js';
import { upvoteReviewComment } from './upvote-review-comment.js';
import { USAGE } from './usage.js';

const ACTIONS = new Set(['upvote', 'downvote', 'reply', 'resolve']);

export async function runCli(argv, cwd, environment) {
  try {
    const action = argv[0];
    const options = parseOptions(argv.slice(1));
    if (action === undefined || options.help || action === 'help') {
      console.error(USAGE);
      return 1;
    }
    if (!ACTIONS.has(action)) throw new Error(`Unknown action: ${action}`);

    const repository = normalizeRepository(options.repo);
    if (!repository) throw new Error('Use --repo OWNER/REPOSITORY (required).');
    const currentRepository = currentCheckoutRepository(cwd);
    if (!currentRepository) throw new Error('Could not resolve current checkout GitHub repository origin.');
    if (repository !== currentRepository) {
      throw new Error(`Refusing external target: ${repository} != checkout repository ${currentRepository}`);
    }

    const commentId = parseInteger(options.commentId, '--comment-id');
    const pullRequest = action === 'reply' || action === 'resolve'
      ? parseInteger(options.pr, '--pr')
      : undefined;
    if (action === 'resolve') options.reaction = parseReaction(options);

    if (options.dryRun) {
      const [owner, name] = repository.split('/');
      const plan = await buildPlan(
        action,
        repository,
        commentId,
        { ...options, pr: pullRequest },
        owner,
        name,
      );
      console.log(JSON.stringify({ action, repository, commentId, ...(pullRequest ? { pullRequest } : {}), ...(options.reaction ? { reaction: options.reaction } : {}), dryRun: true, owner, name, plan }));
      return 0;
    }

    const token = resolveToken(environment);
    if (!token) throw new Error('Authenticate with gh (`gh auth login`) or set GITHUB_TOKEN/GH_TOKEN.');

    if (action === 'upvote' || action === 'downvote') {
      const reaction = action === 'upvote' ? '+1' : '-1';
      const result = action === 'upvote'
        ? await upvoteReviewComment(repository, commentId, token, callRest)
        : await downvoteReviewComment(repository, commentId, token, callRest);
      console.log(JSON.stringify({ action, repository, commentId, status: 'ok', result: `reaction:${reaction}`, created: result.created }));
      return 0;
    }

    if (action === 'reply') {
      await replyReviewComment(repository, pullRequest, commentId, options, token, callRest);
      console.log(JSON.stringify({ action, repository, pullRequest, commentId, status: 'ok' }));
      return 0;
    }

    const result = await resolveReviewThread(repository, pullRequest, commentId, options.reaction, token, callRest, callGraphql);
    console.log(JSON.stringify({ action, repository, pullRequest, commentId, reaction: options.reaction, ...result, status: 'resolved' }));
    return 0;
  } catch (error) {
    console.error(`github-review-thread: ${error.message}`);
    return 1;
  }
}
