import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    name: "jsx-a11y/strict",
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    rules: jsxA11y.flatConfigs.strict.rules,
  },
  {
    name: "custom-rules",
    rules: {
      "max-lines-per-function": ["warn", { max: 30, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 3],
      "max-params": ["warn", 4],
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
]);

export default eslintConfig;
