export function reviewCommentReplyEndpoint(repository, pullRequestNumber, commentId) {
  return `repos/${repository}/pulls/${pullRequestNumber}/comments/${commentId}/replies`;
}
