import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/config/index.js'],
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
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Test files (Vitest)
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
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
