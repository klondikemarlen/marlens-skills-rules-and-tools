export const demoRequest = {
  action: "Sign in to npm",
  target: [{ label: "Package", value: "@example/release-tool · 2.4.0" }],
  reason:
    "npm rejected the command-line credentials. I need you to sign in before I can publish the version you requested.",
  context: {
    agent: "Example release assistant",
    task: "Publish release-tool 2.4.0",
    whatHappened:
      "The release checks passed and version 2.4.0 is ready. Nothing has been published.",
    completionEffect:
      "After npm confirms your sign-in, I can resume publishing this version. Signing in does not itself publish the package.",
  },
  destinationUrl: "https://www.npmjs.com/login",
}
