import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
declare const process: {
  env: { PATH?: string }
  platform: string
}

const packageBinUrl = new URL("../bin", import.meta.url)
const packageBinPath = decodeURIComponent(
  process.platform === "win32"
    ? packageBinUrl.pathname.replace(/^\/([A-Za-z]:)/u, "$1").replace(/\//gu, "\\")
    : packageBinUrl.pathname
)
const pathDelimiter = process.platform === "win32" ? ";" : ":"

export function marlensSkillsRulesAndTools(pi: ExtensionAPI) {
  const { z } = pi.zod

  if (!process.env.PATH?.split(pathDelimiter).includes(packageBinPath)) {
    process.env.PATH = [process.env.PATH, packageBinPath].filter(Boolean).join(pathDelimiter)
  }

  pi.registerCommand("privilege-preview", {
    description: "Open the safe native GNOME privilege demo",
    getArgumentCompletions(prefix) {
      if (!"demo".startsWith(prefix)) return null

      return [{ value: "demo", label: "demo", description: "No authentication or execution" }]
    },
    async handler(args, ctx) {
      if (args.trim() !== "demo") {
        ctx.ui.notify("Usage: /privilege-preview demo", "info")
        return
      }

      if (process.platform !== "linux") {
        ctx.ui.notify("Privilege preview requires a Linux desktop with GTK4/libadwaita.", "error")
        return
      }

      ctx.ui.notify("Opening the safe GNOME demo. No authentication or execution.", "info")
      try {
        const { stdout, stderr, code } = await pi.exec(
          "node",
          [`${packageBinPath}/privilege-preview`, "--demo"],
          { cwd: ctx.cwd }
        )
        if (code === 0) {
          ctx.ui.notify("Privilege preview demo completed. Nothing was executed.", "info")
        } else if (code === 3) {
          ctx.ui.notify("Privilege preview demo cancelled.", "info")
        } else if (code === 4) {
          ctx.ui.notify("Privilege preview demo expired.", "info")
        } else {
          ctx.ui.notify(
            `Privilege preview failed: ${stdout.trim() || stderr.trim() || `exit ${code}`}`,
            "error"
          )
        }
      } catch (error) {
        ctx.ui.notify(
          `Cannot open privilege preview: ${error instanceof Error ? error.message : String(error)}`,
          "error"
        )
      }
    },
  })

  pi.registerTool({
    name: "github_markdown_image_upload_helper_path",
    label: "GitHub Markdown Image Upload Helper Path",
    description: "Returns the installed helper URL for OMP Browser screenshot uploads.",
    parameters: z.object({}),
    async execute() {
      const helperUrl = new URL("../lib/github-markdown-image-upload-helper.mjs", import.meta.url)
        .href

      return {
        content: [{ type: "text", text: helperUrl }],
        details: { helperUrl },
      }
    },
  })

  pi.registerTool({
    name: "github_pr_screenshot_upload_path",
    label: "GitHub PR Screenshot Upload Path",
    description: "Returns the installed uploader URL for OMP Browser PR-body screenshot uploads.",
    parameters: z.object({}),
    async execute() {
      const uploaderUrl = new URL("../lib/github-pr-screenshot-upload.mjs", import.meta.url).href

      return {
        content: [{ type: "text", text: uploaderUrl }],
        details: { uploaderUrl },
      }
    },
  })

  pi.setLabel("Marlen's Skills, Rules, and Tools")
}

export default marlensSkillsRulesAndTools
