/**
 * @radar/eslint-config — base
 *
 * Propósito: regras lint compartilhadas entre apps e packages.
 * Aplica TypeScript strict rules (Regra 26) e força padrões do projeto.
 */
module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    // TypeScript strict
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // Geral
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
  },
  ignorePatterns: ["node_modules", "dist", ".next", "build", "coverage"],
};
