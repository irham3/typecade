import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import ts from "typescript-eslint";

const eslintConfig = defineConfig([
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: { "react-hooks": hooks, "jsx-a11y": jsxA11y, import: importPlugin },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    settings: { react: { version: "detect" } },
    rules: {
      ...hooks.configs.recommended.rules,
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "off",
      "import/no-anonymous-default-export": "warn",
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },
  ...ts.configs.recommended,
  { rules: { "@typescript-eslint/no-unused-vars": "warn", "@typescript-eslint/no-unused-expressions": "warn" } },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".agents/**",
    ".worktrees/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "dist/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "features/multiplayer/**/*.{ts,tsx}",
      "features/profile/**/*.{ts,tsx}",
      "features/typing/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
