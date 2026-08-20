export async function callRest(method, endpoint, payload, authToken) {
  const response = await fetch(`https://api.github.com/${endpoint}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${authToken}`,
      "User-Agent": "marlens-review-thread-helper",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })

  let data
  try {
    data = await response.json()
  } catch {
    data = undefined
  }
  if (!response.ok) {
    const message = data?.message ?? response.statusText
    throw new Error(
      `GitHub REST call failed (${method} ${endpoint}): ${response.status} ${message}`
    )
  }
  return data
}
