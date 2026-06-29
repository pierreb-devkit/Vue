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
    command: `npx vite --port ${port}`,
    // Gate readiness on an HTTP response (url), not a TCP bind (port): vite accepts
    // the socket before it serves routes, so a port gate lets the first test race
    // the not-yet-serving server (ERR_CONNECTION_REFUSED, #4372). reuseExistingServer
    // stays true: CI pre-starts vite on this port via `npm run dev`; flipping to !CI
    // would self-launch `npx vite` on the occupied port (strictPort:false → :8081 drift).
    url: BASE_URL,
    cwd: '.',
    reuseExistingServer: true,
    stdout: 'pipe',
    timeout: 90000,
  },
});
