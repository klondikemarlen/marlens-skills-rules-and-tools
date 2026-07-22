const BOOLEAN_OPTIONS = new Set(['help', 'dryRun']);

export const REVIEW_COMMENT_REACTION_REPLIES = ['+1', '-1'];

export function parseOptions(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }
    if (!arg.startsWith('--')) {
      fail(`Unexpected positional arg: ${arg}`);
    }

    const normalized = arg.slice(2);
    const [name, inlineValue] = normalized.split('=', 2);
    const key = normalizeOptionName(name);
    const next = values[index + 1];

    if (BOOLEAN_OPTIONS.has(key)) {
      parsed[key] = inlineValue === undefined ? true : !/^(false|0)$/u.test(inlineValue);
      continue;
    }

    const value = inlineValue ?? next;
    const missingValue = inlineValue === undefined && (value === undefined || value.startsWith('--'));
    if (missingValue) {
      fail(`Missing value for --${name}.`);
    }

    parsed[key] = value;
    if (inlineValue === undefined) index += 1;
  }
  return parsed;
}

function normalizeOptionName(value) {
  return value
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .map((segment, index) => (index === 0 ? segment : `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`))
    .join('');
}

export function normalizeRepository(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.toLowerCase().match(/^([a-z0-9_.-]+)\/([a-z0-9_.-]+)$/u);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

export function reviewCommentReactionEndpoint(repository, commentId) {
  return `repos/${repository}/pulls/comments/${commentId}/reactions`;
}

export function reviewCommentReplyEndpoint(repository, pullRequestNumber, commentId) {
  return `repos/${repository}/pulls/${pullRequestNumber}/comments/${commentId}/replies`;
}

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
  }`;
}

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

export function graphqlResolveMutation() {
  return `mutation ResolveReviewThread($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }`;
}

export function graphqlThreadVerifyQuery() {
  return `query CheckReviewThreadResolved($threadId: ID!) {
    node(id: $threadId) {
      ... on PullRequestReviewThread {
        isResolved
      }
    }
  }`;
}

function fail(message) {
  throw new Error(message);
}
