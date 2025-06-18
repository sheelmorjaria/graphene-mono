import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.e2e.js'],
    pool: 'threads',
    testTimeout: 60000,
    hookTimeout: 30000,
    name: 'e2e',
    include: [
      'src/**/*.e2e.test.js',
      'src/__tests__/e2e/**/*.test.js',
      'src/__tests__/userManagement.e2e.test.js'
    ],
    exclude: [
      'node_modules/**'
    ],
    maxConcurrency: 1, // E2E tests should run sequentially
    coverage: {
      provider: 'c8',
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