/**
 * @radar/eslint-config/node
 *
 * Estende a base e adiciona regras pra Node.js/NestJS.
 */
module.exports = {
  extends: ["./index.js"],
  env: {
    node: true,
  },
  rules: {
    // NestJS usa decorators que ESLint às vezes não entende perfeito
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};
