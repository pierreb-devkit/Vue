// LOCAL ONLY — not committed. Overrides baseURL/port to use dev server on 5174
// (port 8080 is occupied by nginx on this machine).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/modules',
  testMatch: '**/*.e2e.tests.js',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npx vite --port 5174',
    port: 5174,
    cwd: '.',
    reuseExistingServer: true,
    stdout: 'pipe',
    timeout: 90000,
  },
});
