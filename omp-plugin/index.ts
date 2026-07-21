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
  const { z } = pi.zod;

  if (!process.env.PATH?.split(pathDelimiter).includes(packageBinPath)) {
    process.env.PATH = [process.env.PATH, packageBinPath].filter(Boolean).join(pathDelimiter);
  }

  pi.registerTool({
    name: "github_markdown_image_upload_helper_path",
    label: "GitHub Markdown Image Upload Helper Path",
    description: "Returns the installed helper URL for OMP Browser screenshot uploads.",
    parameters: z.object({}),
    async execute() {
      const helperUrl = new URL(
        "../lib/github-markdown-image-upload-helper.mjs",
        import.meta.url,
      ).href;

      return {
        content: [{ type: "text", text: helperUrl }],
        details: { helperUrl },
      };
    },
  });

  pi.setLabel("Marlen's Skills, Rules, and Tools");

}
