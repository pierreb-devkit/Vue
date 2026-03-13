import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/modules',
  testMatch: '**/*.e2e.tests.js',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npm run generateConfig && npx vite --port 8080',
    port: 8080,
    cwd: '.',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
