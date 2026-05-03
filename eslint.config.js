import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore patterns — keep dist/ and coverage/ here so IDE ESLint extensions
  // (which read eslint.config.js directly, not the CLI allowlist) do not flag
  // build artifacts. node_modules/ is excluded by ESLint by default.
  {
    ignores: ['dist/**', 'coverage/**', 'src/config/index.js'],
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
    rules: {
      // Test files use inline defineComponent wrappers — multiple components per file is expected
      'vue/one-component-per-file': 'off',
    },
  },
];
