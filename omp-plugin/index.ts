import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
declare const process: {
  env: { PATH?: string };
  platform: string;
};

const packageBinUrl = new URL("../bin", import.meta.url);
const packageBinPath = decodeURIComponent(
  process.platform === "win32"
    ? packageBinUrl.pathname.replace(/^\/([A-Za-z]:)/u, "$1").replace(/\//gu, "\\")
    : packageBinUrl.pathname,
);
const pathDelimiter = process.platform === "win32" ? ";" : ":";

export default function marlensSkillsRulesAndTools(pi: ExtensionAPI) {
  if (!process.env.PATH?.split(pathDelimiter).includes(packageBinPath)) {
    process.env.PATH = [process.env.PATH, packageBinPath].filter(Boolean).join(pathDelimiter);
  }

  pi.setLabel("Marlen's Skills, Rules, and Tools");

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
