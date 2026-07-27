export async function callGraphql(query, variables, authToken) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${authToken}`,
      'User-Agent': 'marlens-review-thread-helper',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const message = data?.errors?.[0]?.message ?? response.statusText;
    throw new Error(`GitHub GraphQL call failed: ${response.status} ${message}`);
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const messages = [];
    for (const error of data.errors) messages.push(error.message);
    throw new Error(`GitHub GraphQL call returned errors: ${messages.join('; ')}`);
  }
  return data;
}
