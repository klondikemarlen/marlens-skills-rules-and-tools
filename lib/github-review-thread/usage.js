export const USAGE = `
Usage:
  github-review-thread upvote   --repo OWNER/REPOSITORY --comment-id ID [--dry-run]
  github-review-thread downvote --repo OWNER/REPOSITORY --comment-id ID [--dry-run]
  github-review-thread reply    --repo OWNER/REPOSITORY --pr NUMBER --comment-id ID --body-file PATH [--dry-run]
  github-review-thread resolve  --repo OWNER/REPOSITORY --pr NUMBER --comment-id ID --reaction +1|-1 [--dry-run]
`;
