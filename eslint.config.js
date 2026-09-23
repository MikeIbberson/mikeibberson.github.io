import js from "@eslint/js";
import globals from "globals";
import unicorn from "eslint-plugin-unicorn";

/**
Aggressive flat config: ESLint recommended + Unicorn recommended + extras.
*/
export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  unicorn.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Correctness / hygiene
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-alert": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": ["error", { destructuring: "all" }],
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "no-useless-return": "error",
      "no-param-reassign": ["error", { props: false }],
      "consistent-return": "error",
      complexity: ["warn", 35],
      "max-depth": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],

      // Unicorn: keep recommended, dial a few for this Vite/Three.js app
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/prefer-ternary": "off",
      // Hex colors (`0xffaa00`) and short loop/math names are normal in Three.js
      "unicorn/number-literal-case": "off",
      "unicorn/numeric-separators-style": "off",
      "unicorn/name-replacements": "off",
      // Module-level `let` mutated from handlers/rAF is intentional game-loop state
      "unicorn/no-top-level-assignment-in-function": "off",
      // One-shot procedural canvas textures; Path2D reuse adds little here
      "unicorn/prefer-path2d": "off",
      // Short block comments are fine; don't force awkward multiline wraps
      "unicorn/single-line-block-comment-style": "off",
      "unicorn/filename-case": [
        "error",
        { case: "camelCase", ignore: ["eslint.config.js", "vite.config.js"] },
      ],
    },
  },
];
