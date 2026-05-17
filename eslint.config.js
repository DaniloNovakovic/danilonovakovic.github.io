import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "node_modules",
    "dist",
    "dist-ssr",
    "coverage",
    "storybook-static",
    ".pnpm-store",
    ".vite",
    ".turbo",
    ".cache",
    ".eslintcache",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "src/game/sceneLifecycle/contexts/**/*.{ts,tsx}",
      "src/game/scenes/**/sceneContext.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/sharedSceneRuntime", "**/sharedSceneRuntime/**"],
              message:
                "scene contexts must not import from sharedSceneRuntime; pass shared runtime values through scene context options.",
            },
          ],
        },
      ],
    },
  },
]);
