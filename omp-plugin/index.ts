import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { registerLearnerPlugin } from "./learner.mjs";

export default function marlensSkillsRulesAndTools(pi: ExtensionAPI) {
  pi.setLabel("Marlen's Skills, Rules, and Tools");
  registerLearnerPlugin(pi);

  pi.registerCommand("marlens-skills-rules-and-tools", {
    description: "Ask the agent to use Marlen's installed skills, rules, and tools for this task.",
    handler: async (args) => {
      const scope = args.trim();
      const suffix = scope ? ` for: ${scope}` : " for this task";

      pi.sendMessage(
        {
          customType: "marlens-skills-rules-and-tools",
          content: `Use Marlen's installed skills, rules, and tools${suffix}. Read only the relevant skill/workflow before acting.`,
          display: true,
          attribution: "user",
        },
        { deliverAs: "followUp", triggerTurn: true },
      );
    },
  });
}
