// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
      all: true,
    },
    environment: 'node',
    includeSource: ['src/**/*.{js,ts}'],
    testTimeout: 10000,
  },
})
