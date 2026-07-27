export async function currentViewerId(authToken, callRest) {
  const viewer = await callRest('GET', 'user', undefined, authToken);
  if (!Number.isInteger(viewer?.id)) {
    throw new Error('Could not resolve the authenticated GitHub user.');
  }
  return viewer.id;
}
