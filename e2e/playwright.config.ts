import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  outputDir: '../docs/test-reports/test-results',
  timeout: 30_000,
  expect: { timeout: 10000 },
  retries: 0,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5180',
    screenshot: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'mobile-light',
      use: {
        viewport: { width: 375, height: 812 },
        colorScheme: 'light',
        browserName: 'chromium',
      },
    },
    {
      name: 'mobile-dark',
      use: {
        viewport: { width: 375, height: 812 },
        colorScheme: 'dark',
        browserName: 'chromium',
      },
    },
    {
      name: 'tablet-light',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
        browserName: 'chromium',
      },
    },
    {
      name: 'tablet-dark',
      use: {
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
        browserName: 'chromium',
      },
    },
    {
      name: 'desktop-light',
      use: {
        viewport: { width: 1280, height: 800 },
        colorScheme: 'light',
        browserName: 'chromium',
      },
    },
    {
      name: 'desktop-dark',
      use: {
        viewport: { width: 1280, height: 800 },
        colorScheme: 'dark',
        browserName: 'chromium',
      },
    },
  ],
})
