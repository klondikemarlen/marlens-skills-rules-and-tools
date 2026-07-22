import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REVIEW_COMMENT_REACTION_REPLIES,
  graphqlResolveMutation,
  graphqlThreadLocatorQuery,
  graphqlThreadVerifyQuery,
  normalizeRepository,
  parseOptions,
  reviewCommentReactionEndpoint,
  reviewCommentReplyEndpoint,
} from '../lib/github-review-thread.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'bin/github-review-thread');
const temp = await mkdtemp(path.join(os.tmpdir(), 'github-review-thread-test-'));
const mockFetchHook = path.join(temp, 'mock-fetch-hook.cjs');
await writeFile(mockFetchHook, buildMockFetchHook());

await access(bin, constants.F_OK);
await access(bin, constants.X_OK);
const cliText = await readFile(bin, 'utf8');
assert.match(cliText, /already resolved/i);

const repository = parseRepositoryFromRemote(execGit(['-C', root, 'remote', 'get-url', 'origin']));
assert.ok(repository, 'Could not resolve current checkout repository origin.');
const [repositoryOwner, repositoryName] = repository.split('/');

test('github-review-thread', async (suite) => {
  await suite.test('parses option forms', () => {
    // Arrange
    // Act
    const normalized = normalizeRepository('OWNER/Repo-ONE');
    const badRepo = normalizeRepository('bad');
    const rawHelp = parseOptions(['--help']);
    const rawDry = parseOptions(['--dry-run', '--repo', 'owner/repo', '--comment-id', '42']);
    const rawDryEqualsTrue = parseOptions(['--dry-run=true', '--repo', 'owner/repo', '--comment-id', '42']);
    const rawDryEqualsFalse = parseOptions(['--dry-run=false', '--repo', 'owner/repo', '--comment-id', '42']);

    // Assert
    assert.equal(normalized, 'owner/repo-one');
    assert.equal(badRepo, undefined);
    assert.deepEqual(rawHelp, { help: true });
    assert.deepEqual(rawDry, { dryRun: true, repo: 'owner/repo', commentId: '42' });
    assert.deepEqual(rawDryEqualsTrue, { dryRun: true, repo: 'owner/repo', commentId: '42' });
    assert.deepEqual(rawDryEqualsFalse, { dryRun: false, repo: 'owner/repo', commentId: '42' });
  });

  await suite.test('generates dry-run plans', async (dryRunSuite) => {
    await dryRunSuite.test('previews upvote reaction payload', () => {
      // Arrange
      const action = 'upvote';
      // Act
      const plan = runDry([repository, action]);
      // Assert
      assert.equal(plan.plan?.[0]?.body?.content, REVIEW_COMMENT_REACTION_REPLIES[0]);
    });

    await dryRunSuite.test('previews downvote reaction payload', () => {
      // Arrange
      const action = 'downvote';
      // Act
      const plan = runDry([repository, action]);
      // Assert
      assert.equal(plan.plan?.[0]?.body?.content, REVIEW_COMMENT_REACTION_REPLIES[1]);
    });

    await dryRunSuite.test('previews reply endpoint and method', () => {
      // Arrange
      const action = 'reply';
      // Act
      const plan = runDry([repository, action]);
      // Assert
      assert.equal(plan.plan?.[0]?.method, 'POST');
      assert.match(plan.plan?.[0]?.endpoint ?? '', /\/pulls\/456\/comments\/\d+\/replies$/u);
    });

    await dryRunSuite.test('previews resolve query + mutation + verify flow', () => {
      // Arrange
      const action = 'resolve';
      // Act
      const plan = runDry([repository, action]);
      // Assert
      assert.equal(plan.plan?.length, 3);
      assert.match(plan.plan?.[0]?.query ?? '', /\bLocateReviewThread\b/u);
      assert.match(plan.plan?.[1]?.query ?? '', /\bResolveReviewThread\b/u);
      assert.match(plan.plan?.[2]?.query ?? '', /\bCheckReviewThreadResolved\b/u);
    });
  });

  await suite.test('rejects invalid repository and id inputs', async (validationSuite) => {
    await validationSuite.test('rejects external repo target', () => {
      // Arrange
      const child = runCli([
        'upvote',
        '--repo', 'evil/repo',
        '--comment-id', '1',
        '--dry-run',
      ]);
      // Assert
      assert.notEqual(child.status, 0);
      assert.match(child.stderr, /Refusing external target/u);
    });

    const invalidNumericCases = [
      {
        label: 'rejects zero comment id',
        args: ['resolve', '--repo', repository, '--pr', '1', '--comment-id', '0', '--dry-run'],
        expected: /Expected positive integer for --comment-id/u,
      },
      {
        label: 'rejects negative comment id',
        args: ['resolve', '--repo', repository, '--pr', '1', '--comment-id', '-1', '--dry-run'],
        expected: /Expected positive integer for --comment-id/u,
      },
      {
        label: 'rejects zero pull request number',
        args: ['resolve', '--repo', repository, '--pr', '0', '--comment-id', '1', '--dry-run'],
        expected: /Expected positive integer for --pr/u,
      },
      {
        label: 'rejects negative pull request number',
        args: ['resolve', '--repo', repository, '--pr', '-1', '--comment-id', '1', '--dry-run'],
        expected: /Expected positive integer for --pr/u,
      },
    ];
    for (const { label, args, expected } of invalidNumericCases) {
      await validationSuite.test(label, () => {
        // Act
        const child = runCli(args);
        // Assert
        assert.notEqual(child.status, 0);
        assert.match(child.stderr, expected);
      });
    }
  });

  await suite.test('runs upvote/downvote reply actions with mocked API', async (actionSuite) => {
    await actionSuite.test('upvotes review comment', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'upvote',
        args: ['--repo', repository, '--comment-id', expectedCommentId],
        responses: [{ status: 201, body: { id: 101, content: '+1' } }],
      });
      // Assert
      assert.equal(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.equal(result.calls[0].method, 'POST');
      assert.equal(result.calls[0].url, `https://api.github.com/${reviewCommentReactionEndpoint(repository, expectedCommentId)}`);
      assert.equal(result.calls[0].body?.content, REVIEW_COMMENT_REACTION_REPLIES[0]);
      assert.equal(result.json?.status, 'ok');
    });

    await actionSuite.test('downvotes review comment', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'downvote',
        args: ['--repo', repository, '--comment-id', expectedCommentId],
        responses: [{ status: 201, body: { id: 102, content: '-1' } }],
      });
      // Assert
      assert.equal(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.equal(result.calls[0].method, 'POST');
      assert.equal(result.calls[0].url, `https://api.github.com/${reviewCommentReactionEndpoint(repository, expectedCommentId)}`);
      assert.equal(result.calls[0].body?.content, REVIEW_COMMENT_REACTION_REPLIES[1]);
    });

    await actionSuite.test('replies to review comment via REST endpoint', async () => {
      // Arrange
      const expectedCommentId = '123';
      const expectedPullRequest = 456;
      // Act
      const result = await runWithMock({
        action: 'reply',
        args: ['--repo', repository, '--pr', String(expectedPullRequest), '--comment-id', expectedCommentId, '--body', 'test'],
        responses: [{ status: 201, body: { id: 55 } }],
      });
      // Assert
      assert.equal(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.equal(result.calls[0].method, 'POST');
      assert.equal(result.calls[0].url, `https://api.github.com/${reviewCommentReplyEndpoint(repository, expectedPullRequest, expectedCommentId)}`);
      assert.equal(result.calls[0].body?.body, 'test');
      assert.equal(result.json?.status, 'ok');
    });
  });

  await suite.test('resolves review thread by mapped comment id', async (resolveSuite) => {
    await resolveSuite.test('resolves when mapping requires one page of locator pagination', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [
          {
            status: 200,
            body: {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{
                        id: 'thread-first',
                        isResolved: false,
                        comments: { nodes: [{ databaseId: 999 }] },
                      }],
                      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
                    },
                  },
                },
              },
            },
          },
          {
            status: 200,
            body: {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{
                        id: 'thread-target',
                        isResolved: false,
                        comments: { nodes: [{ databaseId: Number(expectedCommentId) }] },
                      }],
                      pageInfo: { hasNextPage: false, endCursor: null },
                    },
                  },
                },
              },
            },
          },
          { status: 200, body: { data: { resolveReviewThread: { thread: { id: 'thread-target', isResolved: true } } } },
          },
          { status: 200, body: { data: { node: { isResolved: true } } },
          },
        ],
      });
      // Assert
      assert.equal(result.status, 0);
      assert.equal(result.calls.length, 4);
      assert.equal(result.calls[0].url, 'https://api.github.com/graphql');
      assert.equal(result.calls[1].url, 'https://api.github.com/graphql');
      assert.equal(result.calls[2].url, 'https://api.github.com/graphql');
      assert.equal(result.calls[3].url, 'https://api.github.com/graphql');
      assert.equal(result.calls[0].body.query, graphqlThreadLocatorQuery());
      assert.equal(result.calls[1].body.query, graphqlThreadLocatorQuery());
      assert.equal(result.calls[2].body.query, graphqlResolveMutation());
      assert.equal(result.calls[3].body.query, graphqlThreadVerifyQuery());
      assert.equal(result.calls[2].body.variables.threadId, 'thread-target');
      assert.equal(result.calls[3].body.variables.threadId, 'thread-target');
      assert.equal(result.calls[0].body.variables.after, undefined);
      assert.equal(result.calls[1].body.variables.after, 'cursor-1');
      assert.equal(result.calls[0].body.variables.owner, repositoryOwner);
      assert.equal(result.calls[0].body.variables.name, repositoryName);
      assert.equal(result.calls[0].body.variables.pullNumber, 456);
      assert.equal(result.calls[1].body.variables.owner, repositoryOwner);
      assert.equal(result.calls[1].body.variables.name, repositoryName);
      assert.equal(result.calls[1].body.variables.pullNumber, 456);
      assert.equal(result.json?.status, 'resolved');
    });

    await resolveSuite.test('handles paginated locator path before resolve', async () => {
      // Arrange
      const expectedCommentId = '555';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [
          {
            status: 200,
            body: {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{
                        id: 'thread-first-page',
                        isResolved: false,
                        comments: { nodes: [{ databaseId: 999 }] },
                      }],
                      pageInfo: { hasNextPage: true, endCursor: 'cursor-2' },
                    },
                  },
                },
              },
            },
          },
          {
            status: 200,
            body: {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{
                        id: 'thread-target-page',
                        isResolved: false,
                        comments: { nodes: [{ databaseId: Number(expectedCommentId) }] },
                      }],
                      pageInfo: { hasNextPage: false, endCursor: null },
                    },
                  },
                },
              },
            },
          },
          { status: 200, body: { data: { resolveReviewThread: { thread: { id: 'thread-target-page', isResolved: true } } } },
          },
          { status: 200, body: { data: { node: { isResolved: true } } },
          },
        ],
      });
      // Assert
      assert.equal(result.status, 0);
      assert.equal(result.calls.length, 4);
      assert.equal(result.calls[0].body.query, graphqlThreadLocatorQuery());
      assert.equal(result.calls[1].body.query, graphqlThreadLocatorQuery());
      assert.equal(result.calls[2].body.query, graphqlResolveMutation());
      assert.equal(result.calls[3].body.query, graphqlThreadVerifyQuery());
      assert.equal(result.calls[2].body.variables.threadId, 'thread-target-page');
      assert.equal(result.calls[3].body.variables.threadId, 'thread-target-page');
      assert.equal(result.calls[0].body.variables.after, undefined);
      assert.equal(result.calls[1].body.variables.after, 'cursor-2');
      assert.equal(result.calls[0].body.variables.owner, repositoryOwner);
      assert.equal(result.calls[0].body.variables.name, repositoryName);
      assert.equal(result.calls[0].body.variables.pullNumber, 456);
      assert.equal(result.calls[1].body.variables.owner, repositoryOwner);
      assert.equal(result.calls[1].body.variables.name, repositoryName);
      assert.equal(result.calls[1].body.variables.pullNumber, 456);
      assert.equal(result.json?.status, 'resolved');
    });
  });

  await suite.test('maps failure modes', async (failureSuite) => {
    await failureSuite.test('reports unresolved review-thread mapping', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [{
          status: 200,
          body: {
            data: {
              repository: {
                pullRequest: {
                  reviewThreads: {
                    nodes: [{
                      id: 'other-thread',
                      isResolved: false,
                      comments: { nodes: [{ databaseId: 999 }] },
                    }],
                    pageInfo: { hasNextPage: false, endCursor: null },
                  },
                },
              },
            },
          },
        }],
      });
      // Assert
      assert.notEqual(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.match(result.stderr, /No review-thread mapping found/u);
    });

    await failureSuite.test('rejects already-resolved thread', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [{
          status: 200,
          body: {
            data: {
              repository: {
                pullRequest: {
                  reviewThreads: {
                    nodes: [{
                      id: 'already',
                      isResolved: true,
                      comments: { nodes: [{ databaseId: Number(expectedCommentId) }] },
                    }],
                    pageInfo: { hasNextPage: false, endCursor: null },
                  },
                },
              },
            },
          },
        }],
      });
      // Assert
      assert.notEqual(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.match(result.stderr, /already resolved/i);
    });

    await failureSuite.test('surfaces REST API failures', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'upvote',
        args: ['--repo', repository, '--comment-id', expectedCommentId],
        responses: [{ status: 403, body: { message: 'Forbidden' } }],
      });
      // Assert
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /GitHub REST call failed/u);
    });

    await failureSuite.test('surfaces GraphQL locator failures', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [{ status: 200, body: { errors: [{ message: 'Cannot read field pullRequest' }] } }],
      });
      // Assert
      assert.notEqual(result.status, 0);
      assert.equal(result.calls.length, 1);
      assert.match(result.stderr, /GraphQL call returned errors/u);
    });

    await failureSuite.test('surfaces GraphQL mutation failures', async () => {
      // Arrange
      const expectedCommentId = '123';
      // Act
      const result = await runWithMock({
        action: 'resolve',
        args: ['--repo', repository, '--pr', '456', '--comment-id', expectedCommentId],
        responses: [
          {
            status: 200,
            body: {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{
                        id: 'thread-target',
                        isResolved: false,
                        comments: { nodes: [{ databaseId: Number(expectedCommentId) }] },
                      }],
                      pageInfo: { hasNextPage: false, endCursor: null },
                    },
                  },
                },
              },
            },
          },
          { status: 200, body: { errors: [{ message: 'Mutation not permitted' }] } },
        ],
      });
      // Assert
      assert.notEqual(result.status, 0);
      assert.equal(result.calls.length, 2);
      assert.match(result.stderr, /GraphQL call returned errors/u);
    });
  });
});

