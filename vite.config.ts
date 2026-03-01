/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // @ts-expect-error vitest augments UserConfig with 'test'
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
