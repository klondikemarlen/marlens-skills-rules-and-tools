import { graphqlThreadVerifyQuery } from './graphql-thread-verify-query.js';

export async function verifyThreadResolved(threadId, authToken, callGraphql) {
  const response = await callGraphql(graphqlThreadVerifyQuery(), { threadId }, authToken);
  return Boolean(response?.data?.node?.isResolved);
}
