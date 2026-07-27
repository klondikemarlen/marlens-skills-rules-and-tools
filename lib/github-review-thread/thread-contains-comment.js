export function threadContainsComment(thread, reviewCommentId) {
  for (const node of thread?.comments?.nodes ?? []) {
    if (String(node?.databaseId) === String(reviewCommentId)) return true;
  }
  return false;
}
