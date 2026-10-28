// Lint settings for the frontend. Run:  npm run lint
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build/", ".react-router/", ".vercel/", "node_modules/", "backend/", "app/myenv/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Most components still take `props: any`; typing them is ongoing work, not a lint failure.
      "@typescript-eslint/no-explicit-any": "off",
      // A leading underscore marks something kept on purpose though not yet used.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
