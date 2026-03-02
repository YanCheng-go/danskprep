import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  outputDir: '../docs/test-reports/screenshots',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-light',
      use: {
        ...devices['iPhone 13'],
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile-dark',
      use: {
        ...devices['iPhone 13'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'tablet-light',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
      },
    },
    {
      name: 'tablet-dark',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'desktop-light',
      use: {
        viewport: { width: 1280, height: 800 },
        colorScheme: 'light',
      },
    },
    {
      name: 'desktop-dark',
      use: {
        viewport: { width: 1280, height: 800 },
        colorScheme: 'dark',
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
