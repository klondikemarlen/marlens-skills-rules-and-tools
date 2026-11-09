export const demoRequest = {
  action: "Sign in to npm",
  target: [
    { label: "Package", value: "marlens-skills-rules-and-tools · 4.0.3" },
    { label: "Account", value: "Intended npm maintainer; identity will be verified after sign-in" },
  ],
  reason: "Publish the clearer handoff previews for people installing this package from npm.",
  context: {
    agent: "Example release assistant",
    repository: "klondikemarlen/marlens-skills-rules-and-tools",
    task: "Release the clearer handoff previews",
    completionEffect:
      "After sign-in and the remaining release checks, I could publish this version.",
  },
  destinationUrl: "https://www.npmjs.com/login",
}
