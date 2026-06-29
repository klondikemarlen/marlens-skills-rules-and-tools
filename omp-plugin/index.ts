import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function marlensRulesAndSkills(pi: ExtensionAPI) {
  pi.setLabel("Marlen's Rules and Skills");

  pi.registerCommand("marlens-rules-and-skills", {
    description: "Ask the agent to use Marlen's installed rules and skills for this task.",
    handler: async (args) => {
      const scope = args.trim();
      const suffix = scope ? ` for: ${scope}` : " for this task";

      pi.sendMessage(
        {
          customType: "marlens-rules-and-skills",
          content: `Use Marlen's installed rules and skills${suffix}. Read only the relevant skill/workflow before acting.`,
          display: true,
          attribution: "user",
        },
        { deliverAs: "followUp", triggerTurn: true },
      );
    },
  });
}
