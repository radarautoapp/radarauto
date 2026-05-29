/**
 * @radar/eslint-config/react
 *
 * Estende a base e adiciona regras pra React/Next.js.
 */
module.exports = {
  extends: [
    "./index.js",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/react-in-jsx-scope": "off", // Next.js não precisa
    "react/prop-types": "off", // usamos TypeScript
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
