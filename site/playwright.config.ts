/**
 * End-to-end tests against the production build served by the Workers
 * runtime (`npm run build` first). Run with `npm run test:e2e`.
 */
import {defineConfig, devices} from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4399);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'en-GB',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 900}}}],
  webServer: {
    command: `npx astro preview --port ${PORT} --host 127.0.0.1 --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
