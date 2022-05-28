module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true,
    jest: true,
  },
  extends: ['plugin:vue/essential', '@vue/airbnb', 'plugin:markdown/recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier', 'markdown'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': 0,
    'no-param-reassign': 0,
    'global-require': 0,
    'prefer-destructuring': ['error', { object: false, array: false }],
    'import/no-dynamic-require': 0,
    'consistent-return': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'operator-linebreak': 0,
    'vue/multi-word-component-names': 0,
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 13,
    sourceType: 'module',
    requireConfigFile: false,
  },
  overrides: [
    {
      files: ['**/__tests__/*.{cj,j,t}s?(x)', '**/tests/unit/**/*.spec.{cj,j,t}s?(x)', '*.vue'],
    },
  ],
};
