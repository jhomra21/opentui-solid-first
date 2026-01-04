import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/typescript";
import tseslint from "typescript-eslint";

export default [
  // Ignore patterns
  {
    ignores: ["node_modules/**", "dist/**"],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Solid rules for TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    ...solid,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // =====================================================================
      // SOLID RULES (from eslint-plugin-solid)
      // Based on SOLID_GUIDELINES.md
      // =====================================================================

      // MUST: Never destructure props - breaks reactivity
      "solid/no-destructure": "error",

      // MUST: Use <For> and <Show> instead of .map() and &&
      "solid/prefer-for": "error",
      "solid/prefer-show": "warn",

      // MUST: Use class not className
      "solid/no-react-specific-props": "error",

      // MUST: Solid doesn't use dependency arrays
      "solid/no-react-deps": "error",

      // Catch reactivity issues (signals not called, props accessed wrong)
      "solid/reactivity": "warn",

      // Components should return once - use <Show> for conditionals
      "solid/components-return-once": "warn",

      // Enforce consistent event handler naming
      "solid/event-handlers": "warn",

      // JSX validation
      "solid/jsx-no-duplicate-props": "error",
      "solid/jsx-no-undef": "error",
      "solid/jsx-uses-vars": "error",

      // =====================================================================
      // TYPESCRIPT RULES
      // =====================================================================

      // Warn on explicit any - prefer proper typing
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow unused vars starting with _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // =====================================================================
      // GENERAL RULES
      // =====================================================================

      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "warn",
      eqeqeq: ["warn", "always"],
    },
  },
];