test.after(async () => {
  await rm(temp, { recursive: true, force: true });
});

function runDry([repositoryValue, action]) {
  const child = spawnSync(process.execPath, [
    bin,
    action,
    '--repo', repositoryValue,
    '--comment-id', '123',
    '--pr', '456',
    '--body', 'reply text',
    '--dry-run',
  ], {
    cwd: root,
    env: { ...process.env, GH_TOKEN: 'mock-token' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (child.status !== 0) {
    throw new Error(`Dry run failed for ${action}: ${child.stderr}`);
  }
  return JSON.parse(child.stdout);
}

function runCli(args) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    env: { ...process.env, GH_TOKEN: 'mock-token' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function runWithMock({ action, args, responses }) {
  const fixture = await mkdtemp(path.join(temp, 'case-'));
  const responsesPath = path.join(fixture, 'responses.json');
  const callsPath = path.join(fixture, 'calls.json');
  await writeFile(responsesPath, JSON.stringify({ responses }));
  await writeFile(callsPath, '[]');

  const child = spawnSync(process.execPath, [
    '--require',
    mockFetchHook,
    bin,
    action,
    ...args,
  ], {
    cwd: root,
    env: {
      ...process.env,
      GH_TOKEN: 'mock-token',
      GRT_FETCH_MOCKS: responsesPath,
      GRT_FETCH_CALL_LOG: callsPath,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const callsText = await readFile(callsPath, 'utf8');
  const calls = callsText ? safeJsonParse(callsText) : [];

  return {
    ...child,
    status: child.status ?? -1,
    calls,
    json: child.stdout ? safeJsonParse(child.stdout) : undefined,
  };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function execGit(args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function parseRepositoryFromRemote(value) {
  const trimmed = String(value ?? '').trim().replace(/\.git$/u, '');
  const match = trimmed.match(/github\.com[:/]([^/]+)\/([^/]+)$/u);
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : undefined;
}

function buildMockFetchHook() {
  return `
const { readFileSync, writeFileSync } = require('node:fs');

const responses = JSON.parse(readFileSync(process.env.GRT_FETCH_MOCKS, 'utf8')).responses;
const callLogPath = process.env.GRT_FETCH_CALL_LOG;
const calls = [];

global.fetch = async (input, init = {}) => {
  const method = (init.method || 'GET').toUpperCase();
  const bodyText = init.body;
  const body = typeof bodyText === 'string' ? safeParse(bodyText) : bodyText;

  calls.push({ url: String(input), method, body });
  if (callLogPath) {
    writeFileSync(callLogPath, JSON.stringify(calls), { encoding: 'utf8' });
  }

  const response = responses.shift();
  if (!response) {
    return new Response(
      JSON.stringify({ message: 'Unexpected fetch call' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify(response.body ?? {}),
    {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'application/json', ...(response.headers ?? {}) },
    },
  );
};

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
`;
}
