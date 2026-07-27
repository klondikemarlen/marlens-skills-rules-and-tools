export function threadContainsComment(thread, reviewCommentId) {
  return (thread?.comments?.nodes ?? []).some(
    (node) => String(node?.databaseId) === String(reviewCommentId),
  );
}
