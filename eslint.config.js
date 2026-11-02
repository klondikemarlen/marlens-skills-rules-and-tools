import javascript from "@eslint/js"
import { defineConfig } from "eslint/config"
import globals from "globals"
import typescript from "typescript-eslint"

export default defineConfig([
  {
    ignores: ["bin/dev"],
  },
  {
    files: ["**/*.{js,mjs,cjs}", "bin/**/!(*.*)"],
    extends: [javascript.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["lib/github-markdown-image-upload-helper.mjs", "lib/github-pr-screenshot-upload.mjs"],
    languageOptions: {
      globals: {
        document: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    extends: [typescript.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
])
