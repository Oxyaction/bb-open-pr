module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["airbnb-typescript/base", "plugin:prettier/recommended"],
  parserOptions: {
    root: true,
    tsconfigRootDir: __dirname,
    project: './tsconfig.lint.json',
  },
  plugins: ["import", "prettier"],
  env: { jest: true, node: true },
  ignorePatterns: ["**/*.js", "node_modules", ".turbo", "build", "coverage", "test.ts"],
};
