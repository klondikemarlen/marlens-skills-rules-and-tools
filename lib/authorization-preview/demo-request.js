export const demoRequest = {
  action: "Sign in to npm",
  target: [{ label: "Package", value: "marlens-skills-rules-and-tools · 4.0.2" }],
  reason: "Sign in so I can publish this update for people installing the package from npm.",
  context: {
    agent: "Example release assistant",
    task: "Release the clearer handoff previews",
    whatHappened:
      "Marlen's Skills, Rules, and Tools supplies the skills and workflows your coding agents use. This update makes handoffs explain the work and changes involved, with guidance reusable for future GNOME prompts. The changes are prepared.",
    completionEffect:
      "After sign-in and the remaining release checks, I could publish this version. Signing in alone does not publish anything.",
  },
  destinationUrl: "https://www.npmjs.com/login",
}
