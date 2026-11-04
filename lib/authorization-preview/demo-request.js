export const demoRequest = {
  action: "Sign in to npm",
  target: [{ label: "Package", value: "@example/release-helper · 2.4.0" }],
  reason:
    "npm hosts the package, but it rejected the saved sign-in. Please sign in so I can publish this reviewed update for your team.",
  context: {
    agent: "Example release assistant",
    task: "Publish the Release Helper update",
    whatHappened:
      "Release Helper prepares and publishes your team's packages. This update clarifies release summaries and fixes incorrect version warnings. Checks passed; nothing has been published.",
    completionEffect:
      "After npm confirms your account, I can publish this version. Signing in alone does not publish it.",
  },
  destinationUrl: "https://www.npmjs.com/login",
}
