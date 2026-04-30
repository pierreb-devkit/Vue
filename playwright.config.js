import { defineConfig } from '@playwright/test';
import { BASE_URL, port } from './src/lib/helpers/e2e/config.js';

export default defineConfig({
  testDir: './src/modules',
  testMatch: '**/*.e2e.tests.js',
  timeout: 30000,
  retries: 0,
  // Run tests serially to avoid CDP-intercept timing races between concurrent browser
  // contexts sharing the same Playwright worker. Context.addInitScript() + route mocks
  // registered for test N must not interfere with the bootstrap of test N+1 when both
  // run inside the same browser process simultaneously.
  workers: 1,
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `npx vite --port ${port}`,
    port,
    cwd: '.',
    reuseExistingServer: true,
    stdout: 'pipe',
    timeout: 90000,
  },
});
