export function reviewCommentReactionEndpoint(repository, commentId) {
  return `repos/${repository}/pulls/comments/${commentId}/reactions`
}
