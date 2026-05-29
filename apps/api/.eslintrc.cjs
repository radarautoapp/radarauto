module.exports = {
  root: true,
  extends: ["@radar/eslint-config/node"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
