export const demoRequest = {
  action: "Review a document in the browser",
  target: [
    { label: "Document", value: "Example project proposal" },
    { label: "Requested step", value: "Read the proposal and decide whether to approve it" },
  ],
  reason: "The next decision belongs to you. This page explains why the agent is handing it over.",
  context: {
    agent: "Example assistant",
    task: "Prepare a project proposal for review",
    whatHappened:
      "A draft was prepared. No approval has been given and nothing has been submitted.",
    completionEffect:
      "In a real handoff, the destination would show the document for your review. Opening it would not itself approve anything.",
  },
  destinationUrl: "https://example.com/proposals/sample?view=review#summary",
}
