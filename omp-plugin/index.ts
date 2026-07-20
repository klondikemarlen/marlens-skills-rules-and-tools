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

}
