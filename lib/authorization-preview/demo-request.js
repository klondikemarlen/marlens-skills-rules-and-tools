export const demoRequest = {
  action: "Review the project proposal",
  target: [{ label: "Document", value: "Example project proposal · Draft" }],
  reason: "Your draft is ready for a look before you decide whether to approve it.",
  context: {
    agent: "Example assistant",
    task: "Prepare a project proposal",
    whatHappened: "The draft is prepared. Nothing has been submitted or approved.",
    completionEffect: "You'll open the proposal to read it and decide what to do next.",
  },
  destinationUrl: "https://example.com/proposals/sample?view=review#summary",
}
