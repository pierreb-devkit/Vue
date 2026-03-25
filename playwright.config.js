import { defineConfig } from '@playwright/test';
import { BASE_URL, port } from './src/lib/helpers/e2e/config.js';

export default defineConfig({
  testDir: './src/modules',
  testMatch: '**/*.e2e.tests.js',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `npm run generateConfig && npx vite --port ${port}`,
    port,
    cwd: '.',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
