import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.vitest.js'],
    pool: 'threads',
    testTimeout: 10000,
    hookTimeout: 10000,
    name: 'unit',
    include: [
      'src/**/*.test.js',
      'src/**/*.unit.test.js'
    ],
    exclude: [
      'src/**/*.integration.test.js',
      'src/**/*.e2e.test.js',
      'src/**/*.load.test.js',
      'src/**/*.performance.test.js',
      'src/**/*.security.test.js',
      'src/**/*.playwright.test.js',
      'src/**/*.e2e.playwright.test.js',
      'src/routes/**/*.test.js',
      'src/__tests__/integration/**',
      'src/__tests__/e2e/**',
      'src/__tests__/load/**',
      'src/__tests__/performance/**',
      'src/__tests__/security/**',
      'src/__tests__/playwright/**',
      'src/models/**/*.test.js',  // Exclude model tests - they use integration setup
      'node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/__tests__/**',
        'coverage/**',
        '**/*.config.js',
        'scripts/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@test': path.resolve(__dirname, 'src/test')
    }
  }
});