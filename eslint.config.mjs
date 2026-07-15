// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // lib/engine/ is a UI-free pure TS layer. React/Astro dependencies are banned
    // so it stays independently unit-testable and extractable as a standalone package.
    files: ["lib/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "react-dom/*", "astro", "astro/*"],
              message: "lib/engine/ is a UI-free pure TS layer. React/Astro dependencies are banned.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores(["dist/", ".astro/", "node_modules/", "playwright-report/", "test-results/"]),
);
