import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    css: false,
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },

    include: [
      'src/modules/**/tests/**/*.unit.tests.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/lib/**/tests/**/*.unit.tests.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules/**', '**/*.e2e.tests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/helpers/**/*.js',
        'src/lib/services/**/*.js',
        'src/lib/middlewares/**/*.js',
        'src/lib/plugins/**/*.js',
        'src/modules/*/stores/**/*.js',
        'src/modules/app/app.store.js',
      ],
      exclude: [
        'node_modules/',
        '**/tests/**',
        '**/*.config.{js,cjs,mjs,ts}',
        '**/dist/**',
        'src/lib/plugins/index.js',
        'src/lib/plugins/vuetify.js',
        'src/lib/services/config.js',
        'src/lib/helpers/e2e/**',
        'src/lib/plugins/prerender.js',
      ],
      thresholds: {
        perFile: true,
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
