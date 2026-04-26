import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore patterns (only entries that fall within the lint allowlist; broad
  // top-level dirs like dist/, node_modules/, coverage/ are excluded by virtue
  // of the allowlist scoping in package.json scripts).
  {
    ignores: ['src/config/index.js'],
  },
  // Base configurations
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  // Source files (browser environment)
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-console': 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  // Config files (Node environment)
  {
    files: ['*.config.js', 'scripts/**/*.js', 'src/config/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Test files (Vitest)
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js', '**/*.tests.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        global: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
];
