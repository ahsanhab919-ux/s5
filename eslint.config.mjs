import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Next.js specific configuration
  ...compat.config({
    extends: ["next/core-web-vitals"],
  }),

  // Apply to JavaScript and JSX files
  {
    files: [
      "**/*.js",
      "**/*.jsx",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.ts",
      "**/*.tsx",
      "**/*.mts",
      "**/*.cts",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        React: "writable",
        JSX: "writable",
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      // parserOptions: {
      //   project: "./tsconfig.json",
      //   tsconfigRootDir: __dirname,
      //   ecmaFeatures: { jsx: true },
      // },
    },
    rules: {
      /* Global Rules */
      all: "off",

      // /* Base Rules */
      "no-undef": "error",
      "no-unused-vars": "off",
      // console.error / console.warn are preserved by the build; everything else
      // is stripped by compiler.removeConsole, so flag stray console.log usage.
      "no-console": ["warn", { allow: ["error", "warn"] }],

      // /* React.js Rules */
      "react/no-unescaped-entities": "off",

      // /* TypeScript Rules */
      // "@typescript-eslint/no-unused-vars": "off",
      // "@typescript-eslint/no-explicit-any": "off",
      // "@typescript-eslint/consistent-type-imports": "warn",

      // /* Next.js Rules */
      // "@next/next/no-img-element": "off",
    },
  },

  // Files and directories to ignore during linting
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "dist/**",
      "build/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.cjs",
      "**/*.config.ts",
      "**/*.config.tsx",
      "**/*.config.mts",
      "**/*.config.cts",
    ],
  },

  // Prettier configuration
  prettierConfig,
];
